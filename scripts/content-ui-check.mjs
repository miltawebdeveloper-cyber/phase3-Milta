// Drive the Content Update dashboard end to end in a browser.
//
// Uses the STATE flow against a published page but only READS it, then runs the
// upload against a DRAFT page and reverts. Nothing published is modified.
import fs from 'node:fs';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const APP = 'http://localhost:5174';

const env = {};
for (const line of fs.readFileSync(`${ROOT}/server/.env`, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const exe = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error('no browser found'); process.exit(1); }

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const text = () => page.evaluate(() => document.body.innerText);
const clickText = (selector, re) => page.evaluate((sel, src) => {
  const rx = new RegExp(src, 'i');
  const el = [...document.querySelectorAll(sel)].find((n) => rx.test(n.innerText || n.textContent));
  if (!el) return false;
  el.click();
  return true;
}, selector, re.source);

const clickTextRetry = async (selector, re, tries = 12) => {
  for (let i = 0; i < tries; i++) {
    if (await clickText(selector, re)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const clickRow = (prefix) => page.evaluate((name) => {
  const items = [...document.querySelectorAll(".MuiListItemButton-root")];
  const el = items.find((n) => (n.innerText || "").trim().toLowerCase().startsWith(name.toLowerCase()));
  if (el) { el.click(); return { ok: true, count: items.length }; }
  return { ok: false, count: items.length, first: items.slice(0, 3).map((n) => (n.innerText || "").trim().split(String.fromCharCode(10))[0]) };
}, prefix);

/* ── Drive it ─────────────────────────────────────────────────────────────── */

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1100 });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`${APP}/admin`, { waitUntil: 'networkidle2', timeout: 60000 });
const b64 = (b) => Buffer.from(b).toString('base64url');
const payload = b64(JSON.stringify({ sub: 'content-ui', iat: Date.now(), exp: Date.now() + 6e5 }));
const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
await page.evaluate((tok, exp) => {
  localStorage.setItem('milta.admin.token', tok);
  localStorage.setItem('milta.admin.expires', String(exp));
}, `${payload}.${mac}`, Date.now() + 6e5);

await page.goto(`${APP}/admin`, { waitUntil: 'networkidle2', timeout: 60000 });
// First render after a cold start also compiles the admin chunk in dev, which
// can take well over the usual timeout. Everything after this is warm.
await page.waitForFunction(() => /Select page type/i.test(document.body.innerText), { timeout: 90000 });

// The four panels of the workflow: add/import a state, give it its data, update
// the page, verify what landed. Separate tabs, one page record underneath.
const tabNames = await page.evaluate(() =>
  [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent.trim()));
check('all four workflow panels are present',
  ['State data', 'Content update', 'Content verification', 'All pages']
    .every((t) => tabNames.includes(t)),
  tabNames.join(' | '));

const openTab = async (label) => {
  await page.evaluate((l) => {
    [...document.querySelectorAll('[role=tab]')].find((t) => t.textContent.trim() === l)?.click();
  }, label);
  await new Promise((r) => setTimeout(r, 1200));
  return page.evaluate(() => document.body.innerText);
};

// State Data — the editorial record behind areas-we-serve.
const statesPanel = await openTab('State data');
check('state data panel lists states',
  /State data/i.test(statesPanel) && /Texas|California|Florida/.test(statesPanel));
check('state data offers Add state', /Add state/i.test(statesPanel));
await page.screenshot({ path: `${ROOT}/db/content-9-statedata.png` });

// Content Verification — the cross-check.
const verifyPanel = await openTab('Content verification');
check('verification panel lists pages with a status',
  /Content verification/i.test(verifyPanel)
  && /(Pending|Updated|Needs review|Completed)/.test(verifyPanel),
  (verifyPanel.match(/(Pending|Updated|Needs review|Completed)\s+\d+/g) || []).join(' '));
await page.screenshot({ path: `${ROOT}/db/content-10-verify.png` });

await openTab('Content update');
await page.waitForFunction(() => /Select page type/i.test(document.body.innerText), { timeout: 30000 });

const step1 = await text();
check('dashboard opens on the type chooser', /STATE/.test(step1) && /CITY/.test(step1));
check('no page list shown before a type is picked', !/Meta title/i.test(step1));
await page.screenshot({ path: `${ROOT}/db/content-1-type.png` });

// STATE flow
check('STATE card clickable', await clickText('.MuiPaper-root', /^\s*STATE/m));
// Wait for the list itself, not the heading: the heading renders immediately and
// the states arrive from the API a moment later.
await page.waitForFunction(
  () => document.querySelectorAll('.MuiListItemButton-root').length > 0
    || !!document.querySelector('.MuiAlert-root'),
  { timeout: 30000 },
);
const statesStep = await text();
check('state list appears', /Texas|California|Florida/.test(statesStep),
  statesStep.split('\n').filter(Boolean).slice(-3).join(' | '));

// The add button must sit on this step, beside "Select a state".
check('add-new button shown next to Select a state',
  /Select a state[\s\S]{0,80}Add a new state page/i.test(statesStep));

// Opening it must not create anything on its own.
check('add-new opens a dialog', await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Add a new state page/i.test(x.textContent));
  if (!b) return false;
  b.click();
  return true;
}));
await page.waitForSelector('[role=dialog]', { timeout: 15000 });
const dialog = await page.evaluate(() => document.querySelector('[role=dialog]').innerText);
check('dialog asks for a document and a URL',
  /Choose document/i.test(dialog) && /Page URL/i.test(dialog) && /State/i.test(dialog));
