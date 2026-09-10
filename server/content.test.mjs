// Content Update API — end-to-end against a running server on :5199.
//
// Writes are confined to ONE draft row (a Salem page) and every change is
// reverted at the end, then asserted. Nothing published is touched.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSZip = require('jszip');
const { valuesFromLabels, looksLikeHtml, parseCsv } = require('./services/documentService.js');

const BASE = 'http://127.0.0.1:5199/api/content';

const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = l.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const b64 = (b) => Buffer.from(b).toString('base64url');
const pl = b64(JSON.stringify({ sub: 'content-check', iat: Date.now(), exp: Date.now() + 6e5 }));
const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(pl).digest('base64url');
const TOKEN = `${pl}.${mac}`;
const auth = { Authorization: `Bearer ${TOKEN}` };

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const get = async (path) => {
  const r = await fetch(BASE + path, { headers: auth });
  return { status: r.status, json: await r.json().catch(() => null) };
};

const postFile = async (path, buf, name, type, token = TOKEN) => {
  const form = new FormData();
  form.append('document', new Blob([buf], { type }), name);
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};

/* ── Document builders ────────────────────────────────────────────────────── */

const LABELLED = (content) => [
  'Meta Title:',
  'Best Accounting Services in Testville',
  '',
  'Meta Description:',
  'Professional accounting services for businesses in Testville.',
  '',
  'Keywords:',
  'testville accounting, testville accountant',
  '',
  'Canonical URL:',
  'https://www.miltafs.com/us/services/test-canonical/',
  '',
  'Content:',
  content,
].join('\n');

