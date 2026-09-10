// End-to-end check of POST /api/admin/ingest against a running server.
// Requires the API on :5199. Read-only with respect to `pages`.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSZip = require('jszip');

const BASE = 'http://127.0.0.1:5199/api/admin';

const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = l.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const b64 = (b) => Buffer.from(b).toString('base64url');
const payload = b64(JSON.stringify({ sub: 'ingest-check', iat: Date.now(), exp: Date.now() + 6e5 }));
const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
const TOKEN = `${payload}.${mac}`;

// How many pages exist BEFORE any of this runs. The check below is "ingest
// wrote nothing", not "the site has exactly N pages" — hard-coding the count
// meant the suite failed every time a page was legitimately added.
const countPages = async () => {
  const r = await fetch(`${BASE}/pages?pageSize=1`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return (await r.json()).total;
};
const pagesBefore = await countPages();

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const p = (text, style) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}` +
  `<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

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
  p('CPA Services in Plano, Texas', 'Heading1') +
  p('Milta gives Plano businesses year-round CPA support. We handle federal and Texas filings, plan ahead for liabilities, and keep records audit-ready.') +
  p('Q: Do you file state returns?') +
  p('A: Yes, for every state we serve.') +
  '</w:body></w:document>');
const docx = await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

const post = async (buf, name, type, token = TOKEN) => {
  const form = new FormData();
  form.append('document', new Blob([buf], { type }), name);
  const res = await fetch(`${BASE}/ingest`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
};

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// 1. Auth is required.
const anon = await post(docx, 'plano.docx', DOCX_MIME, null);
check('ingest requires auth', anon.status === 401, anon.json?.error);

// 2. Happy path.
const ok = await post(docx, 'plano.docx', DOCX_MIME);
check('docx accepted', ok.status === 200, ok.json?.error || '');
check('title proposed', ok.json?.fields?.meta_title === 'CPA Services in Plano, Texas', ok.json?.fields?.meta_title);
check('description proposed', (ok.json?.fields?.meta_description || '').length > 20);
check('faq extracted', ok.json?.content?.faqs?.length === 1);
check('stats reported', ok.json?.stats?.paragraphs > 0, JSON.stringify(ok.json?.stats));

// 3. The uploaded file must be gone from storage.
const objectPath = ok.json?.storedAs;
const listRes = await fetch(`${env.VITE_SUPABASE_URL}/storage/v1/object/list/ingest`, {
  method: 'POST',
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prefix: '', limit: 100 }),
});
const objects = await listRes.json();
const names = Array.isArray(objects) ? objects.map((o) => o.name) : [];
check('source document deleted after reading', !!objectPath && !names.includes(objectPath),
  `bucket holds ${names.length} object(s)`);

// 4. Rejections.
const bad = await post(Buffer.from('just text'), 'notes.txt', 'text/plain');
check('unsupported type rejected', bad.status === 400 && /docx and \.pdf/i.test(bad.json?.error || ''), bad.json?.error);

const empty = await post(Buffer.alloc(0), 'empty.docx', DOCX_MIME);
check('empty file rejected', empty.status === 400, empty.json?.error);

// 5. Nothing was written to pages.
const total = await countPages();
check('ingest wrote nothing to pages', total === pagesBefore, `${total} (was ${pagesBefore})`);

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