check('create is blocked until a state and URL are given',
  await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')]
    .some((b) => /Create page/i.test(b.textContent) && b.disabled)));
check('dialog says the page will be a draft', /draft/i.test(dialog));

// State and Service are pickers over what the database already uses, so a page
// cannot be filed under "new york" when every other row says "New York".
check('state and service are dropdowns',
  await page.evaluate(() =>
    document.querySelectorAll('[role=dialog] input[role=combobox]').length >= 2));

// Open the state picker and read what it actually offers.
const stateOptions = await page.evaluate(async () => {
  const input = document.querySelector('[role=dialog] input[role=combobox]');
  if (!input) return [];
  input.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'Tex');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 500));
  return [...document.querySelectorAll('[role=listbox] [role=option]')].map((o) => o.textContent.trim());
});
check('the state picker offers real states', stateOptions.includes('Texas'),
  stateOptions.slice(0, 5).join(', ') || 'no options');

// New pages get the same section editor as everything else, not a raw textarea.
check('new-page dialog offers the section editor',
  /Add a section/i.test(await page.evaluate(() => document.querySelector('[role=dialog]').innerText)));
await page.screenshot({ path: `${ROOT}/db/content-7-newpage.png` });

await page.evaluate(() => {
  [...document.querySelectorAll('[role=dialog] button')].find((b) => /Cancel/i.test(b.textContent))?.click();
});
await page.waitForFunction(() => !document.querySelector('[role=dialog]'), { timeout: 10000 });
// Closing the dialog reloads the state list, which empties it while the request
// is in flight. Wait for Texas to come back, or the click lands on nothing and
// the failure reads like a missing state rather than a race.
await page.waitForFunction(
  () => [...document.querySelectorAll(".MuiListItemButton-root")].some((n) => (n.innerText || "").trim().startsWith("Texas")),
  { timeout: 30000 },
);
await page.screenshot({ path: `${ROOT}/db/content-2-states.png` });

// Find and click in one pass, and report what was on screen if it misses. A bare
// false here is indistinguishable from "Texas is gone", which sent me chasing a
// race that did not exist.
const picked = await page.evaluate(() => {
  const items = [...document.querySelectorAll(".MuiListItemButton-root")];
  const el = items.find((n) => /^Texas/i.test((n.innerText || "").trim()));
  if (el) { el.click(); return { ok: true, count: items.length }; }
  return {
    ok: false,
    count: items.length,
    first: items.slice(0, 3).map((n) => (n.innerText || "").split(String.fromCharCode(10))[0]),
  };
});
check('picked Texas', picked.ok, picked.ok ? picked.count + ' states' : JSON.stringify(picked));
await page.waitForFunction(() => /page[s]? — choose the one to update/i.test(document.body.innerText), { timeout: 20000 });
const pageList = await text();
check('that state\'s pages are listed', /Bookkeeping/i.test(pageList), (pageList.match(/(\d+) pages/) || [])[0]);
await page.screenshot({ path: `${ROOT}/db/content-3-pages.png` });

