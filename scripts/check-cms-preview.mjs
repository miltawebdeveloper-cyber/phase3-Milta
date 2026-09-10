// Prove the database path renders the same page the hard-coded component does.
//
// This is the gate on deleting src/states/. A 200 from curl only means the SPA
// shell loaded, and comparing the CMS render against the row it was built from
// only proves the renderer is self-consistent. So each sampled URL is rendered
// TWICE in a real browser — once at /cms-preview<url> (database -> ServiceLayout)
// and once at <url> (the hard-coded component) — and the two are compared.
//
//   node scripts/check-cms-preview.mjs [origin] [--sample N] [--all]
//
// Sampling is deterministic (an even stride through the published rows, sorted
// by url) so a failure is reproducible and a clean run means the same thing
// twice. Every service is covered: the stride is taken per service.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const ROOT = 'd:/milta-web-v3/milta-web';
const args = process.argv.slice(2);
const ORIGIN = args.find((a) => !a.startsWith('--')) || 'http://localhost:3001';
const ALL = args.includes('--all');
const SAMPLE = Number(args[args.indexOf('--sample') + 1]) || 16;

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

const rows = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'));
const published = rows
  .filter((r) => r.status === 'published')
  .sort((a, b) => a.url.localeCompare(b.url));

// Three URLs that have bitten this project before: the Texas page used as the
// reference row, a California page (the one state that was never refactored),
// and a "...in-the-<state>" URL, whose canonical was wrong in production.
const PINNED = [
  '/us/services/best-bookkeeping-services-in-texas/',
  '/us/services/tax-planning-and-preparation-service-in-california/',
  '/us/services/payroll-management-services-in-the-florida/',
];

const pickSample = () => {
  if (ALL) return published;
  const byService = new Map();
  for (const r of published) {
    const k = r.service || '?';
    if (!byService.has(k)) byService.set(k, []);
    byService.get(k).push(r);
  }
  const perService = Math.max(1, Math.round(SAMPLE / byService.size));
  const out = new Map();
  for (const u of PINNED) {
    const r = published.find((x) => x.url === u);
    if (r) out.set(r.url, r);
  }
  for (const list of byService.values()) {
    const stride = Math.max(1, Math.floor(list.length / perService));
    for (let i = 0; i < list.length && out.size < SAMPLE + PINNED.length; i += stride) {
      out.set(list[i].url, list[i]);
    }
  }
  return [...out.values()].sort((a, b) => a.url.localeCompare(b.url));
};

const samples = pickSample();

// Collapse whitespace so a difference in markup indentation is not read as a
// difference in content. This compares what a reader (and a crawler) sees.
const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();

const read = async (page, url) => {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(
    () => {
      const r = document.querySelector('#root');
      return r && !r.querySelector('.MuiCircularProgress-root') && !!r.querySelector('h1');
    },
    { timeout: 30000, polling: 200 },
  );
  return page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.innerText,
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
    desc: document.querySelector('meta[name=description]')?.getAttribute('content'),
    text: document.querySelector('#root')?.innerText || '',
  }));
};

// Compare the two renders as multisets of lines, not as a word sequence.
//
// The seven StatePageKit pages put the breadcrumb between the h1 and the
// subtitle; ServiceLayout puts it after. Comparing word-by-word, that reordering
// swamps the diff and hides everything downstream of it — the first run of this
// check reported six pages "differing at word 7" and said nothing about the one
// that was actually crashing. Comparing line multisets ignores where a line
// moved to while still catching a line that is missing, added or changed.
const linesOf = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

const bagDiff = (a, b) => {
  const count = (ls) => ls.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
  const A = count(a);
  const B = count(b);
  const only = (x, y) => [...x].flatMap(([l, n]) => Array((Math.max(0, n - (y.get(l) || 0)))).fill(l));
  return { inCms: only(A, B), inLive: only(B, A) };
};

// Differences that are understood, expected, and not content loss. Anything not
// listed here fails, so a new difference cannot hide behind a known one.
//
// StateHero destructures ctaText but renders <ConsultationButton /> with no
// label (src/states/_shared/StatePageKit.jsx:159), so the label those seven
// pages author has never rendered — the component's own default shows instead.
// The CMS render honours the authored label, which is the difference below.
const CONSULTATION_DEFAULT = 'Book a 30 Minutes Free Consultation';

