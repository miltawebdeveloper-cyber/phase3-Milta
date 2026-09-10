// Static prerender for the SPA.
//
// The site ships as a client-rendered React bundle, so the HTML every crawler
// receives is the empty shell in index.html: no <h1>, no body copy, and — the
// expensive part — no <a href> anywhere. A crawler that starts at / therefore
// finds exactly one page and stops. (Semrush's 2026-08-04 audit reached 5 URLs
// out of the 161 in the sitemap for precisely this reason.)
//
// This script runs after `vite build`. It serves dist/ locally, drives the real
// Chrome that is already installed on the machine over every route in App.jsx,
// waits for React and useFullSEO to finish, and writes the resulting DOM back
// into dist/ as static HTML. The page still boots React afterwards — the static
// markup is the pre-boot payload, not a replacement for the app.
//
// Output layout mirrors the URL exactly, because canonicals and hreflang in this
// codebase are written with deliberate trailing slashes (see utils/hreflang.js):
//
//   /                                  -> dist/index.html
//   /about                             -> dist/about.html
//   /us/software/xero-for-small-business/  -> dist/us/software/.../index.html
//
// The ".html" form needs one rewrite rule in .htaccess to be served at the
// extensionless URL; see deploy/htaccess-patch.txt. Without it those routes
// simply fall through to the old SPA shell — nothing breaks, they just stay
// unprerendered.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { transform } from 'esbuild';
import {
  buildEmotionMap,
  dedupeSvgIcons,
  minifyHead,
  renameEmotionClasses,
  stripDeadSvgAttrs,
} from './slim-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const APP = path.join(ROOT, 'src', 'App.jsx');
const ORIGIN = 'https://www.miltafs.com';

// Runtime (emotion/MUI) CSS needs care. In a production build emotion runs in
// "speedy" mode: it calls CSSStyleSheet.insertRule directly, so the
// <style data-emotion> tags in <head> carry ZERO bytes of textContent and none
// of MUI's CSS survives outerHTML serialisation. An earlier version of this file
// assumed those tags held ~100 KB of markup and stripped them to save weight —
// they were always empty, so the strip saved nothing and the prerendered pages
// shipped with no component CSS at all.
//
// Measured consequence (2026-08-07, home page, JS disabled): the header logo
// painted 1280x622px instead of 140x68px and the document was 86,814px tall
// instead of 9,121px, because every emotion-styled Box lost its width. That is
// the "giant logo, then the page snaps into place" reload behaviour.
//
// The rules are therefore read out of the CSSOM (the only place they exist) and
// written to ONE shared stylesheet linked by every prerendered page, so the
// pre-boot paint is styled and the cost is paid once and cached, rather than
// inlined into all 181 files.
const PRERENDER_CSS_NAME = 'prerender';

// Authoring tools, not content. Never prerendered, never in the sitemap.
const EXCLUDE = new Set(['/uk/addblog', '/admin', '/cms-preview/*', '/delaware-preview/*']);

const CONCURRENCY = 4;

// ── Routes ────────────────────────────────────────────────────────────────────

// Reads the route table straight out of App.jsx so this script cannot drift
// from the router. Every <Route> in that file is a single line, and nesting is
// tracked with a stack so /uk children resolve to /uk/<child>.
function extractRoutes(src) {
  const out = [];
  const stack = [];
  for (const line of src.split('\n')) {
    const open = line.match(/<Route\s+(index\b|path="([^"]*)")/);
    if (open) {
      const parent = stack.length ? stack[stack.length - 1] : '';
      const raw = open[2];
      let full;
      if (open[1] === 'index') full = parent || '/';
      else if (raw.startsWith('/')) full = raw;
      else full = `${parent.replace(/\/$/, '')}/${raw}`;
      out.push(full);
      // An opening (non self-closing) <Route> wraps children.
      if (!/\/>\s*$/.test(line)) stack.push(full);
    }
    if (/<\/Route>/.test(line)) stack.pop();
  }
  return out;
}

