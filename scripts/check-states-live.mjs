// End to end: publish a state page the way the CMS does, and prove it appears in
// the "areas we serve" listing in a real browser.
//
// The page is created and DELETED again, with the row count asserted back to
// where it started, so this can be re-run without leaving anything behind.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const APP = process.argv[2] || 'http://localhost:5174';
const TEST_URL = '/us/services/zz-states-link-check/';
const TEST_STATE = 'Zzstateland';

const env = {};
for (const line of fs.readFileSync(`${ROOT}/server/.env`, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const H = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};
const REST = `${env.VITE_SUPABASE_URL}/rest/v1`;

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const countPages = async () => {
  const r = await fetch(`${REST}/pages?select=id`, { headers: { ...H, Prefer: 'count=exact' } });
  return Number((r.headers.get('content-range') || '/0').split('/')[1]);
};

const exe = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error('no browser found'); process.exit(1); }

const before = await countPages();
let created = null;
let browser = null;

try {
  // 1. Baseline: the listing must not mention the page before it exists.
  browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const readListing = async () => {
    await page.goto(`${APP}/areas-we-serve`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction(() => !!document.querySelector('#root h1'), { timeout: 30000 });
    // The listing renders from static data first and merges the database in, so
    // give the merge a moment to land before reading the DOM.
    await new Promise((r) => setTimeout(r, 2500));
    return page.evaluate(() => ({
      text: document.body.innerText,
      hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    }));
  };

  const baseline = await readListing();
  check('listing renders', /areas|state/i.test(baseline.text), `${baseline.hrefs.length} links`);
  check('existing state links are present',
    baseline.hrefs.some((h) => h.includes('/us/services/best-bookkeeping-services-in-texas')));
  check('test page absent before it is created', !baseline.hrefs.includes(TEST_URL));

  // 2. Publish a state page, exactly as a CMS upload would leave it.
  const res = await fetch(`${REST}/pages`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify({
      kind: 'service_state', country: 'us', state: TEST_STATE, service: 'Payroll',
      url: TEST_URL, slug: 'zz-states-link-check',
      meta_title: 'Payroll in Zzstateland', meta_description: 'Link check.',
      canonical: `https://www.miltafs.com${TEST_URL}`,
      content: { hero: { titleLead: 'Payroll in Zzstateland', highlight: '' } },
      content_format: 'servicelayout/v1', status: 'published',
    }),
  });
  const body = await res.json();
  created = Array.isArray(body) ? body[0] : body;
  check('test page published', res.status === 201 && !!created?.id, created?.message || '');

  // 3. The listing must now link it, without a rebuild.
  const after = await readListing();
  check('newly published page is linked from the listing',
    after.hrefs.includes(TEST_URL),
    after.hrefs.filter((h) => h.includes('zz-states')).join(', ') || 'not found');
  check('its state appears in the listing', new RegExp(TEST_STATE, 'i').test(after.text));
  check('existing links survived the merge',
    after.hrefs.some((h) => h.includes('/us/services/best-bookkeeping-services-in-texas')));
  check('no link was lost', after.hrefs.length >= baseline.hrefs.length,
    `${baseline.hrefs.length} -> ${after.hrefs.length}`);

  // SELECTING the state, not just seeing it listed. The left-hand list was built
  // from the merged set but the detail panel still read the hand-written file, so
  // clicking a state that exists only in the database threw on `.description` and
  // took the whole route down. Listing it was never the hard part.
  const selected = await page.evaluate((name) => {
    const el = [...document.querySelectorAll('.MuiListItemButton-root')]
      .find((n) => (n.innerText || '').trim().startsWith(name));
    if (!el) return { clicked: false };
    el.click();
    return { clicked: true };
  }, TEST_STATE);
  await new Promise((r) => setTimeout(r, 1200));

  const afterClick = await page.evaluate(() => ({
    boundary: /didn't load correctly/i.test(document.body.innerText),
    hasH1: !!document.querySelector('#root h1'),
    showsState: document.body.innerText,
  }));

  check('a CMS-only state can be selected', selected.clicked);
  check('selecting it does not break the page',
    !afterClick.boundary && afterClick.hasH1,
    afterClick.boundary ? 'error boundary rendered' : '');
  check('its panel opens with its own links',
    new RegExp(TEST_STATE, 'i').test(afterClick.showsState));
} finally {
  if (browser) await browser.close();
  if (created?.id) {
    await fetch(`${REST}/page_revisions?page_id=eq.${created.id}`, { method: 'DELETE', headers: H });
    await fetch(`${REST}/pages?id=eq.${created.id}`, { method: 'DELETE', headers: H });
  }
  const restored = await countPages();
  check('test page removed, count back to where it started', restored === before, `${restored} (was ${before})`);
}

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
