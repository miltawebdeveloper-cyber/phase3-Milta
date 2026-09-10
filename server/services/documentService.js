// Read an uploaded document and pull out the five fields.
//
// The document is the source of the CONTENT; it is never the source of WHICH page
// gets updated. That comes from the page id the user selected — see §13 of the
// spec and contentService.applyDocument.
//
// Supported: .docx .pdf .xlsx .csv .txt .html
//
// XLSX is read by a small reader in this file rather than the npm `xlsx`
// package, which carries two unfixable high-severity advisories (prototype
// pollution GHSA-4r6h-8v6p-xvw6, ReDoS GHSA-5pgg-2g8v-p4x9) because SheetJS
// moved distribution off npm. The documents this handles are label/value tables,
// so a reader over sharedStrings + sheet1 covers the case without the risk.

const mammoth = require("mammoth");
const JSZip = require("jszip");
const layoutService = require("./layoutService");

const MAX_BYTES = 10 * 1024 * 1024;

/* ── Field labels ─────────────────────────────────────────────────────────── */

// Field -> the labels a document might use for it. Order matters only in that
// longer, more specific labels are tried first ("meta title" before "title").
const FIELD_LABELS = {
  meta_title: ["meta title", "metatitle", "meta_title", "page title", "seo title", "title"],
  meta_description: [
    "meta description", "metadescription", "meta_description",
    "page description", "seo description", "description",
  ],
  meta_keywords: ["meta keywords", "keywords", "meta_keywords", "key words", "seo keywords"],
  canonical: ["canonical url", "canonical link", "canonical_url", "canonical"],
  content: ["content", "page content", "body", "body content"],
};

// The fields a document CAN carry. None of them is required: an upload applies
// whatever it found and leaves every other column untouched. They were once
// all-or-nothing, which meant a perfectly good page of copy was refused outright
// for want of a "Meta Keywords:" line.
const DOCUMENT_FIELDS = ["meta_title", "meta_description", "meta_keywords", "canonical", "content"];

const FIELD_TITLES = {
  meta_title: "Meta Title",
  meta_description: "Meta Description",
  meta_keywords: "Keywords",
  canonical: "Canonical URL",
  content: "Content",
};

// One flat list of [field, label], longest label first so "meta title" wins over
// "title" on a line that contains both.
const LABEL_INDEX = Object.entries(FIELD_LABELS)
  .flatMap(([field, labels]) => labels.map((label) => ({ field, label })))
  .sort((a, b) => b.label.length - a.label.length);

class DocumentError extends Error {
  constructor(message) {
    super(message);
    this.name = "DocumentError";
  }
}

/* ── Text helpers ─────────────────────────────────────────────────────────── */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

const decodeEntities = (s) =>
  String(s).replace(/&([a-z]+|#\d+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m);

const stripTags = (html) => decodeEntities(String(html).replace(/<[^>]+>/g, "\n"));

// Word's typographic characters look identical but differ byte-for-byte from
// everything already in the database.
const tidy = (s) =>
  String(s || "")
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[ \t]+/g, " ")
    .trim();

// Real markup, not a stray "<" or a mathematical comparison.
const looksLikeHtml = (s) => /<(\/?)(p|div|h[1-6]|ul|ol|li|table|section|span|strong|em|a|br)\b[^>]*>/i.test(s || "");

// When a document has no "Content:" label its whole body becomes the page, so
// the metadata lines it does carry ("Meta Title: …") must not also be rendered
// as copy. Drops only a line that OPENS with a known label.
const LABEL_LINE = new RegExp(
  `^\\s*(?:${Object.values(FIELD_LABELS).flat().map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*:`,
  "i",
);

const stripLabelLines = (text) =>
  String(text || "")
    .split(/\r?\n/)
    .filter((line) => !LABEL_LINE.test(line))
    .join("\n");

/* ── Format readers ───────────────────────────────────────────────────────── */

const EXT_BY_MIME = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "text/plain": "txt",
  "text/html": "html",
};

function kindOf(mimetype, filename) {
  const ext = String(filename || "").toLowerCase().split(".").pop();
  if (["docx", "pdf", "xlsx", "csv", "txt", "html", "htm"].includes(ext)) {
    return ext === "htm" ? "html" : ext;
  }
  return EXT_BY_MIME[mimetype] || null;
}