// ── Blog posts ────────────────────────────────────────────────────────────────
//
// Posts are Supabase rows, not routes, so they have to be enumerated somehow.
// This USED to be done by reading the <a href>s off /blogs — which silently
// captured only six of them, because BlogGridSection paginates client-side at
// BLOGS_PER_PAGE = 6 and the prerenderer only ever sees page 1. On 2026-08-11
// the `blogs` table held 72 rows and the build was producing 6 pages; the other
// 66 fell through to the SPA shell and were dropped from sitemap.xml.
//
// So the list is read from the same source the app reads, which cannot drift
// from it. Link discovery below is kept as a safety net for anything reachable
// that is not in these tables.
//
// Note this does NOT fix the internal-linking side of the problem: pagination
// still renders no crawlable <a href> to page 2, so posts 7+ remain orphaned
// (Semrush: "188 orphaned pages in sitemaps"). Prerendering them puts them in
// the sitemap; giving them a real link is a UI change.
const CMS_TABLES = [
  { table: 'blogs', prefix: '/us/blogs/' },
  { table: 'blogs_uk', prefix: '/uk/blogs/' },
];

function loadEnv() {
  const out = { ...process.env };
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (out[key] !== undefined) continue; // real env wins
      out[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

// CMS pages carry their own full path in `url`, so unlike blog posts there is no
// prefix to attach — the row IS the route.
//
// Paged deliberately: PostgREST caps a response at 1000 rows by default, and the
// whole point of moving pages into the database is that there will eventually be
// far more than that. An unpaged read here would silently prerender the first
// thousand and drop the rest, which is exactly the failure this file's blog
// comment above describes happening once already.
async function cmsPageRoutes() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const PAGE = 1000;
  const routes = [];
  try {
    for (let from = 0; ; from += PAGE) {
      const res = await fetch(
        `${url}/rest/v1/pages?select=url&status=eq.published&order=url.asc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Range: `${from}-${from + PAGE - 1}`,
          },
        },
      );
      // The table may not exist yet while the migration is in progress; that is
      // not a build failure, it just means there is nothing to add.
      if (res.status === 404 || res.status === 400) return [];
      if (!res.ok) {
        console.warn(`  ! pages: HTTP ${res.status} — skipped`);
        return routes;
      }
      const rows = await res.json();
      rows.map((r) => r.url).filter(Boolean).forEach((u) => routes.push(u));
      if (rows.length < PAGE) break;
    }
    console.log(`  pages: ${routes.length} CMS page(s)`);
  } catch (err) {
    console.warn(`  ! pages: ${err.message} — skipped`);
  }
  return routes;
}

async function cmsBlogRoutes() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      '  ! VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — falling back to\n' +
        '    link discovery, which only sees the first page of /blogs.',
    );
    return [];
  }
  const routes = [];
  for (const { table, prefix } of CMS_TABLES) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=slug`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        console.warn(`  ! ${table}: HTTP ${res.status} — skipped`);
        continue;
      }
      const rows = await res.json();
      const slugs = rows.map((r) => r.slug).filter(Boolean);
      slugs.forEach((s) => routes.push(prefix + s));
      console.log(`  ${table}: ${slugs.length} post(s)`);
    } catch (err) {
      console.warn(`  ! ${table}: ${err.message} — skipped`);
    }
  }
  return routes;
}

const allRoutes = extractRoutes(fs.readFileSync(APP, 'utf8'));
const dynamicRoutes = allRoutes.filter((r) => r.includes(':'));
// `node scripts/prerender.mjs /about /contact` renders just those routes, which
// is how you check one page without waiting for the whole site. Note that a
// partial run also writes a partial sitemap.xml, so it is a debugging aid only.
const only = process.argv.slice(2).filter((a) => a.startsWith('/'));
const staticRoutes = only.length
  ? only
  : [...new Set(allRoutes.filter((r) => !r.includes(':') && !r.includes('*') && !EXCLUDE.has(r)))];

// ── Local server (mimics the production Apache lookup order) ─────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  const raw = urlPath.split('?')[0];
  // A page can request a URL with a stray '%' (a background-image url(), a
  // hand-written href), and decodeURIComponent throws URIError on those. Thrown
  // here it escapes the request handler and kills the whole prerender mid-run,
  // which is how a build died after ~80 good pages. An undecodable path just
  // will not match a file, so fall back to it verbatim and let the SPA fallback
  // answer, exactly as production would.
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const rel = decoded.replace(/^\/+/, '');
  const base = path.join(DIST, rel);
  const candidates = [base, path.join(base, 'index.html'), `${base.replace(/\/$/, '')}.html`];
  for (const c of candidates) {
    if (c.startsWith(DIST) && fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return path.join(DIST, 'index.html'); // SPA fallback, same as production
}

function startServer() {
  const server = http.createServer((req, res) => {
    // One unreadable request must not take the run down with it: an exception
    // in this handler is unhandled and aborts the process, discarding every
    // page rendered so far. Answering 404 costs that one asset, nothing more.
    try {
      const file = resolveFile(req.url);
      const body = fs.readFileSync(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// ── Chrome ───────────────────────────────────────────────────────────────────

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) {
    throw new Error(
      'No Chrome or Edge binary found. Set CHROME_PATH to a Chromium-based browser executable.',
    );
  }
  return found;
}

// ── Render ───────────────────────────────────────────────────────────────────

// Serialises the DOM after React has rendered. Runs in page context.
function serialise() {
  // Tag manager injects its own <script> into <head> at runtime; that belongs to
  // the live page, not to the static payload (the inline GTM snippet is already
  // in the shell and re-runs for real visitors).
  document
    .querySelectorAll('script[src*="googletagmanager.com"], script[src*="google-analytics.com"]')
    .forEach((el) => el.remove());

  // An overlay that happens to be OPEN when the snapshot is taken does not just
  // add its own markup — it leaves the whole document in the state a modal
  // requires. Career.jsx auto-opens the application popup 600 ms after mount,
  // well inside the wait below, so dist/career/index.html shipped all three of:
  //
  //   • the Dialog's <div role="presentation"> portal as a SIBLING of #root.
  //     React only ever owns #root — capturePrerenderedShell() reads it and
  //     render() empties it — so on boot nothing removes that portal. The real
  //     dialog then opens ABOVE the dead copy, and closing it merely reveals the
  //     copy, whose X button carries no handler and can never close. That is the
  //     "the form won't close the second time, and only in production" bug.
  //   • aria-hidden="true" on #root, so the entire page is hidden from assistive
  //     tech and from anything else that honours it.
  //   • style="overflow: hidden" on <body>, so the page cannot be scrolled at
  //     all until React boots and MUI releases its scroll lock.
  //
  // None of it belongs in a static payload: React recreates every bit of it for
  // itself on boot. Portals are the general case rather than a career-page
  // special case — a portal is by definition transient overlay UI (Dialog, Menu,
  // Snackbar, Tooltip) mounted outside #root, and the page content this
  // prerender exists to capture all lives inside #root.
  const KEEP_IN_BODY = new Set(['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT', 'TEMPLATE']);
  for (const el of [...document.body.children]) {
    if (el.id === 'root' || KEEP_IN_BODY.has(el.tagName)) continue;
    el.remove();
  }
  // Scoped to body's own children on purpose: aria-hidden is legitimate on the
  // hundreds of decorative <svg> icons deeper in the tree, and only the modal
  // manager reaches out this far.
  for (const el of document.body.children) {
    el.removeAttribute('aria-hidden');
    el.removeAttribute('inert');
  }
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  if (!document.body.getAttribute('style')) document.body.removeAttribute('style');

  // The page being serialised has already booted, so ThemeContext has stripped
  // the .pre-boot class that gates the theme rules in index.html. Putting it
  // back is what makes those rules apply again for the next real visitor: the
  // static payload has to describe a page that has NOT booted yet. data-theme
  // goes back to the default for the same reason - this render had no
  // localStorage, so light is the only honest value to ship.
  document.documentElement.classList.add('pre-boot');
  document.documentElement.setAttribute('data-theme', 'light');

  // Harvest the component CSS before touching anything: it lives only in the
  // CSSOM, so it has to be read as rules rather than as element text.
  const css = [];
  for (const sheet of document.styleSheets) {
    if (!sheet.ownerNode || !sheet.ownerNode.hasAttribute?.('data-emotion')) continue;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet, not ours
    }
    for (const rule of rules) css.push(rule.cssText);
  }

  // The tags themselves are empty shells once the rules are captured; React
  // recreates and refills them on boot.
  document.querySelectorAll('style[data-emotion]').forEach((el) => el.remove());

  // framer-motion writes its entry animation into inline styles. Anything it
  // never got to reveal is left at opacity:0 — text a crawler is entitled to
  // treat as deliberately hidden. React re-applies the real animation styles the
  // moment it boots, so clearing them here only affects the pre-boot paint.
  document.querySelectorAll('[style]').forEach((el) => {
    const s = el.getAttribute('style');
    if (!s || !/opacity:\s*0|transform:\s*translate/.test(s)) return;
    const cleaned = s
      .replace(/opacity:\s*0(\.\d+)?\s*;?/g, '')
      .replace(/transform:\s*translate[^;]*;?/g, '')
      .trim();
    if (cleaned) el.setAttribute('style', cleaned);
    else el.removeAttribute('style');
  });

  // Build-time comments (the head-order notes in index.html) are pure weight in
  // the delivered payload.
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => {
    // Keep the GTM markers: they bracket code that has to stay recognisable.
    if (/Google Tag Manager/i.test(c.nodeValue)) return;
    c.remove();
  });

  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
  const h1s = document.querySelectorAll('h1').length;
  const links = [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href'));
  const text = (document.querySelector('#root')?.innerText || '').trim();

  return {
    html: `<!DOCTYPE html>\n${document.documentElement.outerHTML}`,
    canonical,
    title: document.title,
    h1s,
    links,
    words: text ? text.split(/\s+/).length : 0,
    text,
    css,
  };
}

async function renderRoute(page, port, route) {
  await page.goto(`http://127.0.0.1:${port}${route}`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Wait out the Suspense fallback: every route is lazy-loaded, so the first
  // paint is a MUI spinner with no content behind it. The content threshold is
  // deliberately low — a page that renders almost nothing is a finding to
  // report, not a reason to fail the build.
  // Readiness has to mean "the ROUTE has rendered", not "something has".
  //
  // The old condition here was `root.innerText.length > 0`, which the Navbar
  // satisfies the instant it mounts — before the lazy route component behind it
  // does. If a poll landed in the gap after the Suspense spinner unmounted but
  // before the page mounted, the route was serialised carrying nothing but nav
  // chrome, scored under 25 words, and reported DEAD — so it was silently
  // dropped from dist/ AND from sitemap.xml, with the build still exiting 0.
  //
  // Observed five times across the 2026-08-19 builds, on different routes each
  // time (an industry page, then four blog posts); one of them serialised with
  // the text still reading "Loading...".
  //
  // Every route in this app renders exactly one <h1> — verified across all 289
  // rendered routes, none with h1=0 — so waiting for that is a reliable signal
  // that the route itself is up, and it cannot be forged by the shared chrome.
  // A route that never gets there now times out and is reported as a FAILURE,
  // which fails the build, rather than vanishing quietly.
  await page.waitForFunction(
    () => {
      const root = document.querySelector('#root');
      if (!root || root.querySelector('.MuiCircularProgress-root')) return false;
      if (/^loading/i.test((root.innerText || '').trim())) return false;
      return !!root.querySelector('h1');
    },
    { timeout: 45000, polling: 250 },
  );

  // framer-motion holds whileInView content at opacity:0 until it scrolls into
  // view. Walk the page so that copy is materialised in the snapshot.
  await page.evaluate(async () => {
    // An auto-opened modal (Career.jsx) has MUI's scroll lock on <body>, which
    // makes every scrollTo below a silent no-op and leaves the whileInView copy
    // below the fold unmaterialised. Release it for the walk; serialise() clears
    // it from the payload afterwards either way.
    document.body.style.removeProperty('overflow');
    const step = Math.round(window.innerHeight * 0.8);
    // scrollHeight grows as sections mount, so it is re-read every iteration
    // rather than captured once.
    for (let y = 0, guard = 0; y < document.body.scrollHeight && guard < 120; y += step, guard++) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });

  return page.evaluate(serialise);
}

// The stylesheet <link> goes immediately after the bundle's own stylesheets, so
// the head order this codebase maintains (…CSS, JS, JSON-LD last) still holds.
function injectStylesheet(html, href) {
  const tag = `<link rel="stylesheet" href="${href}">`;
  const last = html.lastIndexOf('<link rel="stylesheet"');
  if (last === -1) return html.replace('</head>', `${tag}</head>`);
  const end = html.indexOf('>', last) + 1;
  return `${html.slice(0, end)}${tag}${html.slice(end)}`;
}

// MUI stamps a bookkeeping class on nearly every element it renders —
// "MuiBox-root", "MuiPaper-elevation1", "MuiTypography-body2" and so on. On the
// home page that is 25.2 KB of the 174 KB payload, and only FOUR of the 73
// distinct tokens are ever selected on by any stylesheet in the build. The rest
// are inert markup that a crawler has to wade through to reach the copy, which
// is what Semrush reports as "low text-HTML ratio" (28 pages on 2026-08-10, at
// ratios of 0.04–0.11 against its 0.10 threshold).
//
// Dropping the unreferenced ones is safe HERE, and only here, for one specific
// reason: src/index.jsx calls createRoot().render(), NOT hydrateRoot(). React
// throws this markup away and rebuilds the DOM on boot, so the classes are
// restored the moment the bundle runs, and no hydration mismatch is possible.
// If this app is ever switched to hydrateRoot, DELETE this function — under
// hydration the server and client markup must agree exactly.
//
// The keep-set is computed from the real stylesheets rather than hardcoded, so
// a future MUI upgrade that starts selecting on a new class cannot silently
// lose its styling.
function stripDeadMuiClasses(html, styledClasses) {
  return html.replace(/ class="([^"]*)"/g, (whole, value) => {
    const kept = value
      .split(/\s+/)
      .filter((t) => t && (!/^Mui[A-Za-z0-9-]+$/.test(t) || styledClasses.has(t)));
    if (!kept.length) return '';
    const next = kept.join(' ');
    return next === value ? whole : ` class="${next}"`;
  });
}

// A route with no trailing slash normally becomes `<name>.html`. But when other
// routes live underneath it (/uk has /uk/about, /uk/contact, …) dist/ also ends
// up with a real `uk/` directory, and Apache's DirectorySlash then 301s /uk to
// /uk/ — which served a 403 in production on 2026-08-07, because nothing had
// put an index.html in that directory. Parent routes are therefore written
// twice, so the URL resolves whichever way Apache reaches it.
function outputPaths(route) {
  if (route === '/') return [path.join(DIST, 'index.html')];
  const clean = route.replace(/^\//, '');
  if (route.endsWith('/')) return [path.join(DIST, clean, 'index.html')];
  const paths = [path.join(DIST, `${clean}.html`)];
  if (allRoutes.some((r) => r.startsWith(`${route}/`))) {
    paths.push(path.join(DIST, clean, 'index.html'));
  }
  return paths;
}

const normalise = (p) => (p.replace(/\/+$/, '') || '/').toLowerCase();

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html not found — run `vite build` first.');
  }

  const { server, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];
  const failures = [];
  const empty = [];
  // Rules are unioned in first-seen order across routes: a Set preserves
  // insertion order, so the cascade within any single page is unchanged and
  // later routes only ever append rules the earlier ones did not use.
  const cssUnion = new Set();
  const pageCss = [];
  const written = [];
  const queue = [...staticRoutes];
  const seen = new Set(queue.map(normalise));

  // Blog posts come from the CMS, not from App.jsx. Skipped for a targeted
  // `node scripts/prerender.mjs /some/route` run, which is a debugging aid.
  if (!only.length) {
    console.log('Reading blog slugs from Supabase…');
    for (const route of await cmsBlogRoutes()) {
      if (seen.has(normalise(route)) || EXCLUDE.has(route)) continue;
      seen.add(normalise(route));
      queue.push(route);
    }
    // CMS pages. While the migration is in progress a page can exist BOTH as a
    // hard-coded route in App.jsx and as a row, so `seen` deduplicates and the
    // hard-coded route wins — the source of truth does not change until its file
    // is actually removed.
    for (const route of await cmsPageRoutes()) {
      if (seen.has(normalise(route)) || EXCLUDE.has(route)) continue;
      seen.add(normalise(route));
      queue.push(route);
    }
    console.log('');
  }
  // Blog posts are Supabase rows, not routes. The rendered index pages know the
  // real slugs, so discovered links feed back into the queue.
  const discoverFrom = new Set(['/blogs', '/uk/blogs']);
  const slugPrefixes = dynamicRoutes.map((r) => r.slice(0, r.indexOf(':')));

  async function worker(id) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      // Analytics never needs to run during a build.
      if (/googletagmanager\.com|google-analytics\.com|doubleclick\.net/.test(url)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    while (queue.length) {
      const route = queue.shift();
      if (route === undefined) break;
      try {
        const r = await renderRoute(page, port, route);

        // A route that resolves to an empty or "not found" view is a dead link
        // somewhere in the site, not a page. Writing it as static HTML would
        // freeze that dead end into the build, so it is reported instead.
        if (r.words < 25 || /not found/i.test(r.text.slice(0, 120))) {
          empty.push({ route, words: r.words, text: r.text.slice(0, 60) });
          process.stdout.write(`  DEAD ${route}  renders "${r.text.slice(0, 40)}"\n`);
          continue;
        }

        const { css, ...rest } = r;
        css.forEach((rule) => cssUnion.add(rule));

        // index.html preloads the homepage's LCP hero at high priority, but that
        // file is the shell for EVERY route — so around 360 pages were fetching
        // an image only the homepage renders. The browser says so out loud:
        // "preloaded using link preload but not used within a few seconds".
        //
        // The preload is right; its scope was not. Strip it everywhere but "/".
        const html = route === '/'
          ? r.html
          : r.html.replace(/\s*<link\b[^>]*rel="preload"[^>]*about_us\.webp[^>]*>/gi, '');

        const outs = [];
        for (const out of outputPaths(route)) {
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, html, 'utf8');
          written.push(out);
          outs.push(out);
        }
        // Which rules THIS page needs, kept next to the files that will link
        // them. The union above is the whole site; this is the slice.
        pageCss.push({ files: outs, rules: css });
        results.push({ route, ...rest });
        process.stdout.write(
          `  ok  ${route}  (h1=${r.h1s} words=${r.words} links=${r.links.length})\n`,
        );

        if (discoverFrom.has(route)) {
          for (const href of r.links) {
            const clean = href.split('#')[0].split('?')[0];
            if (!slugPrefixes.some((p) => clean.startsWith(p) && clean.length > p.length)) continue;
            if (seen.has(normalise(clean)) || EXCLUDE.has(clean)) continue;
            seen.add(normalise(clean));
            queue.push(clean);
            process.stdout.write(`  +   discovered ${clean}\n`);
          }
        }
      } catch (err) {
        failures.push({ route, error: err.message });
        process.stdout.write(`  FAIL ${route}  ${err.message}\n`);
      }
    }
    await page.close();
  }

  console.log(
    `Prerendering ${queue.length} routes ` +
      `(${staticRoutes.length} from App.jsx + ${queue.length - staticRoutes.length} blog posts) ` +
      `with ${CONCURRENCY} workers…\n`,
  );
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  // ── component stylesheet ───────────────────────────────────────────────────
  // One file for the whole site, content-hashed so it can be cached hard. Every
  // page that was just written gets a <link> to it, which is what makes the
  // pre-boot paint match the hydrated layout.
  let cssBytes = 0;
  if (cssUnion.size) {
    // cssRules.cssText is the browser's PRETTY-PRINTED serialisation — one rule
    // per line, spaces around every brace and colon. Vite minifies the bundled
    // stylesheets but never sees this one, so it shipped at 776 KB and Semrush
    // flagged it as unminified CSS on every page that links it (the 2026-08-10
    // audit counted 54 unminified JS/CSS issues). esbuild is already present as
    // a Vite dependency, so minifying here costs nothing extra.
    const ordered = [...cssUnion];
    const rawCss = ordered.join('\n');
    const rawBytes = Buffer.byteLength(rawCss);
    let cssText = rawCss;
    try {
      cssText = (await transform(rawCss, { loader: 'css', minify: true })).code;
    } catch (err) {
      // A minifier failure must not cost the pages their styling — ship the
      // readable version and say so, rather than failing the build.
      console.warn(`\n  ! CSS minify failed (${err.message}); shipping unminified.`);
    }
    // Emotion's class names are the single biggest attribute cost in the
    // payload, and this stylesheet is the only thing in the static build that
    // resolves them, so both sides get shortened together before it is hashed.
    // Anything a stylesheet already selects on, or that any page already puts in
    // a class attribute, is off limits as a replacement name: reusing one would
    // hand an element styles that were never meant for it.
    //
    // A stylesheet this script wrote on an earlier run is excluded: it already
    // holds shortened names, and treating those as reserved would push every
    // later build onto a longer prefix for no reason.
    const reserved = new Set();
    for (const name of fs.readdirSync(path.join(DIST, 'assets'))) {
      if (!name.endsWith('.css') || name.startsWith(`${PRERENDER_CSS_NAME}-`)) continue;
      const text = fs.readFileSync(path.join(DIST, 'assets', name), 'utf8');
      for (const m of text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) reserved.add(m[1]);
    }
    // A file recorded in `written` can be gone by the time it is read back —
    // seen on 2026-08-28, where two industry pages were written and listed in
    // sitemap.xml but had disappeared from dist/ by this pass. Whatever removes
    // them, an unreadable page must not abort a build that has already rendered
    // 350+ others; it is skipped and reported at the end.
    const vanished = [];
    for (const file of written) {
      let html;
      try {
        html = fs.readFileSync(file, 'utf8');
      } catch {
        vanished.push(file);
        continue;
      }
      for (const m of html.matchAll(/ class="([^"]*)"/g)) {
        for (const token of m[1].split(/\s+/)) if (token) reserved.add(token);
      }
    }
    const emotion = buildEmotionMap(cssText, reserved);
    if (!emotion.map) {
      console.warn('  ! emotion class rename skipped: no collision-free prefix available.');
    }

    // One 595 KB stylesheet linked from every page was the site's worst
    // render-blocking cost: nothing paints until it arrives. Measured on
    // 2026-08-20 (Fast 3G, 4x CPU throttle) a state page reached first
    // contentful paint at 11.3s, and only ~30% of those rules applied to it.
    //
    // So it ships as two sheets. Rules nearly every page needs -- the navbar,
    // footer, typography and layout chrome, about 150 KB -- go into a common
    // sheet downloaded once and cached for the whole site. The rest is written
    // per page, and pages built from the same template produce byte-identical
    // deltas that collapse to one shared file by content hash.
    //
    // Cascade order survives the split: rules keep their union order within
    // each sheet and the common sheet is always linked first, so a page's own
    // override still lands after the base rule it overrides.
    const COMMON_SHARE = 0.95;
    const useCount = new Map();
    for (const pc of pageCss) {
      for (const rule of new Set(pc.rules)) useCount.set(rule, (useCount.get(rule) || 0) + 1);
    }
    const commonCut = pageCss.length * COMMON_SHARE;
    const isCommon = (rule) => (useCount.get(rule) || 0) >= commonCut;

    fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
    const sheetsWritten = new Set();
    const writeSheet = async (rules, name) => {
      if (!rules.length) return null;
      let text = rules.join('\n');
      try {
        text = (await transform(text, { loader: 'css', minify: true })).code;
      } catch (err) {
        console.warn(`\n  ! CSS minify failed (${err.message}); shipping unminified.`);
      }
      text = renameEmotionClasses(text, emotion.map);
      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 8);
      const href = `/assets/${name}-${hash}.css`;
      if (!sheetsWritten.has(href)) {
        fs.writeFileSync(path.join(DIST, href.replace(/^\//, '')), text, 'utf8');
        sheetsWritten.add(href);
        cssBytes += Buffer.byteLength(text);
      }
      return href;
    };

    const commonHref = await writeSheet(ordered.filter(isCommon), `${PRERENDER_CSS_NAME}-common`);
    const sheetForFile = new Map();
    for (const pc of pageCss) {
      const own = new Set(pc.rules);
      const href = await writeSheet(
        ordered.filter((rule) => own.has(rule) && !isCommon(rule)),
        PRERENDER_CSS_NAME,
      );
      for (const file of pc.files) sheetForFile.set(file, href);
    }

    // Every class that any stylesheet in the build actually selects on. Read
    // from ALL of dist/assets — the emotion sheet above plus Vite's bundled
    // CSS — because a token only has to appear in one of them to matter.
    const styledClasses = new Set();
    for (const name of fs.readdirSync(path.join(DIST, 'assets'))) {
      if (!name.endsWith('.css')) continue;
      const text = fs.readFileSync(path.join(DIST, 'assets', name), 'utf8');
      for (const m of text.matchAll(/\.(Mui[A-Za-z0-9-]+)/g)) styledClasses.add(m[1]);
    }

    let beforeBytes = 0;
    let afterBytes = 0;
    for (const file of written) {
      let html;
      try {
        html = fs.readFileSync(file, 'utf8');
      } catch {
        if (!vanished.includes(file)) vanished.push(file);
        continue;
      }
      // Common first, page second: injectStylesheet appends after the last
      // stylesheet link, so this is also the order they load in.
      if (commonHref) html = injectStylesheet(html, commonHref);
      const pageHref = sheetForFile.get(file);
      if (pageHref) html = injectStylesheet(html, pageHref);
      beforeBytes += Buffer.byteLength(html);
      html = stripDeadMuiClasses(html, styledClasses);
      html = dedupeSvgIcons(html);
      html = stripDeadSvgAttrs(html);
      html = renameEmotionClasses(html, emotion.map);
      html = minifyHead(html);
      afterBytes += Buffer.byteLength(html);
      fs.writeFileSync(file, html, 'utf8');
    }
    if (vanished.length) {
      console.warn(
        `\n  ! ${vanished.length} rendered page(s) disappeared from dist/ before the ` +
          'CSS pass and are NOT in the deployable output, though sitemap.xml may list them:',
      );
      vanished.forEach((f) => console.warn(`      ${path.relative(DIST, f)}`));
    }
    console.log(
      `\nComponent CSS: ${cssUnion.size} rules, ${(rawBytes / 1024).toFixed(1)} KB -> ` +
        `${sheetsWritten.size} sheet(s) totalling ${(cssBytes / 1024).toFixed(1)} KB ` +
        `(1 common + ${sheetsWritten.size - 1} page), linked from ${written.length} files`,
    );
    console.log(
      `Payload slimmed: ${(beforeBytes / 1024).toFixed(1)} KB -> ` +
        `${(afterBytes / 1024).toFixed(1)} KB across ${written.length} files ` +
        `(-${(100 - (100 * afterBytes) / beforeBytes).toFixed(1)}%; ` +
        `${styledClasses.size} Mui classes kept as styled, ` +
        `${emotion.map ? emotion.map.size : 0} emotion classes shortened)`,
    );
  }

  // ── sitemap.xml ────────────────────────────────────────────────────────────
  // Built from what actually rendered, and only for pages whose own canonical
  // points at themselves. That drops the UK stub pages (they canonicalise to the
  // US homepage) without needing a hand-maintained exclusion list, and it makes
  // the "wrong host / wrong slug" entries in the old sitemap impossible.
  //
  // The URL written is the page's canonical VERBATIM, not `ORIGIN + route`. The
  // two differ whenever a route and its canonical disagree about a trailing
  // slash, and the comparison below deliberately ignores that difference (a page
  // is still self-canonical either way) — so using the route would emit a URL
  // the page itself does not claim. That was live until 2026-08-11 and put 15
  // non-canonical URLs in the sitemap, every one of which Apache would 301 or
  // treat as a duplicate. Semrush counts those as "incorrect pages in
  // sitemap.xml"; the 2026-08-10 audit found 8.
  const indexable = [];
  const skipped = [];
  for (const r of results) {
    const self = `${ORIGIN}${r.route}`;
    if (r.canonical && normalise(r.canonical) === normalise(self)) indexable.push(r.canonical);
    else skipped.push({ route: r.route, canonical: r.canonical });
  }
  // Parent routes render once but are written to two files; a canonical could
  // also be shared by two routes. Either way the sitemap must list it once.
  const seenLoc = new Set();
  const sitemapUrls = indexable.filter((u) => !seenLoc.has(u) && seenLoc.add(u)).sort();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');

  // ── Report ─────────────────────────────────────────────────────────────────
  const noH1 = results.filter((r) => r.h1s === 0).map((r) => r.route);
  const manyH1 = results.filter((r) => r.h1s > 1).map((r) => `${r.route} (${r.h1s})`);
  const thin = results.filter((r) => r.words < 200).map((r) => `${r.route} (${r.words}w)`);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Prerendered      : ${results.length}`);
  console.log(`Failed           : ${failures.length}`);
  console.log(`Dead routes      : ${empty.length}  (linked, but render nothing)`);
  console.log(`In sitemap.xml   : ${sitemapUrls.length}`);
  console.log(`Not in sitemap   : ${skipped.length}  (canonical points elsewhere)`);
  if (failures.length) {
    console.log('\nFAILURES');
    failures.forEach((f) => console.log(`  ${f.route}\n    ${f.error}`));
  }
  if (empty.length) {
    console.log(`\nDEAD ROUTES — linked from the site but render no content (${empty.length})`);
    empty.forEach((e) => console.log(`  ${e.route}  ->  "${e.text}" (${e.words}w)`));
  }
  if (noH1.length) {
    console.log(`\nNo <h1> (${noH1.length})`);
    noH1.forEach((r) => console.log(`  ${r}`));
  }
  if (manyH1.length) {
    console.log(`\nMultiple <h1> (${manyH1.length})`);
    manyH1.forEach((r) => console.log(`  ${r}`));
  }
  if (thin.length) {
    console.log(`\nUnder 200 words (${thin.length})`);
    thin.forEach((r) => console.log(`  ${r}`));
  }
  if (skipped.length) {
    console.log(`\nExcluded from sitemap (${skipped.length})`);
    skipped.forEach((s) => console.log(`  ${s.route}  ->  canonical ${s.canonical || '(none)'}`));
  }
  console.log('─'.repeat(70));

  await browser.close();
  server.close();

  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
