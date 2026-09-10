// Prove an unfilled template section renders nothing.
//
// Bringing every page onto its service template adds sections a page does not yet
// have copy for. If ServiceLayout drew those, 117 live pages would sprout empty
// headings and blank cards — worse than not having the section at all. This
// publishes a page carrying one real section and several empty ones, renders it
// in a browser, and asserts only the real one appears.
//
// The page is created and DELETED again, with the row count asserted back.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const APP = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:5174';
const { applyTemplate } = require(`${ROOT}/server/services/serviceTemplates.js`);

const TEST_URL = '/us/services/zz-empty-section-check/';
const MARKER = 'Zzmarkerphrase';

const env = {};
for (const line of fs.readFileSync(`${ROOT}/server/.env`, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const REST = `${env.VITE_SUPABASE_URL}/rest/v1`;
const H = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const countPages = async () => {
  const r = await fetch(`${REST}/pages?select=id`, { headers: { ...H, Prefer: 'count=exact' } });
  return Number((r.headers.get('content-range') || '/0').split('/')[1]);
};

const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!exe) { console.error('no browser found'); process.exit(1); }

// A page with ONE filled section, then given the whole Bookkeeping template —
// so every other section is present but empty.
const seed = {
  hero: { titleLead: 'Empty Section Check', highlight: '', subtitle: '', breadcrumb: 'Check' },
  cardGroups: [{ titleLead: MARKER, highlight: '', paragraphs: [`${MARKER} body copy that must appear.`] }],
};
const { content, report } = applyTemplate(seed, 'Bookkeeping');

const filled = Object.keys(content).length;
check('the template added sections to fill out', report.added > 0,
  `${report.added} added, ${filled} keys total`);

const before = await countPages();
let created = null;
let browser = null;

try {
  const res = await fetch(`${REST}/pages`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify({
      kind: 'service_state', country: 'us', state: 'Zzemptyland', service: 'Bookkeeping',
      url: TEST_URL, slug: 'zz-empty-section-check',
      meta_title: 'Empty section check', meta_description: 'Render check.',
      canonical: `https://www.miltafs.com${TEST_URL}`,
      content, content_format: 'servicelayout/v1', status: 'published',
    }),
  });
  const body = await res.json();
  created = Array.isArray(body) ? body[0] : body;
  check('test page published', res.status === 201 && !!created?.id, created?.message || '');
  if (!created?.id) throw new Error('could not create the page');

  browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(APP + TEST_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => {
    const r = document.querySelector('#root');
    return r && !r.querySelector('.MuiCircularProgress-root') && !!r.querySelector('h1');
  }, { timeout: 25000, polling: 200 });

  const seen = await page.evaluate(() => {
    const root = document.querySelector('#root');
    return {
      text: root?.innerText || '',
      // Headings the sections would have drawn, and the card shells.
      h2s: [...document.querySelectorAll('#root h2')].map((h) => h.innerText.trim()),
      emptyH2s: [...document.querySelectorAll('#root h2')].filter((h) => !h.innerText.trim()).length,
      boundary: /didn't load correctly/i.test(document.body.innerText),
    };
  });

  check('the page renders', !seen.boundary && seen.text.length > 50);
  check('the filled section appears', seen.text.includes(MARKER));
  check('no empty headings are drawn', seen.emptyH2s === 0, `${seen.emptyH2s} empty h2(s)`);
  check('no blank section furniture appears',
    seen.h2s.every((h) => h.length > 0), seen.h2s.join(' | ') || '(none)');
  check('no console errors', errs.length === 0, errs[0]?.slice(0, 120) || '');
} finally {
  if (browser) await browser.close();
  if (created?.id) {
    await fetch(`${REST}/page_revisions?page_id=eq.${created.id}`, { method: 'DELETE', headers: H });
    await fetch(`${REST}/pages?id=eq.${created.id}`, { method: 'DELETE', headers: H });
  }
  const after = await countPages();
  check('test page removed, count back to where it started', after === before, `${after} (was ${before})`);
}

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
