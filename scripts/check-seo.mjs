// Build-time audit of dist/, checking the issue classes Semrush reported on
// 2026-08-10. Every check here corresponds to a line in that report, so a clean
// run means the build is not reintroducing anything that was fixed on
// 2026-08-11. Run after `npm run build`:
//
//     node scripts/check-seo.mjs
//
// Exit code is non-zero if any check fails. This looks only at what the build
// produced — whether the server actually serves it is a different question, and
// scripts/verify-deploy.mjs is the one that asks it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const ORIGIN = 'https://www.miltafs.com';

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

const rel = (f) => path.relative(DIST, f).replace(/\\/g, '/');
const failures = [];
const record = (check, lines) => {
  if (lines.length) failures.push({ check, lines });
  const mark = lines.length ? 'FAIL' : 'ok  ';
  console.log(`${mark} ${check}${lines.length ? ` — ${lines.length} problem(s)` : ''}`);
  lines.slice(0, 12).forEach((l) => console.log(`       ${l}`));
  if (lines.length > 12) console.log(`       … and ${lines.length - 12} more`);
};

// ── "8 incorrect pages found in sitemap.xml" ─────────────────────────────────
// A sitemap may only contain URLs that are canonical and return 200. Here that
// reduces to: the page at this URL must declare THIS URL as its canonical.
{
  const sitemap = path.join(DIST, 'sitemap.xml');
  const problems = [];
  if (!fs.existsSync(sitemap)) {
    problems.push('dist/sitemap.xml was not generated');
  } else {
    const urls = [...fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1],
    );
    const seen = new Set();
    for (const u of urls) {
      if (seen.has(u)) problems.push(`duplicate entry: ${u}`);
      seen.add(u);
      if (!u.startsWith(`${ORIGIN}/`) && u !== ORIGIN) {
        problems.push(`wrong host: ${u}`);
        continue;
      }
      // The trailing slash is not cosmetic — it decides which file Apache
      // serves. A slash URL is answered by DirectoryIndex (<path>/index.html);
      // a slash-less URL is answered by the block-3 rewrite (<path>.html).
      // So the URL's form must match the file the build actually wrote, or the
      // canonical names a URL that falls through to the SPA shell. The
      // normalise() used elsewhere ignores trailing slashes by design, which is
      // exactly why this drift went unnoticed across 27 pages until 2026-08-11.
      const raw = u.slice(ORIGIN.length);
      const p = raw.replace(/\/+$/, '').replace(/^\//, '');
      const wantsDir = raw === '/' || raw.endsWith('/');
      const dirFile = path.join(DIST, p, 'index.html');
      const flatFile = p === '' ? path.join(DIST, 'index.html') : path.join(DIST, `${p}.html`);
      const file = wantsDir
        ? fs.existsSync(dirFile) && dirFile
        : fs.existsSync(flatFile) && flatFile;
      if (!file) {
        const other = wantsDir ? flatFile : dirFile;
        problems.push(
          fs.existsSync(other)
            ? `wrong URL form: ${u} — built as ${rel(other)}, so that URL will not serve it`
            : `no file built for: ${u}`,
        );
        continue;
      }
      const canonical = (fs.readFileSync(file, 'utf8').match(
        /<link rel="canonical" href="([^"]*)"/,
      ) || [])[1];
      if (canonical !== u) problems.push(`not self-canonical: ${u} declares ${canonical}`);
    }
    console.log(`     (${urls.length} sitemap URLs)`);
  }
  record('sitemap contains only canonical, built URLs', problems);
}

// ── "18 images don't have alt attributes" ────────────────────────────────────
{
  const problems = [];
  for (const f of htmlFiles) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<img\b[^>]*>/gi)) {
      if (/\balt\s*=/.test(m[0])) continue;
      const src = (m[0].match(/\bsrc="([^"]*)"/) || [])[1] || '(no src)';
      problems.push(`${rel(f)}  ${src.slice(0, 90)}`);
    }
  }
  record('every <img> has an alt attribute', problems);
}