async function readDocx(buffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return { text: stripTags(html), html };
}

async function readPdf(buffer) {
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const { text } = await parser.getText();
    return { text: String(text || ""), html: null };
  } finally {
    if (typeof parser.destroy === "function") await parser.destroy();
  }
}

const readTxt = (buffer) => ({ text: buffer.toString("utf8"), html: null });

const readHtml = (buffer) => {
  const raw = buffer.toString("utf8");
  return { text: stripTags(raw), html: raw };
};

// RFC4180-ish: quoted fields, doubled quotes, embedded newlines.
function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

// A label/value table becomes "Label: value" lines, which the same label parser
// then reads — one extraction path for every format.
const rowsToLabelledText = (rows) =>
  rows
    .map((r) => (r.length >= 2 ? `${r[0]}: ${r.slice(1).join(" ")}` : r[0]))
    .join("\n");

const readCsv = (buffer) => ({ text: rowsToLabelledText(parseCsv(buffer.toString("utf8"))), html: null });

// Minimal XLSX: the first worksheet's cell values, via sharedStrings.
async function readXlsx(buffer) {
  const zip = await JSZip.loadAsync(buffer);

  const sharedFile = zip.file("xl/sharedStrings.xml");
  const shared = [];
  if (sharedFile) {
    const xml = await sharedFile.async("string");
    // <si> may hold one <t> or several inside <r> runs; concatenate them.
    for (const si of xml.split(/<si\b[^>]*>/).slice(1)) {
      const parts = [...si.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decodeEntities(m[1]));
      shared.push(parts.join(""));
    }
  }

  const sheetName = Object.keys(zip.files).find((n) => /^xl\/worksheets\/sheet1\.xml$/.test(n))
    || Object.keys(zip.files).find((n) => /^xl\/worksheets\/.*\.xml$/.test(n));
  if (!sheetName) throw new DocumentError("That spreadsheet has no readable worksheet.");

  const sheet = await zip.file(sheetName).async("string");
  const rows = [];

  for (const rowXml of sheet.split(/<row\b[^>]*>/).slice(1)) {
    const cells = [];
    for (const m of rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = m[1];
      const inner = m[2];
      const type = (/\bt="([^"]+)"/.exec(attrs) || [])[1];
      const vRaw = (/<v>([\s\S]*?)<\/v>/.exec(inner) || [])[1];
      if (type === "s") cells.push(shared[Number(vRaw)] ?? "");
      else if (type === "inlineStr") {
        cells.push([...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeEntities(x[1])).join(""));
      } else cells.push(vRaw ? decodeEntities(vRaw) : "");
    }
    if (cells.some((c) => String(c).trim())) rows.push(cells);
  }
  return { text: rowsToLabelledText(rows), html: null };
}

const READERS = {
  docx: readDocx, pdf: readPdf, xlsx: readXlsx,
  csv: readCsv, txt: readTxt, html: readHtml,
};

/* ── Label parsing ────────────────────────────────────────────────────────── */

// Find "<label>:" at the start of a line. Returns the matches in document order.
function findLabels(lines) {
  const hits = [];
  const seen = new Set();

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = /^([^:]{1,40}):\s*(.*)$/.exec(trimmed);
    if (!match) return;

    const key = match[1].toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    const hit = LABEL_INDEX.find((l) => l.label === key);
    // First occurrence wins: a document that mentions "Title:" again inside the
    // body must not overwrite the real one.
    if (!hit || seen.has(hit.field)) return;

    seen.add(hit.field);
    hits.push({ field: hit.field, index, inline: match[2] });
  });

  return hits;
}

// Everything from a label until the next label is that field's value.
function valuesFromLabels(text) {
  const lines = String(text).split(/\r?\n/);
  const hits = findLabels(lines);
  const values = {};

  hits.forEach((hit, i) => {
    const next = hits[i + 1];
    const until = next ? next.index : lines.length;
    const rest = lines.slice(hit.index + 1, until).join("\n");
    const combined = [hit.inline, rest].filter((p) => p && p.trim()).join("\n");
    values[hit.field] = combined.replace(/^\s+|\s+$/g, "");
  });

  return values;
}

/* ── Extraction ───────────────────────────────────────────────────────────── */

