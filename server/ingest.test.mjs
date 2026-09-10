// Exercises ingest.js against real files: a DOCX built here, mammoth's own
// fixtures, and a hand-built PDF. Run: node server/ingest.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { extract, toDescription, extractFaqs, toBlocks } = require('./ingest.js');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

/* ── Build a real .docx (it is a zip of XML) ──────────────────────────────── */

// jszip ships with mammoth, so a real .docx can be built rather than hand-rolling
// ZIP headers (an earlier attempt at that produced a corrupt archive).
const JSZip = require('jszip');

async function zip(files) {
  const z = new JSZip();
  for (const [name, content] of Object.entries(files)) z.file(name, content);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const p = (text, style) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}` +
  `<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

const docxBuffer = await zip({
  '[Content_Types].xml':
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  '_rels/.rels':
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/document.xml':
    '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    p('Bookkeeping Services in Dallas, Texas', 'Heading1') +
    p('Milta provides accurate bookkeeping for Dallas small businesses. We reconcile accounts, manage payables and receivables, and deliver monthly reports you can act on. Our team knows Texas filing requirements.') +
    p('Why it matters', 'Heading2') +
    p('Accurate financial records') +
    p('Tax compliance in Texas') +
    p('Q: Do you serve businesses outside Dallas?') +
    p('A: Yes, we work with clients across Texas and nationwide.') +
    '</w:body></w:document>',
});

/* ── DOCX ─────────────────────────────────────────────────────────────────── */

const docx = await extract(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'dallas.docx');
check('docx: detected as docx', docx.kind === 'docx');
check('docx: title from the H1', docx.fields.meta_title === 'Bookkeeping Services in Dallas, Texas', docx.fields.meta_title);
check('docx: description under 155 chars', docx.fields.meta_description.length <= 155, `${docx.fields.meta_description.length} chars`);
check('docx: description ends on a sentence', /[.!?]$/.test(docx.fields.meta_description), docx.fields.meta_description);
check('docx: intro paragraphs captured', (docx.content.intro?.paragraphs || []).length >= 1);
check('docx: Q/A became an FAQ', docx.content.faqs?.length === 1, JSON.stringify(docx.content.faqs?.[0]));
check('docx: FAQ text excluded from body copy',
  !(docx.content.intro?.paragraphs || []).some((t) => /^Q:/.test(t)));

/* ── mammoth's own fixture: must not throw ───────────────────────────────── */

const fixtures = path.join(process.cwd(), 'node_modules/mammoth/test/test-data');
if (fs.existsSync(path.join(fixtures, 'single-paragraph.docx'))) {
  const r = await extract(fs.readFileSync(path.join(fixtures, 'single-paragraph.docx')), null, 'single-paragraph.docx');
  check('docx fixture parses', !!r.fields.meta_title, r.fields.meta_title);
}

// An empty document must fail loudly, not return a blank proposal.
if (fs.existsSync(path.join(fixtures, 'empty.docx'))) {
  let threw = null;
  try { await extract(fs.readFileSync(path.join(fixtures, 'empty.docx')), null, 'empty.docx'); }
  catch (e) { threw = e.message; }
  check('empty docx is rejected', !!threw, threw);
}

/* ── PDF ──────────────────────────────────────────────────────────────────── */

const text = 'Payroll Services in Austin Texas';
const stream = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`;
const objs = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let pdf = '%PDF-1.4\n';
const offsets = [];
objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const xref = pdf.length;
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

const pdfResult = await extract(Buffer.from(pdf, 'latin1'), 'application/pdf', 'austin.pdf');
check('pdf: detected as pdf', pdfResult.kind === 'pdf');
check('pdf: text extracted', /Payroll Services in Austin/.test(pdfResult.fields.meta_title), pdfResult.fields.meta_title);

/* ── Guards ───────────────────────────────────────────────────────────────── */

let err = null;
try { await extract(Buffer.from('hello'), 'text/plain', 'notes.txt'); } catch (e) { err = e.message; }
check('unsupported type rejected', /only \.docx and \.pdf/i.test(err || ''), err);

err = null;
try { await extract(Buffer.alloc(11 * 1024 * 1024), 'application/pdf', 'big.pdf'); } catch (e) { err = e.message; }
check('oversize file rejected', /limit is 10 MB/.test(err || ''), err);

err = null;
try { await extract(Buffer.alloc(0), 'application/pdf', 'empty.pdf'); } catch (e) { err = e.message; }
check('empty file rejected', /empty file/i.test(err || ''), err);

check('toDescription keeps short text intact', toDescription('Short one.') === 'Short one.');
check('toDescription never exceeds 155',
  toDescription('x'.repeat(400)).length <= 155, String(toDescription('x'.repeat(400)).length));

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