check('opened a page', await clickTextRetry('.MuiListItemButton-root', /Bookkeeping/));
await page.waitForFunction(() => /Upload document/i.test(document.body.innerText), { timeout: 20000 });
const pageView = await text();
check('page facts shown', /Page Type/.test(pageView) && /Page URL/.test(pageView) && /Last Updated/.test(pageView));
check('upload dropzone present', /Drag a document here/i.test(pageView));
check('editable form present on the page', /Meta Title/.test(pageView) && /Save to database/i.test(pageView));
// Emptiness is REPORTED, not enforced. A draft may be saved half-finished — the
// footer names what is still missing for publishing rather than blocking Save.
// Save stays disabled only while nothing has been edited yet.
check('footer reports completeness without blocking',
  /Up to date|field\(s\) still empty/i.test(pageView),
  (pageView.match(/Up to date|\d+ field\(s\) still empty/i) || [''])[0]);

// A published state page stores its body as ServiceLayout sections, so this
// screen must show the SECTION EDITOR — not the plain/HTML textarea.
//
// Regression guard. PageView used to coerce a structured body to "" on load, so
// this screen rendered an empty textarea, reported the page as having no
// content, and Save wrote that empty string over the page's sections.
check('structured page shows its sections, not a textarea',
  /Hero|Card Groups|Faqs/i.test(pageView) && !/Stored exactly as written/i.test(pageView),
  (pageView.match(/Hero|Card Groups|Faqs/i) || [''])[0]);

check('content is not reported empty on a page that has content',
  !/Content is empty/i.test(pageView));

check('add-a-section offered here too', /Add a section/i.test(pageView));
check('save is not armed before an edit',
  await page.evaluate(() => [...document.querySelectorAll('button')]
    .some((b) => /Save to database/i.test(b.textContent) && b.disabled)));
await page.screenshot({ path: `${ROOT}/db/content-4-page.png`, fullPage: true });

// CITY flow is reachable and kept separate
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => /^Type$/.test(b.textContent.trim()));
  el?.click();
});
await page.waitForFunction(() => /Select page type/i.test(document.body.innerText), { timeout: 20000 });
check('CITY card clickable', await clickText('.MuiPaper-root', /^\s*CITY/m));
await page.waitForFunction(
  () => /Select the state the city is in|No city pages have a state set/i.test(document.body.innerText),
  { timeout: 20000 },
);
check('city flow asks for a state first', /Select the state the city is in|state set/i.test(await text()));
await page.screenshot({ path: `${ROOT}/db/content-5-city.png` });

// Upload against a DRAFT page, via the browse tab (drafts have no state set).
await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role=tab]')].find((x) => /All pages/i.test(x.textContent));
  t?.click();
});
await page.waitForSelector('table tbody tr', { timeout: 25000 });

// Search for the drafts rather than hoping one lands on the first page of 25.
// It used to, and then the table grew.
await page.evaluate(() => {
  const input = [...document.querySelectorAll('input')]
    .find((i) => /search/i.test(i.placeholder || "") || /search/i.test(i.getAttribute('aria-label') || ""));
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'salem');
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 1500));

await page.evaluate(() => {
  const rows = [...document.querySelectorAll('table tbody tr')];
  (rows.find((r) => /draft/i.test(r.innerText)) || rows[0])?.click();
});
await page.waitForFunction(() => /Search appearance/i.test(document.body.innerText), { timeout: 20000 });
check('reached a draft page through the browse tab', /draft/i.test(await text()));

/* ── Upload fills the form and saves nothing until Save is pressed ────────── */

// Back into the Content update tab, onto a Texas page, and read a document.
await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role=tab]')].find((x) => /Content update/i.test(x.textContent));
  t?.click();
});
await page.waitForFunction(() => /Select page type/i.test(document.body.innerText), { timeout: 20000 });
await clickText('.MuiPaper-root', /^\s*STATE/m);
await page.waitForFunction(() => document.querySelectorAll('.MuiListItemButton-root').length > 0, { timeout: 30000 });
await clickRow("Texas");
await page.waitForFunction(() => /choose the one to update/i.test(document.body.innerText), { timeout: 20000 });
await clickTextRetry('.MuiListItemButton-root', /Bookkeeping/);
await page.waitForFunction(() => /Drag a document here/i.test(document.body.innerText), { timeout: 20000 });