async function extract(buffer, mimetype, filename) {
  if (!buffer || !buffer.length) throw new DocumentError("The file is empty.");
  if (buffer.length > MAX_BYTES) {
    throw new DocumentError(`The file is ${(buffer.length / 1048576).toFixed(1)} MB; the limit is 10 MB.`);
  }

  const kind = kindOf(mimetype, filename);
  if (!kind) {
    throw new DocumentError("Unsupported file type. Upload a .docx, .pdf, .xlsx, .csv, .txt or .html file.");
  }

  const read = READERS[kind];
  let parsed;
  try {
    parsed = await read(buffer);
  } catch (err) {
    if (err instanceof DocumentError) throw err;
    throw new DocumentError(`That ${kind.toUpperCase()} could not be read: ${err.message}`);
  }

  if (!String(parsed.text || "").trim()) {
    throw new DocumentError(
      kind === "pdf"
        ? "No text found. A scanned PDF holds images rather than text and needs OCR first."
        : "No text found in that document.",
    );
  }

  const values = valuesFromLabels(parsed.text);

  const fields = {};
  for (const field of DOCUMENT_FIELDS) {
    if (field === "content") continue;
    if (values[field]) fields[field] = tidy(values[field]);
  }

  // Content is built as a ServiceLayout section object, never stored as one
  // string. A document that labels a "Content:" block gets only that block
  // structured; one that does not gets its whole body structured, which is the
  // ordinary case — most documents are just the page, with no labels at all.
  const labelled = values.content ?? "";
  let source;

  if (labelled && looksLikeHtml(labelled)) {
    source = { html: labelled, text: stripTags(labelled) };
  } else if (labelled && kind === "docx" && parsed.html) {
    // Word's own formatting is real structure. Take the HTML after the label so
    // the headings and lists survive, rather than the flattened text.
    // Word may emit a heading, paragraph, or div for the label depending on the
    // style used by the author. Falling back to `labelled` for a heading label
    // flattened the banner, CTA, intro, and every section after it.
    const marker = /<(h[1-6]|p|div|section)\b[^>]*>\s*(?:<strong\b[^>]*>)?\s*content\s*:?/i.exec(parsed.html);
    const after = marker ? parsed.html.slice(marker.index + marker[0].length).replace(/^[^>]*>/, "") : null;
    source = after && /<(h[1-6]|ul|ol|table|p)\b/i.test(after)
      ? { html: after, text: stripTags(after) }
      : { html: null, text: labelled };
  } else if (labelled) {
    source = { html: null, text: labelled };
  } else {
    // No "Content:" label — structure the document itself, minus the label lines
    // that carry the meta fields, which are not body copy.
    source = { html: parsed.html, text: stripLabelLines(parsed.text) };
  }

  const { content, stats } = layoutService.toServiceLayout(source);

  // A document with no readable body still yields a hero from its first line;
  // only treat it as carrying content when there is something under the hero.
  const hasBody = !!(content.cardGroups?.length || content.faqs?.length);
  if (hasBody || content.hero?.titleLead) fields.content = content;

  // Nothing here is required any more — a document supplies what it supplies and
  // the editor fills the rest in. `missing` is reported so the UI can say what
  // was not found, but it no longer blocks the upload.
  const present = (f) => {
    const v = fields[f];
    if (v == null) return false;
    return typeof v === "object" ? Object.keys(v).length > 0 : !!String(v).trim();
  };
  const missing = DOCUMENT_FIELDS.filter((f) => !present(f));

  return {
    kind,
    fields,
    content,
    // The readable text of the document, kept so a cross-check has something to
    // measure the page against once the file itself is deleted.
    sourceText: String(parsed.text || "").trim(),
    stats,
    contentFormat: layoutService.CONTENT_FORMAT,
    missing,
    missingTitles: missing.map((f) => FIELD_TITLES[f]),
    found: DOCUMENT_FIELDS.filter((f) => !missing.includes(f)),
    foundTitles: DOCUMENT_FIELDS.filter((f) => !missing.includes(f)).map((f) => FIELD_TITLES[f]),
  };
}

module.exports = {
  extract, kindOf, valuesFromLabels, looksLikeHtml, parseCsv, stripLabelLines,
  MAX_BYTES, DOCUMENT_FIELDS, FIELD_TITLES, DocumentError,
  CONTENT_FORMAT: layoutService.CONTENT_FORMAT,
};
