// Phase 5 — turn an uploaded document into a PROPOSAL for a page.
//
// The one rule this module exists to enforce: extraction proposes, it never
// writes. Nothing in here touches the `pages` table. The route hands the result
// back to the editor, a human looks at it, and the ordinary PATCH endpoint saves
// whatever they approved — so a bad parse can never silently rewrite a live page.
//
// DOCX goes through mammoth, which yields semantic HTML (h1/h2/p/ul), so the
// document's own structure survives and can be mapped onto ServiceLayout
// sections. PDF has no reliable structure, so it degrades to paragraphs of text
// and only the obvious things (title, description, Q/A pairs) are inferred.

const mammoth = require("mammoth");

const MAX_BYTES = 10 * 1024 * 1024;

// Word writes typographic quotes and non-breaking spaces that look identical in
// a browser but differ byte-for-byte from everything already in the database.
const tidy = (s) =>
  (s || "")
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripTags = (html) => decode(String(html).replace(/<[^>]+>/g, " "));

/* ── Parsing ──────────────────────────────────────────────────────────────── */

const KIND_BY_MIME = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/pdf": "pdf",
};

function kindOf(mimetype, filename) {
  if (KIND_BY_MIME[mimetype]) return KIND_BY_MIME[mimetype];
  const ext = String(filename || "").toLowerCase().split(".").pop();
  if (ext === "docx") return "docx";
  if (ext === "pdf") return "pdf";
  return null;
}

async function parseDocx(buffer) {
  const { value: html, messages } = await mammoth.convertToHtml({ buffer });
  return { html, warnings: messages.filter((m) => m.type === "warning").map((m) => m.message) };
}

async function parsePdf(buffer) {
  // pdf-parse v2 exports a class, not the v1 callable. Required lazily so a PDF
  // parser failure cannot stop the server booting for DOCX-only use.
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const { text } = await parser.getText();
    // Rebuild paragraphs: a blank line, or a line ending in sentence punctuation
    // followed by a capital, is a paragraph break. PDFs carry no <p>.
    const paragraphs = String(text || "")
      .split(/\n\s*\n+/)
      .map((p) => tidy(p.replace(/\n/g, " ")))
      .filter((p) => p.length > 1);
    const html = paragraphs.map((p) => `<p>${p}</p>`).join("\n");
    return { html, warnings: [] };
  } finally {
    if (typeof parser.destroy === "function") await parser.destroy();
  }
}

/* ── HTML -> blocks ───────────────────────────────────────────────────────── */

// A flat, ordered list of what the document actually contains.
function toBlocks(html) {
  const blocks = [];
  const re = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const text = tidy(stripTags(m[2]));
    if (!text) continue;
    blocks.push({ tag, text, level: tag.startsWith("h") ? Number(tag[1]) : null });
  }
  return blocks;
}

// "Q: ..." / "A: ..." pairs, or a heading that is a question followed by prose.
//
// Returns the block INDICES it used as well as the pairs. Matching on the cleaned
// text instead would never line up: the stored answer has its "A: " prefix
// stripped, so the original paragraph would fall through into the body copy and
// the same sentence would appear twice on the page.
function extractFaqs(blocks) {
  const faqs = [];
  const consumed = new Set();

  for (let i = 0; i < blocks.length; i++) {
    if (consumed.has(i)) continue;
    const b = blocks[i];

    const qMatch = /^Q[:.)]\s*(.+)/i.exec(b.text);
    if (qMatch) {
      const next = blocks[i + 1];
      const aMatch = next && /^A[:.)]\s*(.+)/i.exec(next.text);
      if (aMatch) {
        faqs.push({ q: tidy(qMatch[1]), a: tidy(aMatch[1]) });
        consumed.add(i).add(i + 1);
        i++;
        continue;
      }
    }

    if (b.level && /\?\s*$/.test(b.text)) {
      const answer = blocks[i + 1];
      if (answer && !answer.level) {
        faqs.push({ q: b.text, a: answer.text });
        consumed.add(i).add(i + 1);
      }
    }
  }
  return { faqs, consumed };
}

const SENTENCE_END = /(?<=[.!?])\s+/;

// Google truncates near 155; aim just under and never cut mid-sentence if a
// sentence boundary is close enough to the limit to be worth using.
function toDescription(text) {
  const clean = tidy(text);
  if (clean.length <= 155) return clean;
  const sentences = clean.split(SENTENCE_END);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).trim().length > 155) break;
    out = (out + " " + s).trim();
  }
  return out || `${clean.slice(0, 152).trimEnd()}...`;
}

/* ── Proposal ─────────────────────────────────────────────────────────────── */

// Everything returned here is a SUGGESTION. Field names match the pages table so
// the editor can apply them one by one, and `sourceCounts` lets the UI say what
// was actually found rather than implying a clean read.
function propose({ html, warnings }, { filename }) {
  const blocks = toBlocks(html);
  const { faqs, consumed } = extractFaqs(blocks);

  const headings = blocks.filter((b, i) => b.level && !consumed.has(i));
  const paragraphs = blocks.filter((b) => b.tag === "p");
  const bullets = blocks.filter((b, i) => b.tag === "li" && !consumed.has(i)).map((b) => b.text);

  // Blocks the FAQ pass already claimed must not appear again as body copy.
  const body = blocks
    .filter((b, i) => b.tag === "p" && !consumed.has(i))
    .map((b) => b.text);

  const title = headings[0]?.text || body[0] || "";
  const description = toDescription(body[0] || headings[1]?.text || "");

  const content = {};
  if (body.length) {
    content.intro = {
      titleLead: headings[0]?.text || "",
      paragraphs: body.slice(0, 6),
    };
  }
  if (bullets.length) {
    content.whyEssential = {
      titleLead: headings.find((h) => h.level > 1)?.text || "",
      items: bullets,
    };
  }
  if (faqs.length) content.faqs = faqs;

  return {
    fields: {
      meta_title: title.slice(0, 120),
      meta_description: description,
    },
    content,
    stats: {
      source: filename,
      headings: headings.length,
      paragraphs: paragraphs.length,
      bullets: bullets.length,
      faqs: faqs.length,
      warnings,
    },
  };
}

async function extract(buffer, mimetype, filename) {
  if (!buffer || !buffer.length) throw new Error("Empty file.");
  if (buffer.length > MAX_BYTES) {
    throw new Error(`File is ${(buffer.length / 1048576).toFixed(1)} MB; the limit is 10 MB.`);
  }

  const kind = kindOf(mimetype, filename);
  if (!kind) throw new Error("Only .docx and .pdf files can be read.");

  const parsed = kind === "docx" ? await parseDocx(buffer) : await parsePdf(buffer);
  const proposal = propose(parsed, { filename });

  if (!proposal.stats.headings && !proposal.stats.paragraphs) {
    throw new Error(
      "No text found. If this is a scanned PDF it holds images, not text, and needs OCR.",
    );
  }
  return { kind, ...proposal };
}

const MIME_BY_KIND = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

module.exports = { extract, kindOf, MIME_BY_KIND, MAX_BYTES, tidy, toDescription, toBlocks, extractFaqs, propose };
