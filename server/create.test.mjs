// Creating a new page from a document, end to end against a running server.
//
// The page this creates is deleted at the end and the count asserted back to
// where it started, so the suite can be re-run without accumulating rows.
import fs from 'node:fs';
import crypto from 'node:crypto';

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
const pl = b64(JSON.stringify({ sub: 'create-check', iat: Date.now(), exp: Date.now() + 6e5 }));
const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(pl).digest('base64url');
const auth = { Authorization: `Bearer ${pl}.${mac}` };
const json = { ...auth, 'Content-Type': 'application/json' };

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const api = async (path, opts = {}) => {
  const r = await fetch(BASE + path, opts);
  return { status: r.status, json: await r.json().catch(() => null) };
};

const post = (path, body) => api(path, { method: 'POST', headers: json, body: JSON.stringify(body) });

const countPages = async () => {
  const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/pages?select=count`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Prefer: 'count=exact' },
  });
  return (await r.json())[0].count;
};

const TEST_URL = '/us/services/zz-create-check-page/';
const before = await countPages();

/* ── Read a document, then create from it ─────────────────────────────────── */

const DOC = [
  'Meta Title:', 'Bookkeeping Services in Nowhere, Testland',
  'Meta Description:', 'A page created by the automated create check.',
  'Keywords:', 'create check, nowhere',
  'Canonical URL:', `https://www.miltafs.com${TEST_URL}`,
  'Content:', '<h2>Nowhere</h2>', '<p>Created by a test.</p>',
].join('\n');

const form = new FormData();
form.append('document', new Blob([DOC], { type: 'text/plain' }), 'nowhere.txt');
const preview = await api('/documents/preview', { method: 'POST', headers: auth, body: form });
check('document previewed without creating anything', preview.status === 200 && preview.json.complete);
check('preview did not change the row count', (await countPages()) === before);

const fields = preview.json.fields;

/* ── Validation ───────────────────────────────────────────────────────────── */

check('create needs a URL', (await post('/pages', { state: 'Testland', ...fields, url: '' })).status === 400);
check('create needs a state', (await post('/pages', { ...fields, url: TEST_URL, state: '' })).status === 400);

const badUrl = await post('/pages', { ...fields, url: 'no-leading-slash', state: 'Testland' });
check('URL must start with a slash', badUrl.status === 400, badUrl.json?.error);

const dupe = await post('/pages', {
  ...fields, url: '/us/services/best-bookkeeping-services-in-texas/', state: 'Texas',
});
check('duplicate URL refused', dupe.status === 400 && /already exists/i.test(dupe.json?.error || ''),
  dupe.json?.error);
check('failed creates left the count alone', (await countPages()) === before);

/* ── The happy path ───────────────────────────────────────────────────────── */

const created = await post('/pages', {
  ...fields, url: TEST_URL, state: 'Testland', service: 'Bookkeeping',
  content_format: preview.json.contentFormat, source_file: 'nowhere.txt',
});
check('page created', created.status === 201, created.json?.error);

const page = created.json?.page;
check('created as a DRAFT', page?.status === 'draft', page?.status);
check('kind follows the identity given', page?.kind === 'service_state', page?.kind);
check('slug derived from the url', page?.slug === 'zz-create-check-page', page?.slug);
// The document's markup is not stored verbatim any more — it is turned into
// ServiceLayout sections, so the <h2> shows up as a section heading.
check('content came from the document as a structure',
  page?.content && typeof page.content === 'object' && !Array.isArray(page.content),
  typeof page?.content);
check('the document heading became a section',
  JSON.stringify(page?.content || {}).includes('Nowhere'));
check('content stored as servicelayout/v1', page?.content_format === 'servicelayout/v1',
  page?.content_format);
check('row count went up by one', (await countPages()) === before + 1);

/* ── It is reachable through the dashboard's own queries ──────────────────── */

const states = await api('/states?pageType=state', { headers: auth });
check('new state appears in the state list', states.json.states.includes('Testland'));

const listed = await api('/pages?pageType=state&state=Testland', { headers: auth });
check('new page is listed under its state', listed.json.total === 1, `total=${listed.json?.total}`);

/* ── Publish, then unpublish ──────────────────────────────────────────────── */

const published = await api(`/pages/${page.id}/publish`, { method: 'POST', headers: json });
check('draft can be published', published.status === 200 && published.json.page.status === 'published',
  published.json?.error);

const unpublished = await api(`/pages/${page.id}/unpublish`, { method: 'POST', headers: json });
check('published page can be returned to draft', unpublished.json?.page?.status === 'draft');

/* ── Clean up ─────────────────────────────────────────────────────────────── */

const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/page_revisions?page_id=eq.${page.id}`, { method: 'DELETE', headers: H });
await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/pages?id=eq.${page.id}`, { method: 'DELETE', headers: H });
check('test page removed, count back to where it started', (await countPages()) === before, `${before}`);

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
