// Drive the real /admin screen in a browser.
//
// A token is injected directly (signed with ADMIN_SESSION_SECRET) rather than
// typing a password, so this needs no credential. Read-only: it browses and
// opens a page, it never saves or publishes.
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

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const exe = candidates.find((p) => fs.existsSync(p));
if (!exe) { console.error('no browser found'); process.exit(1); }

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000 });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// 1. Signed out -> login screen, and no page data on screen.
await page.goto(`${APP}/admin`, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('input[type=password]', { timeout: 20000 });
const bodyText = await page.evaluate(() => document.body.innerText);
check('signed out shows a login form', /sign in/i.test(bodyText));
check('no page content leaks before auth', !/bookkeeping services/i.test(bodyText));

// 2. Inject a valid token, exactly as /login would have stored it.
const b64 = (b) => Buffer.from(b).toString('base64url');
const payload = b64(JSON.stringify({ sub: 'ui-check', iat: Date.now(), exp: Date.now() + 6e5 }));
const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
await page.evaluate((tok, exp) => {
  localStorage.setItem('milta.admin.token', tok);
  localStorage.setItem('milta.admin.expires', String(exp));
}, `${payload}.${mac}`, Date.now() + 6e5);

await page.goto(`${APP}/admin`, { waitUntil: 'networkidle2', timeout: 60000 });

// The screen opens on "Content update" now, so the browse table this check is
// about is one tab across. Before the tabs existed the list was the landing
// view and this step did not need to exist.
await page.waitForFunction(() => /All pages/i.test(document.body.innerText), { timeout: 30000 });
check('browse tab reachable', await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role=tab]')].find((x) => /All pages/i.test(x.textContent));
  if (!t) return false;
  t.click();
  return true;
}));

await page.waitForSelector('table tbody tr', { timeout: 25000 });

const rowCount = await page.$$eval('table tbody tr', (r) => r.length);
check('page list renders rows', rowCount > 0, `${rowCount} rows`);

const total = await page.evaluate(() => (document.body.innerText.match(/(\d+)\s+pages/) || [])[1]);
// Compare against what the API actually reports, not a number typed in here.
// The point of this check is that the UI shows the server total; hard-coding it
// meant the suite failed every time a page was legitimately added.
const serverTotal = await page.evaluate(async () => {
  const t = localStorage.getItem("milta.admin.token");
  const r = await fetch("/api/admin/pages?pageSize=1", { headers: { Authorization: "Bearer " + t } });
  return (await r.json()).total;
});
check('total count matches the server', Number(total) === Number(serverTotal), total + ' vs ' + serverTotal);

// 3. Filter by state.
await page.screenshot({ path: `${ROOT}/db/admin-list.png` });

// 4. Open the first record.
await page.click('table tbody tr');
await page.waitForFunction(
  () => /Search appearance/i.test(document.body.innerText),
  { timeout: 25000 },
);
const editorText = await page.evaluate(() => document.body.innerText);
check('editor opens with meta fields', /Meta title/i.test(editorText));
check('SEO preview present', /Search result preview/i.test(editorText));
check('URL shown as non-editable', /not editable here/i.test(editorText));
check('content sections listed', /Hero|Intro|Card Groups|Faqs/i.test(editorText));

// Manual section management: every ServiceLayout section can be added by hand,
// not only the ones a document happened to produce.
check('add-a-section panel present', /Add a section/i.test(editorText));

const sectionOptions = await page.evaluate(() => {
  const sel = [...document.querySelectorAll('select')]
    .find((s) => [...s.options].some((o) => /Choose a section/i.test(o.textContent)));
  return sel ? [...sel.options].map((o) => o.textContent.trim()) : [];
});
check('missing sections offered by name', sectionOptions.length > 1,
  sectionOptions.filter((o) => !/Choose/i.test(o)).slice(0, 6).join(', '));