// ── "72 links have non-descriptive anchor text" ──────────────────────────────
// Only <a> elements count; a <button> with the same label is not a link and is
// not what this issue is about. Text is taken with markup stripped, so an
// off-screen <span> suffix (the pattern used in uk ServicesSection) counts —
// which is exactly why it is a valid fix.
{
  const GENERIC =
    /^(click here|read more|learn more|more|here|this|link|view more|see more|details|know more|continue reading|read|view|go|find out more|discover more|see details|submit)\.?$/i;
  const problems = [];
  const counts = new Map();
  for (const f of htmlFiles) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
      const text = m[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // An anchor wrapping only an image takes its alt text as the label; that
      // is handled by the alt check above, not here.
      if (!text) continue;
      if (!GENERIC.test(text)) continue;
      counts.set(text, (counts.get(text) || 0) + 1);
    }
  }
  for (const [text, n] of counts) problems.push(`"${text}" × ${n}`);
  record('no generic anchor text', problems);
}

// ── "54 issues with unminified JavaScript and CSS files" ─────────────────────
// Vite minifies its own output; the risk is a stylesheet the build writes
// itself, which is how the 776 KB prerender sheet shipped unminified.
{
  const problems = [];
  const assets = path.join(DIST, 'assets');
  if (fs.existsSync(assets)) {
    for (const name of fs.readdirSync(assets)) {
      if (!/\.(css|js)$/.test(name)) continue;
      const text = fs.readFileSync(path.join(assets, name), 'utf8');
      const lines = text.split('\n').length;
      const bytes = Buffer.byteLength(text);
      // Minified output is a handful of very long lines. A file averaging under
      // ~200 bytes per line is pretty-printed.
      if (lines > 20 && bytes / lines < 200) {
        problems.push(`${name}: ${lines} lines, ${(bytes / 1024).toFixed(0)} KB — looks unminified`);
      }
    }
  }
  record('build assets are minified', problems);
}

// ── meta descriptions must be prose, not CSS ─────────────────────────────────
// summarise() in blogSEO.js strips HTML tags, which removes <style> and
// </style> but left the CSS declarations between them as text. 52 of 71 US
// blog posts shipped with a description reading ".main-title { font-size:26px
// … }". The tag itself is long gone by the time it reaches dist/, so this
// asserts on the rendered string: a description with a braced "prop: value"
// block in it is a stylesheet, not a summary.
{
  const CSS_LIKE = /\{[^{}]*:[^{}]*\}|font-family\s*:|font-size\s*:\s*\d/i;
  const problems = [];
  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf8');
    for (const attr of ['<meta name="description"', '<meta property="og:description"']) {
      const m = html.match(
        new RegExp(`${attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} content="([^"]*)"`),
      );
      if (m && CSS_LIKE.test(m[1])) {
        problems.push(`${rel(f)}  ${attr.match(/"([^"]+)"/)[1]} = ${m[1].slice(0, 60)}…`);
      }
    }
  }
  record('meta descriptions are prose, not CSS', problems);
}

// ── no page ships with a modal frozen open ───────────────────────────────────
// Career.jsx auto-opens the application popup 600 ms after mount, inside the
// prerender's wait, so dist/career/*.html was serialised mid-modal and shipped
// the Dialog's portal as a sibling of #root, aria-hidden="true" on #root, and
// a body scroll lock. React owns only #root, so the stale portal survived boot
// forever: the live dialog opened on top of it and closing that one just
// revealed the dead copy, whose close button has no handler — the form could
// not be closed a second time, in production only. Live 2026-08-21 to 08-31.
//
// serialise() in prerender.mjs now strips all three. This asserts on the built
// HTML so any future auto-opening overlay fails the build instead of shipping.
{
  const problems = [];
  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf8');
    const body = html.slice(html.indexOf('<body'));

    // A portal container is any body-level element that is not #root or inert
    // head-ish markup. Matching role="presentation"/"dialog" outside #root is
    // the cheap, specific signal — MUI stamps one on every Modal portal.
    const rootEnd = (() => {
      const open = body.indexOf('id="root"');
      if (open === -1) return -1;
      const re = /<(\/?)div\b[^>]*>/g;
      re.lastIndex = body.indexOf('>', open) + 1;
      let depth = 1, m;
      while ((m = re.exec(body))) if ((depth += m[1] ? -1 : 1) === 0) return m.index;
      return -1;
    })();
    if (rootEnd !== -1 && /<div[^>]*role="(presentation|dialog)"/.test(body.slice(rootEnd))) {
      problems.push(`${rel(f)}  modal portal left outside #root`);
    }

    if (/<div[^>]*id="root"[^>]*\s(aria-hidden|inert)\b/.test(html)) {
      problems.push(`${rel(f)}  #root is aria-hidden — whole page hidden from AT`);
    }
    if (/<body[^>]*style="[^"]*overflow:\s*hidden/.test(html)) {
      problems.push(`${rel(f)}  <body> ships MUI's scroll lock — page cannot scroll`);
    }
  }
  record('no page ships with a modal frozen open', problems);
}

