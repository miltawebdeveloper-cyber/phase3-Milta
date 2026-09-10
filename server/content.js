// Content Update API — mounted at /api/content by server.js.
//
// Every route requires an admin bearer token (the same gate the admin router
// uses). These routes are thin: they parse the request, call a service, and
// shape the response. All decisions live in the services.

const express = require("express");
const multer = require("multer");

const pageService = require("./services/pageService");
const contentService = require("./services/contentService");
const documentService = require("./services/documentService");
const documentFetch = require("./services/documentFetch");
const stateService = require("./services/stateService");
const verificationService = require("./services/verificationService");
const sectionLibrary = require("./services/sectionLibrary");
const serviceTemplates = require("./services/serviceTemplates");
const { requireAdmin } = require("./admin");

const router = express.Router();
router.use(requireAdmin);

// Memory storage, one file, hard size cap. Nothing is ever written to the
// server's own filesystem — on Render that disk is ephemeral.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: documentService.MAX_BYTES, files: 1 },
});

const send = (res, error) => {
  const status = error.status
    || (["DocumentError", "StorageError", "FetchError"].includes(error.name) ? 400 : 500);
  if (status >= 500) console.error("content API error:", error);
  res.status(status).json({ error: error.message || "Request failed." });
};

const pageType = (req) => (String(req.query.pageType || req.query.type) === "city" ? "city" : "state");

/* ── Lookups ──────────────────────────────────────────────────────────────── */

// GET /api/content/states?pageType=state|city
// Every state the CMS knows about — from State Data AND from the pages that
// exist. One list, used by every state picker in the admin.
//
// It used to be derived from pages alone, which made the workflow a dead end: a
// state added in State Data had no pages yet, so it never appeared in the picker
// you would use to give it one. `states` is still a plain array of names so the
// existing callers keep working; `details` carries what the pickers show beside
// each name.
router.get("/states", async (req, res) => {
  try {
    const type = pageType(req);
    const withPages = await pageService.listStates(type);
    const { states: data, tableMissing } = await stateService.listStates();

    const byName = new Map();
    for (const name of withPages) {
      byName.set(name, { name, slug: stateService.slugOf(name), hasPages: true, hasData: false, pages: 0 });
    }
    for (const row of data || []) {
      const existing = byName.get(row.name) || {
        name: row.name, slug: row.slug, hasPages: false, pages: 0,
      };
      byName.set(row.name, {
        ...existing,
        slug: row.slug || existing.slug,
        hasData: !row.unregistered,
        description: row.description || null,
        pages: row.counts?.pages ?? existing.pages,
      });
    }

    const details = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
    res.json({ states: details.map((d) => d.name), details, tableMissing });
  } catch (error) { send(res, error); }
});

// GET /api/content/states/:slug/summary — what a whole-state removal would take
// with it. The dashboard reads this to fill the warning before deleting.
router.get("/states/:slug/summary", async (req, res) => {
  try {
    res.json(await stateService.stateSummary(req.params.slug, { country: req.query.country || "us" }));
  } catch (error) { send(res, error); }
});

// DELETE /api/content/states/:slug — remove a state from the CMS entirely: every
// state page, its history (cascade), and the State Data row. City pages go too
// only when includeCities=true. The client shows a typed confirmation first.
router.delete("/states/:slug", async (req, res) => {
  try {
    const result = await stateService.deleteState(req.params.slug, {
      country: req.query.country || "us",
      includeCities: String(req.query.includeCities) === "true",
    });
    res.json({ deleted: true, ...result });
  } catch (error) { send(res, error); }
});

// GET /api/content/cities?state=Texas&q=dal&limit=50
router.get("/cities", async (req, res) => {
  try {
    const { state, q, limit } = req.query;
    if (!state) return res.status(400).json({ error: "A state is required." });
    res.json({ cities: await pageService.listCities(state, { q, limit: Number(limit) || 50 }) });
  } catch (error) { send(res, error); }
});

/* ── Pages ────────────────────────────────────────────────────────────────── */

// GET /api/content/pages?pageType=city&state=Texas&city=Dallas&q=&page=1
router.get("/pages", async (req, res) => {
  try {
    const { state, city, q, page, pageSize } = req.query;
    res.json(await pageService.listPages({ pageType: pageType(req), state, city, q, page, pageSize }));
  } catch (error) { send(res, error); }
});

// POST /api/content/pages — create a new page.
//
// Used by "Add a new state page": a document is read first (via the preview
// endpoint, which writes nothing), the extracted fields come back here together
// with the state and URL the admin supplied, and the row is created as a DRAFT.
router.post("/pages", async (req, res) => {
  try {
    const result = await pageService.createPage(req.body || {});
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json({ page: result.page });
  } catch (error) { send(res, error); }
});

router.get("/pages/:id", async (req, res) => {
  try {
    const page = await pageService.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found." });
    res.json({ page });
  } catch (error) { send(res, error); }
});

