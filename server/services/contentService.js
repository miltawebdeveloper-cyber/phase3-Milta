// The one place the whole upload → update flow is decided.
//
// Three rules from the spec are enforced here and nowhere else, so there is a
// single place to read them and a single place they can be got wrong:
//
//   §13  The page is identified by the id the user selected. The document never
//        chooses the target — not by filename, and not by the canonical URL
//        written inside it.
//
//   §16  No field is required. A document contributes whatever it carries and
//        the page keeps the rest. This replaces the original all-or-nothing
//        rule, which refused a whole page of good copy for want of a
//        "Meta Keywords:" line and made the common case — a document that is
//        simply the page, with no labels in it at all — impossible to upload.
//
//   §17  Nothing is ever partially overwritten. There is no path where a field
//        the document did not mention is blanked out. This is what makes §16
//        safe: "not supplied" and "supplied empty" are different things.

const crypto = require("crypto");
const documentService = require("./documentService");
const storageService = require("./storageService");
const pageService = require("./pageService");
const { applyDocumentStructure } = require("./layoutMerge");
const serviceTemplates = require("./serviceTemplates");
const { templateFor } = serviceTemplates;

const { DOCUMENT_FIELDS, FIELD_TITLES } = documentService;

class ContentError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ContentError";
    Object.assign(this, details);
  }
}

const objectPathFor = (originalname) => {
  const safe = String(originalname || "document").replace(/[^\w.-]+/g, "_").slice(-80);
  return `${Date.now()}-${crypto.randomUUID()}-${safe}`;
};

const MIME_BY_KIND = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  html: "text/html",
};

/**
 * Upload a document against ONE page and apply whatever it carried.
 *
 * @param {string}  pageId    the page the user selected — the source of truth
 * @param {object}  file      multer file: { buffer, originalname, mimetype }
 * @param {object}  options   { editedBy }
 */
async function applyDocument(pageId, file, { editedBy } = {}) {
  // 1. Resolve the target FIRST. If the page does not exist there is nothing to
  //    upload against, and no file should be stored.
  const page = await pageService.getPage(pageId);
  if (!page) throw new ContentError("That page no longer exists.", { status: 404 });

  // 2. Validate the file before spending a storage round-trip on it.
  const kind = documentService.kindOf(file.mimetype, file.originalname);
  if (!kind) {
    throw new ContentError(
      "Unsupported file type. Upload a .docx, .pdf, .xlsx, .csv, .txt or .html file.",
      { status: 400 },
    );
  }
  if (!file.buffer?.length) throw new ContentError("The file is empty.", { status: 400 });

  // 3. Store, read, delete. The document is a processing input, not an archive;
  //    keeping every upload would fill the free tier for no benefit.
  const objectPath = objectPathFor(file.originalname);
  let stored = false;

  try {
    await storageService.put(objectPath, file.buffer, MIME_BY_KIND[kind]);
    stored = true;

    const extracted = await documentService.extract(file.buffer, file.mimetype, file.originalname);

    // 4. Only the fields the document actually carried. Nothing is required, so
    //    a document that names two fields updates two fields; the rest of the
    //    page keeps what it already had. §17 still holds — an absent field is
    //    never written as empty, which is what makes "no required fields" safe.
    const patch = {};
    for (const field of DOCUMENT_FIELDS) {
      const value = extracted.fields[field];
      if (value === undefined || value === null) continue;
      if (typeof value === "object") {
        if (Object.keys(value).length) patch[field] = value;
      } else if (String(value).trim()) {
        patch[field] = value;
      }
    }

    // 5. A document that yielded nothing at all is a failed read, not an update.
    //    Saying so beats writing a revision that changes nothing.
    if (!Object.keys(patch).length) {
      return {
        updated: false,
        reason: "empty",
        page,
        document: file.originalname,
        found: [],
        missing: extracted.missingTitles,
        contentFormat: extracted.contentFormat,
      };
    }

    // 6. The document IS the structure.
    //
    //    This used to work the other way round: the page's own layout was kept
    //    and the document's words were poured into it, with the page's service
    //    template applied first so a Bookkeeping page always carried
    //    Bookkeeping's sections. That preserved a design, but it meant an
    //    uploaded document could not change the shape of a page — the sections
    //    it left out stayed, and sections it never mentioned were added.
    //
    //    Now the page becomes the document: its sections, in its order, and
    //    nothing else. Presentation is inherited where a block matches a section
    //    the page already had, so the styling stays consistent.
    //
    //    applyTemplate still exists and is still right for what it was built
    //    for — giving a page its service's shape as a deliberate action. It is
    //    run by `npm run apply:templates`, not as a side effect of an upload.
    let mergeReport = null;
    if (patch.content && typeof patch.content === "object") {
      // The service's template is the style source for any block the page has
      // no counterpart for, so a Bookkeeping document lands looking like a
      // Bookkeeping page.
      const rebuilt = applyDocumentStructure(page.content, patch.content, {
        template: templateFor(page.service),
        state: page.city || page.state || "",
      });
      patch.content = rebuilt.content;
      mergeReport = rebuilt.report;
    }

    patch.content_format = extracted.contentFormat;

    // Keep the document's TEXT, not the file. The file is deleted below (and
    // should be), but without something to compare against, "did the update land
    // and is any of it missing?" is unanswerable after the fact — which is the
    // whole job of the verification panel. Text is enough: the check is
    // word-level, and the converter is deterministic.
    //
    // Written best-effort. An un-migrated database (db/002 not yet run) has no
    // such column, and a document that updates a page is more important than the
    // audit trail for it.
    patch.import_text = extracted.sourceText || null;
    patch.import_source = file.originalname;
    patch.imported_at = new Date().toISOString();

    const result = await pageService.updatePage(pageId, patch, {
      editedBy,
      note: `document: ${file.originalname}`,
      internal: true,
    });
    if (!result) throw new ContentError("That page no longer exists.", { status: 404 });

    return {
      updated: true,
      page: result.page,
      document: file.originalname,
      // Only the fields a person put in the document. `content_format` and the
      // import_* provenance columns are set by the server, and listing them here
      // showed the editor a row of blank chips — FIELD_TITLES has no name for
      // them, so they mapped to undefined.
      updatedFields: DOCUMENT_FIELDS
        .filter((k) => k in patch)
        .map((k) => FIELD_TITLES[k]),
      missing: extracted.missingTitles,
      contentFormat: extracted.contentFormat,
      updatedAt: result.page?.updated_at,
      // How the page was rebuilt from the document: how many sections it now
      // has, how many inherited presentation from the section they replaced, and
      // which sections the document left out and therefore removed.
      layout: mergeReport,
    };
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw new ContentError(error.message || "Could not process that document.", {
      status: error.name === "DocumentError" || error.name === "StorageError" ? 400 : 500,
    });
  } finally {
    // Always clean up — including on failure. A document that could not be read
    // is exactly the one there is no reason to keep.
    if (stored) await storageService.remove(objectPath);
  }
}