// The kit zero-pads its card badges ("01", "02"); ServiceLayout's numbered-badge
// fallback does not ("1", "2"). Decoration either way — no words change — so a
// bare one- or two-digit line is not treated as a copy difference.
const isBadgeNumber = (line) => /^\d{1,2}$/.test(line);

const isKnownDelta = (line, row) => {
  const cta = row.content?.hero?.ctaLabel;
  return line === CONSULTATION_DEFAULT || (!!cta && line === cta) || isBadgeNumber(line);
};

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: 'new',
  args: ['--no-sandbox'],
});

let fail = 0;
let pass = 0;
let compared = 0;
let known = 0;
const failures = [];

console.log(`Comparing ${samples.length} page(s) against ${ORIGIN}\n`);

for (const row of samples) {
  const page = await browser.newPage();
  const label = row.url;
  try {
    const cms = await read(page, `${ORIGIN}/cms-preview${row.url}`);

    // The database render must match the row it came from ...
    const checks = [
      ['title matches row', cms.title === row.meta_title, `${cms.title} !== ${row.meta_title}`],
      ['canonical matches row', cms.canonical === row.canonical, `${cms.canonical} !== ${row.canonical}`],
      ['description matches row', cms.desc === row.meta_description, ''],
      ['h1 rendered', !!norm(cms.h1) && norm(cms.h1).length > 10, ''],
      ['substantial body', norm(cms.text).split(' ').length > 300, `${norm(cms.text).split(' ').length} words`],
    ];

    // ... and it must match what the hard-coded component renders for the same
    // URL. A hard-coded route may already have been removed, which is not a
    // failure — it is reported as skipped so the count stays honest.
    let live = null;
    try {
      live = await read(page, `${ORIGIN}${row.url}`);
    } catch {
      live = null;
    }

    if (live) {
      compared++;

      const { inCms, inLive } = bagDiff(linesOf(cms.text), linesOf(live.text));
      const unexplainedCms = inCms.filter((l) => !isKnownDelta(l, row));
      const unexplainedLive = inLive.filter((l) => !isKnownDelta(l, row));
      const explained = (inCms.length - unexplainedCms.length) + (inLive.length - unexplainedLive.length);
      if (explained) known += explained;

      const detail = [
        ...unexplainedLive.slice(0, 8).map((l) => `\n      only on the live page: ${l.slice(0, 90)}`),
        ...unexplainedCms.slice(0, 8).map((l) => `\n      only in the CMS render: ${l.slice(0, 90)}`),
      ].join('');

      checks.push(
        ['title == live', cms.title === live.title, `${cms.title}\n      live: ${live.title}`],
        ['canonical == live', cms.canonical === live.canonical, `${cms.canonical}\n      live: ${live.canonical}`],
        ['description == live', cms.desc === live.desc, ''],
        ['h1 == live', norm(cms.h1) === norm(live.h1), `${norm(cms.h1)}\n      live: ${norm(live.h1)}`],
        ['same body copy as live', !unexplainedCms.length && !unexplainedLive.length,
          `${unexplainedLive.length} line(s) only live, ${unexplainedCms.length} only in CMS${detail}`],
      );
    }

    const bad = checks.filter(([, ok]) => !ok);
    pass += checks.length - bad.length;
    fail += bad.length;

    console.log(`${bad.length ? 'FAIL' : 'ok  '}  ${label}${live ? '' : '  (no hard-coded route — row checks only)'}`);
    for (const [name, , detail] of bad) {
      console.log(`      x ${name}${detail ? `: ${detail}` : ''}`);
      failures.push(`${label} — ${name}`);
    }
  } catch (err) {
    fail++;
    failures.push(`${label} — ${err.message}`);
    console.log(`FAIL  ${label}\n      x ${err.message}`);
  }
  await page.close();
}

await browser.close();

console.log(`\n${pass} check(s) passed, ${fail} failed`);
console.log(`${compared}/${samples.length} page(s) compared against a hard-coded route`);
if (known) console.log(`${known} known template delta(s) ignored (see isKnownDelta)`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(fail ? 1 : 0);