// Manual edit — the secondary fallback, for correcting a page when extraction
// gets something wrong. Not the primary workflow.
router.put("/pages/:id", async (req, res) => {
  try {
    const result = await pageService.updatePage(req.params.id, req.body || {}, {
      editedBy: req.admin.sub,
      note: req.body?.note || "manual edit",
    });
    if (!result) return res.status(404).json({ error: "Page not found." });
    res.json({ page: result.page, ignoredFields: result.ignored });
  } catch (error) { send(res, error); }
});

// Permanent — no revision survives it. The client confirms with the admin
// before ever sending this request.
router.delete("/pages/:id", async (req, res) => {
  try {
    const result = await pageService.deletePage(req.params.id);
    if (!result) return res.status(404).json({ error: "Page not found." });
    res.json({ deleted: true, page: result.page });
  } catch (error) { send(res, error); }
});

// Bulk permanent delete — the dashboard's multi-select. Same no-undo semantics
// as DELETE /pages/:id; the client lists every page in the selection and gets a
// confirmation before this is sent. POST, not DELETE, so the id list travels in
// the body rather than a long URL.
router.post("/pages/bulk-delete", async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ error: "No pages were selected." });
    if (ids.length > 200) {
      return res.status(400).json({ error: "Too many pages in one request — select at most 200." });
    }
    const result = await pageService.deletePages(ids);
    res.json({ deleted: result.deleted.length, requested: result.requested, pages: result.deleted });
  } catch (error) { send(res, error); }
});

/* ── The primary workflow ─────────────────────────────────────────────────── */

// POST /api/content/pages/:id/upload
//
// Upload → extract → update, against the page named in the URL. The document
// never chooses the target.
//
// No field is required. Whatever the document carries is applied; every column
// it does not mention keeps its current value. The body becomes a ServiceLayout
// section object, so an uploaded page is structured exactly like an extracted
// one. 422 is returned only when the file yielded nothing at all.
router.post("/pages/:id/upload", (req, res) => {
  upload.single("document")(req, res, async (uploadErr) => {
    if (uploadErr) {
      const tooBig = uploadErr.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        error: tooBig
          ? `That file is too large; the limit is ${Math.round(documentService.MAX_BYTES / 1048576)} MB.`
          : uploadErr.message,
      });
    }
    if (!req.file) return res.status(400).json({ error: "No document was uploaded." });

    try {
      const result = await contentService.applyDocument(req.params.id, req.file, {
        editedBy: req.admin.sub,
      });
      res.status(result.updated ? 200 : 422).json(result);
    } catch (error) { send(res, error); }
  });
});

// Read a document without writing anything, so the admin can see what a file
// contains before committing to it.
// Two ways in: a real file upload (multipart, handled by `upload.single`), or a
// pasted link (a plain JSON body — multer ignores a non-multipart request and
// leaves `req.body` as express.json() already parsed it, so `req.file` stays
// unset and the branch below runs instead). Either way the result is the same
// shape — { buffer, mimetype, originalname } — so everything past this point
// neither knows nor cares which one happened.
router.post("/documents/preview", (req, res) => {
  upload.single("document")(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const opts = {
      service: req.body?.service || req.query.service || "",
      // The page's own location, so the preview composes the same
      // "<Service> Services in <State>" breadcrumb the saved page will carry —
      // not required, so a preview with nothing to shape it into still works.
      state: req.body?.state || req.query.state || "",
      city: req.body?.city || req.query.city || "",
    };

    try {
      let file = req.file;
      if (!file && req.body?.url) {
        const fetched = await documentFetch.fetchDocument(req.body.url);
        file = { buffer: fetched.buffer, mimetype: fetched.mimetype, originalname: fetched.filename };
      }
      if (!file) return res.status(400).json({ error: "No document was uploaded, and no link was given." });

      res.json(await contentService.previewDocument(file, opts));
    } catch (error) { send(res, error); }
  });
});

// Publishing is its own action, never a side effect of saving content. A new
// page created from a document starts as a draft and only goes live here.
const setStatus = (status) => async (req, res) => {
  try {
    const result = await pageService.updatePage(req.params.id, { status }, {
      editedBy: req.admin.sub,
      note: `status -> ${status}`,
    });
    if (!result) return res.status(404).json({ error: "Page not found." });
    res.json({ page: result.page });
  } catch (error) { send(res, error); }
};

router.post("/pages/:id/publish", setStatus("published"));
router.post("/pages/:id/unpublish", setStatus("draft"));

/* ── History ──────────────────────────────────────────────────────────────── */

router.get("/pages/:id/history", async (req, res) => {
  try {
    res.json({ revisions: await pageService.listRevisions(req.params.id, req.query.limit) });
  } catch (error) { send(res, error); }
});

router.post("/pages/:id/revert", async (req, res) => {
  try {
    const { revisionId } = req.body || {};
    if (!revisionId) return res.status(400).json({ error: "revisionId is required." });
    const result = await pageService.revertPage(req.params.id, revisionId, { editedBy: req.admin.sub });
    if (result.error === "notFound") return res.status(404).json({ error: "Revision not found for this page." });
    res.json({ page: result.page, revertedTo: revisionId });
  } catch (error) { send(res, error); }
});

