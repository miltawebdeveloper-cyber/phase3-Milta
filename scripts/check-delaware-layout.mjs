// Prove the new Delaware section layout renders the same COPY as the live one.
//
// A new template is only safe if it loses nothing. So each Delaware URL is
// rendered twice in a real browser — once at /delaware-preview<url> (the new
// ordered-section layout) and once at <url> (the live ServiceLayout render of
// the same database row) — and the two are compared as multisets of lines.
//
//   node scripts/check-delaware-layout.mjs [origin]
//
// Comparing line multisets rather than word sequences is deliberate, and the
// reason is the whole point of this layout: the new one may put a section
// somewhere else on the page. A positional diff would report every section after
// the first move as different and drown out an actual missing paragraph.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const ROOT = 'd:/milta-web-v3/milta-web';
const ORIGIN = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3000';

const findChrome = () => {
  const c = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  for (const p of c) if (fs.existsSync(p)) return p;
  throw new Error('no chrome found');
};

const rows = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'))
  .filter((r) => r.status === 'published' && /delaware/i.test(r.url))
  .sort((a, b) => a.url.localeCompare(b.url));

const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
const linesOf = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

const bagDiff = (a, b) => {
  const count = (ls) => ls.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
  const A = count(a);
  const B = count(b);
  const only = (x, y) => [...x].flatMap(([l, n]) => Array(Math.max(0, n - (y.get(l) || 0))).fill(l));
  return { inNew: only(A, B), inLive: only(B, A) };
};

// No known deltas.
//
// There used to be three: zero-padded card badges, the intro's invented stat
// trio, and the eyebrows _ServiceLayout supplies when a row stores an empty one.
// They existed because the section components reimplemented the design and drifted
// from it. They now delegate to _ServiceLayout's own renderers, so the two paths
// draw the same markup from the same code and the comparison is exact.
//
// Deliberately left with nothing to excuse: a filter that excuses a difference
// is a filter that can hide a regression, and there is no difference left to
// excuse. Verified by running the whole comparison with filtering removed —
// eight pages, zero differing lines.
const isKnownDelta = () => false;

const read = async (page, url) => {
  const errors = [];
  const onError = (e) => errors.push(String(e));
  const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text()); };
  page.on('pageerror', onError);
  page.on('console', onConsole);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  // Wait for the FOOTER, not just the h1. Both templates load the closing CTA
  // and the footer through React.lazy, so snapshotting on the h1 catches the
  // page mid-hydration and reports the whole footer as missing copy — which is
  // exactly what the first run of this check did.
  await page.waitForFunction(
    () => {
      const r = document.querySelector('#root');
      return r
        && !r.querySelector('.MuiCircularProgress-root')
        && !!r.querySelector('h1')
        // The footer has no landmark element or stable class, so it is detected
        // by the one string only it contains.
        && (r.innerText || '').includes('info@miltafs.com');
    },
    { timeout: 30000, polling: 200 },
  );

  const out = await page.evaluate(() => ({
    title: document.title,
    h1s: [...document.querySelectorAll('h1')].map((e) => e.innerText),
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
    desc: document.querySelector('meta[name=description]')?.getAttribute('content'),
    // Section blocks are counted by their headings, not by a <section> tag.
    // The section components delegate to _ServiceLayout's renderers so the
    // styling cannot drift from the rest of the site, and those draw a <Box>
    // rather than a landmark element.
    sections: document.querySelectorAll('#root h2').length,
    text: document.querySelector('#root')?.innerText || '',
  }));

  page.off('pageerror', onError);
  page.off('console', onConsole);
  return { ...out, errors };
};

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: 'new',
  args: ['--no-sandbox'],
});

let pass = 0;
let fail = 0;
const failures = [];

console.log(`Comparing ${rows.length} Delaware page(s) against ${ORIGIN}\n`);

for (const row of rows) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  try {
    const next = await read(page, `${ORIGIN}/delaware-preview${row.url}`);
    const live = await read(page, `${ORIGIN}${row.url}`);

    const { inNew, inLive } = bagDiff(linesOf(next.text), linesOf(live.text));
    const lostLines = inLive.filter((l) => !isKnownDelta(l));
    const addedLines = inNew.filter((l) => !isKnownDelta(l));

    const detail = [
      ...lostLines.slice(0, 6).map((l) => `\n      missing from the new layout: ${l.slice(0, 100)}`),
      ...addedLines.slice(0, 6).map((l) => `\n      only in the new layout:      ${l.slice(0, 100)}`),
    ].join('');

    const checks = [
      ['exactly one h1', next.h1s.length === 1, `${next.h1s.length} found`],
      ['h1 matches live', norm(next.h1s[0]) === norm(live.h1s[0]), `${norm(next.h1s[0])}\n      live: ${norm(live.h1s[0])}`],
      ['title matches row', next.title === row.meta_title, `${next.title}`],
      ['canonical matches row', next.canonical === row.canonical, `${next.canonical}`],
      ['description matches row', next.desc === row.meta_description, ''],
      ['section blocks rendered', next.sections >= 3, `${next.sections} heading(s)`],
      ['same block count as live', next.sections === live.sections, `${next.sections} vs ${live.sections} live`],
      ['no copy lost', lostLines.length === 0, `${lostLines.length} line(s) lost${detail}`],
      ['no copy invented', addedLines.length === 0, `${addedLines.length} line(s) added${detail}`],
      // Compared against the live page rather than required to be zero. The site
      // has a standing MUI v9 problem — <Stack alignItems> and <Grid item> are no
      // longer valid props, so React logs on every page including the ones this
      // layout does not touch. Requiring silence would fail on a bug that is not
      // this template's; requiring NO MORE THAN the live page still catches one
      // this template introduces.
      ['no new console errors', next.errors.length <= live.errors.length,
        `${next.errors.length} vs ${live.errors.length} live: ${next.errors.slice(0, 2).join(' | ')}`],
    ];

    const bad = checks.filter(([, ok]) => !ok);
    pass += checks.length - bad.length;
    fail += bad.length;

    console.log(`${bad.length ? 'FAIL' : 'ok  '}  ${row.url}  (${next.sections} sections)`);
    for (const [name, , why] of bad) {
      console.log(`      - ${name}${why ? `: ${why}` : ''}`);
      failures.push(`${row.url} :: ${name}`);
    }
  } catch (err) {
    fail += 1;
    failures.push(`${row.url} :: ${err.message}`);
    console.log(`FAIL  ${row.url}\n      - ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();

console.log(`\n${pass} passed, ${fail} failed, across ${rows.length} page(s)`);
process.exit(fail ? 1 : 0);