// ── the DirectorySlash trap ──────────────────────────────────────────────────
// A route that is BOTH a page and a parent of child routes gets written twice:
// <name>.html and <name>/index.html. Apache's mod_dir then 301s the no-slash
// URL to the slash one, so the no-slash form can never be the canonical even
// though the .html file exists and the sitemap check above passes. /uk and
// /career hit this and pointed their canonical (and the home page's en-GB
// hreflang) at a redirect until 2026-08-12.
{
  const problems = [];
  const trapped = new Set();
  for (const f of htmlFiles) {
    const r = rel(f);
    if (!r.endsWith('.html') || r.endsWith('/index.html')) continue;
    const bare = r.slice(0, -'.html'.length);
    if (fs.existsSync(path.join(DIST, bare, 'index.html'))) trapped.add(`/${bare}`);
  }
  const badForm = (u) =>
    u.startsWith(ORIGIN) && trapped.has(u.slice(ORIGIN.length)) && !u.endsWith('/');
  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf8');
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (canonical && badForm(canonical)) {
      problems.push(`${rel(f)} canonical=${canonical} — 301s to ${canonical}/`);
    }
    for (const [, lang, href] of html.matchAll(
      /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g,
    )) {
      if (badForm(href)) problems.push(`${rel(f)} hreflang ${lang}=${href} — 301s to ${href}/`);
    }
  }
  const sitemap = path.join(DIST, 'sitemap.xml');
  if (fs.existsSync(sitemap)) {
    for (const [, u] of fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (badForm(u)) problems.push(`sitemap.xml lists ${u} — 301s to ${u}/`);
    }
  }
  if (trapped.size) console.log(`     (parent routes: ${[...trapped].join(', ')})`);
  record('no canonical/hreflang/sitemap URL points at a DirectorySlash redirect', problems);
}

// ── hreflang self-reference ("32 hreflang conflicts") ────────────────────────
// Cross-checked against the pair table by scripts/check-hreflang.mjs; here we
// assert the rendered result: if a page emits any alternate, one of them must
// name the page's own canonical.
{
  const problems = [];
  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf8');
    const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    if (!alts.length) continue;
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (!alts.some(([, , href]) => href === canonical)) {
      problems.push(
        `${rel(f)} canonical=${canonical} but alternates are ` +
          alts.map(([, lang, href]) => `${lang}:${href}`).join(', '),
      );
    }
  }
  record('every page with hreflang self-references', problems);
}

// ── "low text-HTML ratio" ────────────────────────────────────────────────────
// Screaming Frog and Semrush both flag a page whose visible text is under 10%
// of its HTML. On 2026-08-18 that was 36 of the 250 pages, and the cause was
// almost entirely markup weight rather than missing copy: the home page carried
// 61 KB of base64 images and 21 KB of generated class names around 11.9 KB of
// text. scripts/slim-html.mjs and the assetsInlineLimit setting in
// vite.config.js exist to keep that weight down; this asserts the result.
//
// Only self-canonical pages are judged. A page that points its canonical
// somewhere else is not competing for anything, so its ratio says nothing — and
// the UK stubs, which all canonicalise to the US home page, would otherwise
// keep this permanently red for a reason that has nothing to do with markup.
{
  const MIN_RATIO = 0.1;
  const problems = [];
  let elsewhere = 0;
  for (const f of htmlFiles) {
    const raw = fs.readFileSync(f);
    const html = raw.toString('utf8');
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    const self = `${ORIGIN}/${rel(f).replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')}`;
    const same = canonical && canonical.replace(/\/+$/, '') === self.replace(/\/+$/, '');
    if (!same) {
      elsewhere++;
      continue;
    }
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const ratio = Buffer.byteLength(text) / raw.length;
    if (ratio < MIN_RATIO) {
      problems.push(
        `${rel(f)}  ratio ${ratio.toFixed(3)}  ` +
          `(${(Buffer.byteLength(text) / 1024).toFixed(1)} KB text in ` +
          `${(raw.length / 1024).toFixed(1)} KB HTML)`,
      );
    }
  }
  problems.sort();
  console.log(`     (${elsewhere} page(s) not judged: canonical points elsewhere)`);
  record(`text-HTML ratio at or above ${MIN_RATIO}`, problems);
}

console.log();
if (failures.length) {
  console.error(`${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('All SEO checks passed.');