/* ── State Data ───────────────────────────────────────────────────────────── */
//
// Deliberately its own set of routes, not folded into /pages. State Data is the
// editorial record for a STATE (the copy on /areas-we-serve); a page is one
// service within it. Keeping them apart is what lets the two panels be managed
// independently while pointing at the same state.

router.get("/state-data", async (req, res) => {
  try {
    res.json(await stateService.listStates({ country: req.query.country || "us" }));
  } catch (error) { send(res, error); }
});

router.get("/state-data/:slug", async (req, res) => {
  try {
    const found = await stateService.getState(req.params.slug, { country: req.query.country || "us" });
    // A state with pages but no row of its own is a normal state of affairs
    // until someone fills in its description, so this is not a 404.
    res.json(found);
  } catch (error) { send(res, error); }
});

router.put("/state-data/:slug", async (req, res) => {
  try {
    const result = await stateService.upsertState(
      { ...req.body, name: req.body?.name || req.params.slug },
      { country: req.body?.country || "us" },
    );
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (error) { send(res, error); }
});

/* ── Content verification ─────────────────────────────────────────────────── */

// The whole state's pages with a status on each, so the panel opens on "what
// still needs looking at" rather than making someone click every page to find
// out.
router.get("/verify", async (req, res) => {
  try {
    const { state } = req.query;
    const pages = await pageService.listAllForVerification({ state });
    res.json({
      pages: pages.map((p) => {
        const report = verificationService.verify(p);
        return {
          id: p.id, url: p.url, state: p.state, service: p.service, status: p.status,
          updatedAt: p.updated_at,
          verification: {
            status: report.status, coverage: report.coverage, hasSource: report.hasSource,
            source: report.source, missingCount: report.missingCount,
            sections: report.totals.sections, verifiedAt: report.verifiedAt,
            emptySections: report.emptySections.length,
          },
        };
      }),
      labels: verificationService.STATUS_LABELS,
    });
  } catch (error) { send(res, error); }
});

// One page, in full: the outline, what is missing, and the numbers behind it.
router.get("/verify/:id", async (req, res) => {
  try {
    const page = await pageService.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found." });
    res.json({
      page: {
        id: page.id, url: page.url, state: page.state, service: page.service,
        status: page.status, updatedAt: page.updated_at,
        metaTitle: page.meta_title, contentFormat: page.content_format,
      },
      content: page.content,
      sourceText: page.import_text || null,
      report: verificationService.verify(page),
    });
  } catch (error) { send(res, error); }
});

// Mark as completed — the human half of the check. Tied to a hash of the content
// so that a later edit drops the page back to "Updated" instead of leaving a tick
// against copy nobody has read.
router.post("/verify/:id/complete", async (req, res) => {
  try {
    const page = await pageService.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found." });

    const report = verificationService.verify(page);
    if (report.missingCount > 0 && !req.body?.force) {
      return res.status(409).json({
        error: `${report.missingCount} word(s) from the document are not on the page. Review them, or confirm anyway.`,
        report,
      });
    }

    const result = await pageService.updatePage(req.params.id, {
      verified_at: new Date().toISOString(),
      verified_by: req.admin.sub,
      verified_hash: report.hash,
      verification_note: req.body?.note || null,
    }, { editedBy: req.admin.sub, note: "marked verified", internal: true });

    if (result?.unmigrated) {
      return res.status(503).json({
        error: "Verification is not set up yet — run db/002_states_and_verification.sql.",
      });
    }
    res.json({ page: result.page, report: verificationService.verify(result.page) });
  } catch (error) { send(res, error); }
});

// Undo a sign-off, for when the review turns out to have been wrong.
router.post("/verify/:id/reopen", async (req, res) => {
  try {
    const result = await pageService.updatePage(req.params.id, {
      verified_at: null, verified_by: null, verified_hash: null, verification_note: null,
    }, { editedBy: req.admin.sub, note: "verification reopened", internal: true });
    if (!result) return res.status(404).json({ error: "Page not found." });
    res.json({ page: result.page });
  } catch (error) { send(res, error); }
});

// Section designs already in use, so a page can reuse one instead of rebuilding
// it field by field. Layout only — the words are stripped, because copying copy
// between two indexed URLs is duplicate content.
router.get("/section-library", async (req, res) => {
  try {
    res.json(await sectionLibrary.listDesigns({ q: req.query.q, limit: req.query.limit }));
  } catch (error) { send(res, error); }
});

/* ── Service templates ─────────────────────────────────────────────────────── */

// The eight per-service templates, so the editor can show which one a page will
// be shaped into before a document is uploaded to it. Choosing a service on a
// page is what selects the template; this is how that choice is made visible
// rather than only felt after the upload.
router.get("/service-templates", async (req, res) => {
  try {
    const all = serviceTemplates.listTemplates();
    const service = String(req.query.service || "").trim();
    res.json(service ? (all.find((t) => t.service === service) || null) : { templates: all });
  } catch (error) { send(res, error); }
});

module.exports = router;