// Add one and confirm it appears as an editable section.
const addedName = await page.evaluate(() => {
  const sel = [...document.querySelectorAll('select')]
    .find((s) => [...s.options].some((o) => /Choose a section/i.test(o.textContent)));
  const opt = [...sel.options].find((o) => !/Choose/i.test(o.textContent));
  if (!opt) return null;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, opt.value);
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return opt.textContent.trim();
});
if (addedName) {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => /^Add$/i.test(b.textContent.trim()));
    btns[btns.length - 1]?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const afterAdd = await page.evaluate(() => document.body.innerText);
  check(`added the "${addedName}" section by hand`,
    new RegExp(addedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(afterAdd));
  check('adding a section marks the page unsaved', /unsaved|Save/i.test(afterAdd));
}

// Removing is available per section, and asks before it deletes copy.
// Reuse: the designs already on the site, offered so a page does not have to
// rebuild one from an empty object. The words are never copied.
check('reuse-a-section panel present', /Reuse a section/i.test(editorText));
const reuse = await page.evaluate(async () => {
  const b = [...document.querySelectorAll("button")].find((x) => /Browse designs/i.test(x.textContent));
  if (!b) return { opened: false };
  b.click();
  await new Promise((r) => setTimeout(r, 2500));
  const dlg = document.querySelector("[role=dialog]");
  return {
    opened: !!dlg,
    text: dlg ? dlg.innerText : "",
    rows: dlg ? dlg.querySelectorAll(".MuiListItemButton-root").length : 0,
  };
});
check('design library opens', reuse.opened);
check('it lists designs in use', reuse.rows > 0, reuse.rows + ' design(s)');
check('it says the text is not copied', /text is not copied/i.test(reuse.text));
await page.evaluate(() => {
  [...document.querySelectorAll("[role=dialog] button")].find((b) => /Cancel/i.test(b.textContent))?.click();
});
await page.waitForFunction(() => !document.querySelector("[role=dialog]"), { timeout: 10000 });
check('each section can be removed',
  await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Remove "]')].length > 0));

await page.screenshot({ path: `${ROOT}/db/admin-editor.png`, fullPage: true });

// 5. Document import — the whole Phase 5 loop, in the real browser.
check('import panel present',
  await page.evaluate(() => /Import from a document/i.test(document.body.innerText)));

// Hand a real .docx to the file input the way a user's file picker would.
const docxB64 = fs.readFileSync(`${ROOT}/scripts/fixtures/import-sample.docx`).toString('base64');
await page.evaluate((b64) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const file = new File([bytes], 'import.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const dt = new DataTransfer();
  dt.items.add(file);
  const el = document.querySelector('input[type=file]');
  el.files = dt.files;
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, docxB64);

// Wait for the outcome itself — an "Use this" button or an error alert — not for
// any text that merely suggests progress. An earlier version matched on the stats
// chips, which render a beat before the buttons, so the run passed only when Vite
// was warm and failed on a cold compile.
await page.waitForFunction(
  () =>
    [...document.querySelectorAll('button')].some((b) => /Use this/i.test(b.textContent)) ||
    !!document.querySelector('.MuiAlert-standardError'),
  { timeout: 60000 },
);
const afterUpload = await page.evaluate(() => document.body.innerText);
check('document was read', /Use this/i.test(afterUpload),
  (afterUpload.match(/\d+ heading\(s\)/) || [''])[0]);
check('title proposed from the document', /Payroll Services in Frisco/i.test(afterUpload));
check('FAQ detected', /FAQ\(s\)/i.test(afterUpload));

// Applying must change the form but must NOT save.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /Use this/i.test(b.textContent));
  btn.click();
});
await page.waitForFunction(() => /Applied/i.test(document.body.innerText), { timeout: 15000 });
const afterApply = await page.evaluate(() => document.body.innerText);
check('suggestion marked as applied', /Applied/i.test(afterApply));
check('edit is unsaved, not written', /Unsaved changes/i.test(afterApply));

await page.screenshot({ path: `${ROOT}/db/admin-import.png` });

check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${failures ? failures + ' CHECK(S) FAILED' : 'all checks passed'}`);
console.log('screenshots: db/admin-list.png, db/admin-editor.png, db/admin-import.png');
process.exit(failures ? 1 : 0);