// Skip the hidden file input — the first real text field is Meta Title.
const metaTitleValue = () => page.evaluate(() =>
  ([...document.querySelectorAll('input')].find((i) => i.type !== 'file') || {}).value || '');
const titleBefore = await metaTitleValue();

// A labelled TXT document — same parser path as DOCX, no zip needed here.
const DOC = [
  'Meta Title:', 'UI Check Replacement Title',
  'Meta Description:', 'A description supplied by the browser check.',
  'Keywords:', 'ui check, browser, keywords',
  'Canonical URL:', 'https://www.miltafs.com/us/services/ui-check/',
  'Content:', '<h2>UI Check</h2>', '<p>Body written by the browser check.</p>',
].join('\n');

await page.evaluate((body) => {
  const file = new File([body], 'ui-check.txt', { type: 'text/plain' });
  const dt = new DataTransfer();
  dt.items.add(file);
  const el = document.querySelector('input[type=file]');
  el.files = dt.files;
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, DOC);

await page.waitForFunction(
  () => /nothing has been saved yet/i.test(document.body.innerText)
    || !!document.querySelector('.MuiAlert-standardError'),
  { timeout: 45000 },
);
const afterRead = await text();
check('document read into the form', /nothing has been saved yet/i.test(afterRead),
  (afterRead.match(/Read .*/) || [''])[0].slice(0, 60));

const formValues = await page.evaluate(() =>
  [...document.querySelectorAll('input,textarea')].map((el) => el.value).join('\n'));
check('form now holds the document values', /UI Check Replacement Title/.test(formValues));
check('page marked unsaved', /Unsaved changes/i.test(afterRead));
check('save button is enabled', await page.evaluate(() =>
  [...document.querySelectorAll('button')].some((b) => /Save to database/i.test(b.textContent) && !b.disabled)));

// Save must open a preview first, not write. This is the guard that matters: an
// upload's result is a heuristic's guess, and it should be read before it lands.
await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((b) => /Save to database/i.test(b.textContent) && !b.disabled)?.click();
});
await page.waitForSelector('[role=dialog]', { timeout: 15000 });
const preview = await page.evaluate(() => document.querySelector('[role=dialog]').innerText);
check('save opens a preview instead of writing', /Check this before it is saved/i.test(preview));
check('preview lists what changes', /What changes/i.test(preview));
check('preview shows the search result', /In search results/i.test(preview));
check('preview shows the page body', /What the page will say/i.test(preview));
check('preview carries the document values', /UI Check Replacement Title/i.test(preview),
  (preview.match(/UI Check[^\n]*/) || [''])[0].slice(0, 50));
check('preview offers a way back', /Back to editing/i.test(preview));
// Let the dialog finish fading in before capturing, or the shot catches it
// half-transparent and looks like a styling bug.
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${ROOT}/db/content-8-savepreview.png` });

// Backing out must leave the database alone.
await page.evaluate(() => {
  [...document.querySelectorAll('[role=dialog] button')].find((b) => /Back to editing/i.test(b.textContent))?.click();
});
await page.waitForFunction(() => !document.querySelector('[role=dialog]'), { timeout: 10000 });
check('backing out closes the preview', !(await page.evaluate(() => !!document.querySelector('[role=dialog]'))));

// The database must NOT have changed yet.
const liveTitle = await page.evaluate(async () => {
  const t = localStorage.getItem('milta.admin.token');
  const r = await fetch('/api/content/pages?pageType=state&state=Texas', { headers: { Authorization: `Bearer ${t}` } });
  const j = await r.json();
  return (j.rows.find((x) => /Bookkeeping/i.test(x.service)) || {}).meta_title;
});
check('database untouched by the upload alone', liveTitle === titleBefore,
  `db="${liveTitle}"`);

await page.screenshot({ path: `${ROOT}/db/content-6-preview.png` });

// Discard restores the page's own values — proving nothing was committed.
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /Discard changes/i.test(b.textContent))?.click();
});
await page.waitForFunction(() => !/Unsaved changes/i.test(document.body.innerText), { timeout: 15000 });
const afterDiscard = await metaTitleValue();
check('discard restores the original values', afterDiscard === titleBefore, afterDiscard);

await browser.close();
console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
console.log('screenshots: db/content-1-type.png … content-5-city.png');
if (errors.length) console.log('page errors:', errors.slice(0, 3).join(' | '));
process.exit(failures || errors.length ? 1 : 0);