const docxOf = async (lines) => {
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`;
  const z = new JSZip();
  z.file('[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels',
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml',
    '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    lines.split('\n').map(p).join('') + '</w:body></w:document>');
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
};

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/* ── Unit: the label parser ───────────────────────────────────────────────── */

const parsed = valuesFromLabels(LABELLED('<h2>Hello</h2>\n<p>World</p>'));
check('parser finds all five labels',
  ['meta_title', 'meta_description', 'meta_keywords', 'canonical', 'content']
    .every((k) => parsed[k]), Object.keys(parsed).join(','));
check('parser keeps content markup', /<h2>Hello<\/h2>/.test(parsed.content || ''));
check('html detected', looksLikeHtml('<p>x</p>') && !looksLikeHtml('a < b and c > d'));
check('csv parses quoted commas',
  parseCsv('a,"b,c"\n1,2')[0][1] === 'b,c', JSON.stringify(parseCsv('a,"b,c"')[0]));

/* ── Lookups ──────────────────────────────────────────────────────────────── */

const states = await get('/states?pageType=state');
check('state list returned', states.status === 200 && states.json.states.length > 0,
  `${states.json?.states?.length} states`);

const cityStates = await get('/states?pageType=city');
check('city-type states are separate', cityStates.status === 200,
  `${cityStates.json?.states?.length} state(s) have city pages`);

const cities = await get('/cities?state=' + encodeURIComponent(cityStates.json.states[0] || 'Texas'));
check('city lookup scoped to a state', cities.status === 200, `${cities.json?.cities?.length} city/cities`);

const noState = await get('/cities');
check('city lookup requires a state', noState.status === 400);

/* ── Page listing ─────────────────────────────────────────────────────────── */

const statePages = await get('/pages?pageType=state&state=Texas');
check('state pages listed for Texas', statePages.status === 200 && statePages.json.total > 0,
  `total=${statePages.json?.total}`);
check('list omits the heavy content column', !('content' in (statePages.json.rows[0] || {})));

const cityPages = await get('/pages?pageType=city');
check('city pages kept separate from state pages',
  cityPages.json.rows.every((r) => r.city), `${cityPages.json.total} city page(s)`);

/* ── The primary workflow, on a DRAFT row only ───────────────────────────── */

const draft = cityPages.json.rows.find((r) => r.status === 'draft');
check('found a draft page to work on', !!draft, draft?.url);
if (!draft) { console.log('\ncannot continue'); process.exit(1); }

const before = (await get(`/pages/${draft.id}`)).json.page;

// §13 — the document names a different canonical; the selected page must win.
const complete = await docxOf(LABELLED('<h2>Accounting in Testville</h2>\n<p>Body copy.</p>'));
const applied = await postFile(`/pages/${draft.id}/upload`, complete, 'testville.docx', DOCX);
check('complete document updates the page', applied.status === 200 && applied.json.updated === true,
  applied.json?.error || JSON.stringify(applied.json?.missing));
check('all five fields reported updated', (applied.json?.updatedFields || []).length === 5,
  (applied.json?.updatedFields || []).join(', '));
check('content stored as servicelayout/v1', applied.json?.contentFormat === 'servicelayout/v1',
  applied.json?.contentFormat);

const after = (await get(`/pages/${draft.id}`)).json.page;
check('meta title written from the document',
  after.meta_title === 'Best Accounting Services in Testville', after.meta_title);

// Content is a ServiceLayout section object, not a string. The document's <h2>
// becomes a section heading rather than markup stored verbatim.
check('content is a structured object',
  after.content && typeof after.content === 'object' && !Array.isArray(after.content),
  typeof after.content);
check('content carries a hero', !!after.content?.hero?.titleLead,
  after.content?.hero?.titleLead);
check('document heading became a section',
  JSON.stringify(after.content).includes('Accounting in Testville'));
check('no raw markup survived into the content',
  !/<h2>|<p>/.test(JSON.stringify(after.content)));

check('§13 url unchanged — document did not retarget the page', after.url === before.url);
check('§13 canonical came from the document, not the URL',
  after.canonical === 'https://www.miltafs.com/us/services/test-canonical/', after.canonical);

// §16 — nothing is required. A document carrying two fields applies those two.
const partial = await docxOf([
  'Meta Title:', 'Partial document', '', 'Content:', 'Only two fields here.',
].join('\n'));
const partialRes = await postFile(`/pages/${draft.id}/upload`, partial, 'partial.docx', DOCX);
check('§16 partial document is accepted', partialRes.status === 200 && partialRes.json.updated === true,
  partialRes.json?.error);
check('§16 only the fields present were updated',
  (partialRes.json?.updatedFields || []).length === 2,
  (partialRes.json?.updatedFields || []).join(', '));

const afterPartial = (await get(`/pages/${draft.id}`)).json.page;
check('§16 the field it carried was written',
  afterPartial.meta_title === 'Partial document', afterPartial.meta_title);
check('§17 fields it did not mention were NOT blanked',
  afterPartial.canonical === after.canonical
  && afterPartial.meta_keywords === after.meta_keywords
  && afterPartial.meta_description === after.meta_description);

// A document with no labels at all — the ordinary case, and the one the old
// all-or-nothing rule made impossible.
const unlabelled = await docxOf('Payroll in Testville\nWe run payroll for local firms.\nWhy Us\nAccurate and on time.');
const unlabelledRes = await postFile(`/pages/${draft.id}/upload`, unlabelled, 'plain-page.docx', DOCX);
check('document with no labels is accepted',
  unlabelledRes.status === 200 && unlabelledRes.json.updated === true, unlabelledRes.json?.error);
check('unlabelled document still produced content',
  (unlabelledRes.json?.updatedFields || []).includes('Content'),
  (unlabelledRes.json?.updatedFields || []).join(', '));

// Plain text is structured too — every upload lands in the same format.
const plainDoc = Buffer.from(LABELLED('Just words, no markup at all here.'), 'utf8');
const plainRes = await postFile(`/pages/${draft.id}/upload`, plainDoc, 'plain.txt', 'text/plain');
check('txt upload accepted', plainRes.status === 200, plainRes.json?.error);
check('txt also stored as servicelayout/v1', plainRes.json?.contentFormat === 'servicelayout/v1',
  plainRes.json?.contentFormat);

// CSV label/value table.
const csv = Buffer.from(
  'Meta Title,CSV Title\nMeta Description,CSV description of the page.\n'
  + 'Keywords,csv keywords\nCanonical URL,https://www.miltafs.com/csv/\nContent,Plain csv body.\n', 'utf8');
const csvRes = await postFile(`/pages/${draft.id}/upload`, csv, 'page.csv', 'text/csv');
check('csv upload accepted', csvRes.status === 200, csvRes.json?.error);
check('csv fields mapped', csvRes.json?.updatedFields?.length === 5);

// Unsupported type.
const bad = await postFile(`/pages/${draft.id}/upload`, Buffer.from('x'), 'a.zip', 'application/zip');
check('unsupported type rejected', bad.status === 400 && /Unsupported file type/i.test(bad.json?.error || ''));

// Unknown page id.
const missingPage = await postFile('/pages/00000000-0000-0000-0000-000000000000/upload', complete, 'x.docx', DOCX);
check('unknown page id rejected', missingPage.status === 404, missingPage.json?.error);

// Auth.
const anon = await postFile(`/pages/${draft.id}/upload`, complete, 'x.docx', DOCX, null);
check('upload requires auth', anon.status === 401);

/* ── History and revert ───────────────────────────────────────────────────── */

const history = await get(`/pages/${draft.id}/history`);
check('history records the document name', history.json.revisions.some((r) => /document: /.test(r.note || '')),
  history.json?.revisions?.[0]?.note);

const oldest = history.json.revisions[history.json.revisions.length - 1];
const reverted = await fetch(`${BASE}/pages/${draft.id}/revert`, {
  method: 'POST',
  headers: { ...auth, 'Content-Type': 'application/json' },
  body: JSON.stringify({ revisionId: oldest.id }),
});
check('revert succeeds', reverted.status === 200);

const restored = (await get(`/pages/${draft.id}`)).json.page;
check('page restored to its original title', restored.meta_title === before.meta_title,
  restored.meta_title);
check('page restored to its original status', restored.status === before.status);

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