// Read a document without touching the page. Used by the "preview" path so an
// admin can see what would happen before committing to it.
//
// `state`/`city` are the page's identity, not the document's — a document has
// no way to say "Tax Services in Arizona", only "Tax Services". Without them
// here the breadcrumb applyDocumentStructure composes falls back to whatever
// the raw extraction guessed (a banner title cut at 60 characters), and because
// the dashboard saves the preview's content verbatim, that wrong breadcrumb is
// exactly what a document upload against an EXISTING page then persisted — the
// one path (pageService.createPage) that already passed state along got this
// right; this is the other one.
async function previewDocument(file, { service = "", state = "", city = "" } = {}) {
  const kind = documentService.kindOf(file.mimetype, file.originalname);
  if (!kind) {
    throw new ContentError(
      "Unsupported file type. Upload a .docx, .pdf, .xlsx, .csv, .txt or .html file.",
      { status: 400 },
    );
  }
  const extracted = await documentService.extract(file.buffer, file.mimetype, file.originalname);

  // Shape the preview with the SERVICE's template when one is named, so what the
  // admin sees before pressing Create is what the page will actually be. The
  // preview writes nothing either way — this only changes what is shown.
  const fields = { ...extracted.fields };
  let template = null;
  let layout = null;
  if (service && fields.content && typeof fields.content === "object") {
    template = serviceTemplates.templateFor(service);
    if (template) {
      const rebuilt = applyDocumentStructure({}, fields.content, { template, state: city || state });
      fields.content = rebuilt.content;
      layout = rebuilt.report;
    }
  }

  return {
    document: file.originalname,
    // Which template shaped the preview, so the dialog can say so rather than
    // leaving the admin to find out after the page exists.
    template: template ? { service, sections: (template.sections || []).length } : null,
    layout,
    kind: extracted.kind,
    fields,
    content: extracted.content,
    stats: extracted.stats,
    contentFormat: extracted.contentFormat,
    found: extracted.foundTitles,
    missing: extracted.missingTitles,
    // Kept for the UI's wording only. It no longer gates anything: an
    // incomplete document is uploaded just like a complete one.
    complete: extracted.missing.length === 0,
  };
}

module.exports = { applyDocument, previewDocument, ContentError, MIME_BY_KIND };
