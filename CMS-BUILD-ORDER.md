# Milta CMS Build Order

Turning 227 hand-written page components into a database-driven CMS — in the order
the work actually has to happen, with the constraint that decides everything else
settled first.

Grounded in the repo as of 31 Aug 2026.

| | |
|---|---|
| Routes in `App.jsx` | **288** |
| State page files | **227** |
| Pages prerendered today | **363** |
| Avg HTML per page | **39 KB** |
| Pages targeted | **800,000** |

---

## Where you are starting from

> **Corrected 31 Aug 2026, after measuring.** An earlier draft of this document
> said all 227 state files were hand-written components with inline string
> literals. That was wrong — it generalised from California, which is the one
> state that had not been refactored. The real picture is much better, and
> Phases 1 and 2 are far smaller than first estimated.

**Most of the refactor has already been done.**

`src/states/_ServiceLayout.jsx` (949 lines) is a single parameterised template
that takes a fixed 13-prop content contract:

```js
ServiceLayout({ seo, hero, intro, prose, whyEssential, solutions,
                cardGroups, checklists, comparisonTable, advantages,
                industries, closing, faqs })
```

Of the 224 state page files:

| Shape | Count | Status |
|---|---|---|
| Declarative props over `ServiceLayout` | **216** | Extracts cleanly |
| Declarative over `_shared/StatePageKit` | **7** | SEO extracts; body needs hand-porting |
| Hand-built monolith (`California/Bookkeeping.jsx`, 617 lines) | **1** | Port by hand |

So the content model did not need designing — it already exists as the
`ServiceLayout` prop contract, and 96% of pages already satisfy it. The job is to
serialise those props, not to parse prose out of markup.

The build then drives real Chrome over every route in `App.jsx` and writes the DOM
back out as static HTML. Those files are zipped and uploaded to an Apache host.
Render serves only the API — forms and blogs — at `milta-website.onrender.com`.

Two things already work in your favour. Blogs are Supabase rows, so the read path
is proven. And `prerender.mjs` already enumerates rows from Supabase to decide what
to render, through its `CMS_TABLES` list. That is the exact hook city pages will
use — the pattern does not need inventing, only extending.

---

## Security: an open write endpoint, now closed

**Fixed 31 Aug 2026.** `POST /api/blogs/:id/update` was reachable by anyone.
Three facts stacked:

1. `server.js` builds its Supabase client with the **anon key**, which is
   `VITE_`-prefixed and therefore compiled into the public browser bundle — it was
   sitting in `dist/assets/blogs-*.js`, readable by anyone viewing source.
2. The route had **no authentication of any kind**. There was no `auth`, `token`,
   `jwt`, `Bearer` or session reference anywhere in `server.js`.
3. It took the **table name from the request body** (`const { content, table } =
   req.body`), so a caller chose which table to write to.

Anyone could POST to `milta-website.onrender.com/api/blogs/<id>/update` and
overwrite content in any table the anon key could reach. It was never exploited
only because nothing in the app ever called it — `src/api/client.js` defines the
caller, and the two `updateBlog.js` modules that import it are themselves imported
by nothing.

**The fix:** the route now requires an admin bearer token (`requireAdmin`, shared
with the admin router) and picks `table` from a fixed allowlist
(`blogs`, `blogs_uk`) instead of trusting it. Verified against a running server:
no token → 401, forged token → 401, and `GET /api/blogs` still returns 200.

**Still open, unrelated:** `src/uk-pages/Addblog.jsx:33` posts to a hard-coded
`http://localhost:5000/api/blogs`, so in production it calls the visitor's own
machine and fails. There is also no `POST /api/blogs` route on the server, so that
screen cannot work as written. Not fixed here — flagging it.

---

## Live bugs this work turned up

All three predate the CMS work and are in production now. The first two were found
by comparing extracted rows against what is actually in `dist/`; the third by
watching the browser console while driving the admin screen.

### 1. Washington payroll canonical — FIXED 31 Aug 2026

The page renders at
`/us/services/payroll-management-services-in-the-washington/` (note "the"), and
that file is in `dist/`. But the canonical it ships says:

```html
<link rel="canonical" href="https://www.miltafs.com/us/services/payroll-management-services-in-washington/">
```

— without "the". That URL was never built and has no route. The page was
instructing Google to drop it in favour of a 404, and it was missing from
`sitemap.xml` as a result.

**It stopped being cosmetic once Phase 2 landed.** The extractor derives a row's
`url` from its canonical, and `prerender.mjs` now enumerates published rows — so
the build tried to render a URL with no route, found no `<h1>`, and failed after
45 s. `Failed: 1`.

**Fixed** in `src/states/Washington/Payroll.jsx` and in the database row (`url`
and `canonical`). After the fix: **Failed: 0**, and `sitemap.xml` went from 356
to **357** entries — the page is now indexable for the first time.

This is the exact failure class the CMS removes: when `url` and `canonical` are
derived from one field, they cannot disagree.

### 2. Fifteen Digital Marketing canonicals are missing their trailing slash

201 of 216 pages use a trailing slash. The 15 that do not are all Digital
Marketing. They still build — as `name.html` rather than `name/index.html`, served
through the `.htaccess` rewrite — so nothing is broken today. But it is an
inconsistency that should be normalised in the database rather than carried
forward into 800K rows.

### 3. MUI v9 silently drops `<Stack>` alignment site-wide — NOT fixed

`@mui/material` is on **9.0.1**, where `Stack` accepts only `direction`,
`spacing`, `divider` and `useFlexGap`. `alignItems`, `justifyContent` and
`flexWrap` are no longer props: React logs "does not recognize the prop", leaks a
lowercase attribute into the DOM, and **the style is never applied**.

Found because the admin screen tripped it. It is not limited to the admin screen:

```
60 occurrences across 39 component files outside src/admin
```

including `Footer.jsx`, `homeComp/Hero.jsx` and `careerComp/JobList.jsx`. Those
layouts render without their intended alignment today, and the invalid attributes
are baked into every prerendered page.

Fixed in `src/admin/*` only. The other 39 files are **not** touched: correcting
them changes rendered layout on live marketing pages, which wants review rather
than a blind codemod — and there is no git history to fall back on. A working
codemod exists if you want it applied.

---

### 4. A stored row could white-screen a whole page — FIXED 1 Sep 2026

The first head-to-head run of `check:cms-preview` found
`/us/services/financial-controller-services-in-california/` rendering nothing at
all from the database — no `h1`, just the route error boundary and
*"This page didn't load correctly"*. The console said:

```
TypeError: Cannot read properties of undefined (reading 'map')
```

`ComparisonTable` read `data.headers.map(...)` and `row.marks.map(...)`
unguarded. The extractor had stored the StatePageKit prop names instead — `head`,
and rows as flat arrays (`["Accounting Function Oversight", "✔️", "✔️"]`) rather
than `{ label, marks }`. One wrong field name took down **the entire route**, not
just the table.

Exactly one row was affected, but the shape of the failure is the point: a
content database that anyone can edit must never be able to crash a page.

**Fixed in two places, deliberately.**

- `_ServiceLayout.jsx` normalises both shapes (`headers ?? head`, and a flat
  array becomes `{ label: row[0], marks: row.slice(1) }`) and returns `null`
  when there is nothing to render. This is the guard that matters — it holds for
  rows typed into the admin screen, which no extractor will ever touch.
- `extract-state-pages.mjs` now emits the contract shape, so the database
  carries **one** content format rather than a special case every future
  consumer has to know about. `"✔️"`/`""` become `true`/`false`.

Verified: the page renders 85 lines against the live page's 86, and the table's
three empty cells render as dashes, matching the source.

### 5. `<StateHero ctaText=…>` has never rendered — NOT fixed

`src/states/_shared/StatePageKit.jsx:159` renders `<ConsultationButton />` with
no `label`. `StateHero` destructures `ctaText` and uses it only to decide margins
(lines 139, 152), so the label is dropped and the button's own default —
*"Book a 30 Minutes Free Consultation"* — shows instead.

All seven kit pages author a `ctaText` that has never appeared. `California/CPAfirms.jsx`
asks for *"Schedule a Free Consultation"*; the page has always said something else.

This is live today and predates the CMS work. It matters here because the
extractor captured the **authored** label, so the CMS render honours it — which
means cutover would silently change that button's text on seven pages. That is
arguably the correction the author intended, but it is a visible copy change and
should be a decision, not a side effect. `isKnownDelta` in `check:cms-preview`
excuses this difference by name so it cannot hide a real one.

### 6. Three FAQ headings would have been replaced at cutover — FIXED 1 Sep 2026

`FAQBlock` takes `title`/`highlight`; three California pages override them:

| Page | Heading |
|---|---|
| `Financial.jsx` | FAQs – Financial Controller Services in **California** |
| `Payroll.jsx` | Payroll Management **FAQs** |
| `Tax.jsx` | FAQs About Miltafs Tax Preparation Services in **California** |

`ServiceLayout`'s FAQ section hard-coded *"Frequently Asked Questions"*, so the
content contract had nowhere to put them and all three would have been flattened
to the generic heading. These are keyword-bearing `<h2>`s naming the service and
the state — copy, not chrome.

**Fixed** by giving `FAQSection` an optional `heading` and adding a `faqsHeading`
field to the contract. The extractor stores it only when a page overrides the
default, so the other 221 rows are unchanged and still render the generic
heading. Awaiting `--write` to reach the database.

### 7. Trailing whitespace in three SEO strings — FIXED 1 Sep 2026

Three source files carry a trailing space inside a meta string literal:

```
"Digital marketing agency in Wyoming | SEO & PPC | Milta "
"Bookkeeping services for small business in Washington | Milta "
"Accounting data entry services in Washington | Milta "
```

Invisible in JSX, but it survives into the column. A browser trims
`document.title`, so a `<title>` compares unequal to the row it came from and
every automated comparison reports a false difference forever. `meta[name=description]`
is **not** trimmed, so there the stray space is really shipped.

**Fixed** by trimming the SEO text columns as rows are collected in
`extract-state-pages.mjs`, rather than editing three files that are scheduled for
deletion. Awaiting `--write` to reach the database.

---

## Three constraints

*What breaks before Supabase storage ever does.*

The plan you were given debates the 500 MB free database tier. That limit is real
but distant. These three arrive first, and none of them are fixed by upgrading
Supabase.

### 1. The prerenderer cannot reach 800,000 pages

The build drives a real Chrome instance over every URL at a concurrency of 4. That
is fine for 363 pages. It does not survive three more orders of magnitude — a
single build would run for the better part of a week, every time you change a
shared component.

```
    800,000 pages
  ÷       4 concurrent
  ×       2 s per page
  ─────────────────────
  =   111 hours  (4.6 days)
        per build
```

### 2. The output does not fit the host

Prerendered pages average 39 KB. They ship as one `index.html` per directory,
zipped and uploaded. At 800K pages that is roughly 31 GB across about 1.6 million
filesystem entries — cPanel plans typically cap inodes between 200K and 600K, so
the upload is refused long before disk space is the issue.

```
  800,000 × 39 KB
  =  31 GB of HTML

  800,000 files
  + 800,000 dirs
  =  1.6M inodes
     cap: ~200-600K
```

### 3. 800K templated pages is an SEO liability, not an asset

That number is roughly every populated place in the US census multiplied by your 8
services. Pages generated from one template with a name swapped are what Google's
spam policy calls doorway pages, and quality signals apply site-wide — including to
the 363 pages that currently rank. This is your call to make, but make it
deliberately rather than as a side effect of the page count.

```
  ~100,000 places
  ×      8 services
  ─────────────────────
  =  800,000 pages

  distinct content
  written per page: 0
```

---

## Phase 0 — the fork

**Pick how city pages get served before anything else.**

Every phase after this one is shaped by the answer. Choosing late means rewriting
the delivery pipeline after the CMS has been built around it.

### Option A — Tiered: prerender what earns it ✅ Recommended

All 400 state pages plus your top 1,500–2,500 cities go through the existing
pipeline. The long tail is not built. You keep the current host, the current
deploy, and the current SEO behaviour.

- **Ships:** ~15–20K pages
- **Build:** 2–3 hours
- **Host:** No change
- **Cost:** $0–7/mo

### Option B — Render on request

City URLs are served by Node from Supabase at request time, behind a CDN. Unlimited
page count and instant edits, but it moves the SEO-critical path onto a server that
can never be slow or down.

- **Ships:** Unlimited
- **Build:** Unchanged
- **Host:** New SSR tier
- **Cost:** $25–70/mo

### Option C — Generate on first hit, then cache

A page is rendered the first time anything requests it, then cached as HTML.
Nothing is built for URLs nobody visits. More moving parts: cache invalidation on
every content edit becomes your problem.

- **Ships:** Unlimited
- **Build:** Near zero
- **Host:** Edge + storage
- **Cost:** $20–50/mo

> **Take Option A.** It is the only one that does not require replacing a deploy
> pipeline that currently works, and 2,000 real cities with genuinely local copy
> will outrank 100,000 templated ones. If the tail later proves it deserves pages,
> Option C bolts onto A without discarding anything — the phases below hold either
> way.

---

## The process — seven phases, in dependency order

Phase 1 is the one missing from every version of this plan so far, and nothing
downstream is possible without it. Do not start at the admin UI — it is the most
visible piece and the last one that can be built.

### Phase 0 · Settle the target
*½ day · decision only · **gate***

No code. Write down the number of city pages v1 actually ships and which serving
model carries them. Everything below assumes Option A and roughly 2,000 cities;
substitute your own figure.

**Exit check:** A written page count and serving model you would defend to a client.

---

### Phase 1 · Extract content out of the components
*✅ **complete***

**Built:**

- `db/001_pages.sql` — the `pages` and `page_revisions` tables. Columns match the
  extractor's row shape exactly; `kind` and `status` are Postgres enums; RLS grants
  the anon key published reads only; trigram index for city search. The identity
  CHECK constraints gate **publishing**, not drafting, so an incomplete row can be
  stored but can never reach the live site.
- `scripts/extract-state-pages.mjs` (`npm run extract:pages`) — handled all three
  source shapes: `ServiceLayout` props (216), `StatePageKit` JSX elements (7), and
  the one hand-built monolith (1). Wrote `db/extracted-pages.json` plus
  `db/extraction-report.txt`. `--write` upserted to Supabase on `url`.
- `scripts/verify-extraction.mjs` (`npm run verify:extraction`) — compared every
  extracted row against the prerendered HTML actually shipping in `dist/`.

> **Both scripts, and the JSX they read, have since been removed.** The migration
> is finished and the database is the source of truth, so `src/states/Delaware/`
> (8 files), `src/states/_shared/StatePageKit.jsx`, those two scripts and
> `link-current-crumb.mjs` were deleted — nothing imported them at runtime.
>
> `db/extracted-pages.json` is KEPT and is now the frozen record of what those
> files contained. It is what `check-service-templates.mjs`,
> `check-delaware-layout.mjs` and `check-document-lossless.mjs` compare the
> templates against, so it must not be deleted — but it can no longer be
> regenerated from source. The `source_file` values in it are historical labels
> now, not paths you can open.

**Result: 224 of 224 files extracted, zero failures.** Verification reports
**223/223 pages reproduced with zero text missing**. 224 unique URLs, no
collisions, no section silently dropped (audited prop-by-prop against the source).
215 published, 9 draft.

The kit pages map onto the same contract because `ServiceLayout.cardGroups` is
already an ordered, heterogeneous section list — it picks a renderer from the shape
of each entry (`rows` → table, `paragraphs` → prose, string `items` → checklist,
else cards). That is exactly a kit page's section order, so no second content
format was needed.

**The 9 drafts, and why they are drafts:**

- `California/Bookkeeping.jsx` — the monolith. Its copy lives in five named consts
  and extracts cleanly; only the section headings and intro prose are inline in
  JSX and need typing into the editor.
- `Salem/` (8 pages) — Salem is a **city**, and its own copy never says which one
  ("Salem, USA"; there is a Salem in Oregon, Massachusetts, Virginia and New
  Hampshire). Written with `state = null` rather than guessed. **Your decision.**

**Exit check:** ✅ met.

---

### Phase 2 · Serve those rows through the existing template
*2–3 days · smaller than first estimated*

The template already exists and already takes content as props — that work is
done. What remains is pointing it at the database instead of at 224 import
statements.

**Built (all additive — nothing existing was removed or rewired):**

- `src/states/_iconRegistry.js` — 72 icons, generated by
  `node scripts/gen-icon-registry.mjs` from the extracted rows. Deep single
  imports (`@mui/icons-material/Timer`), not named imports off the package root,
  which would defeat tree-shaking and pull in several thousand icons. `resolveIcon`
  accepts **either** a component or a name, so the 216 source files that still pass
  components keep working unchanged. All three call sites in `ServiceLayout` were
  already null-guarded — `CardGroup` even falls back to a numbered badge — so an
  unknown name renders no icon rather than crashing the page.
- `src/api/pages.js` — `getPageByUrl`, `getPageUrls`, `seoFromRow`. Matches
  `api/blogs.js`: anon key, RLS grants published rows only. Matches both trailing-
  slash forms, because 15 canonicals lack the slash.
- `src/pages/CmsServicePage.jsx` — fetches by path, renders
  `<ServiceLayout {...row.content} seo={seoFromRow(row)} />`. No mapping layer.
- `scripts/prerender.mjs` — `cmsPageRoutes()` enumerates published `pages` rows
  alongside the existing blog enumeration. **Paged at 1000**, because PostgREST
  caps a response there by default and an unpaged read would silently prerender
  the first thousand and drop the rest — the exact failure this file's own blog
  comment records happening once before. A missing table is not a build failure.

Verified: `npm run build:nossg` compiles clean, and the `mui-icons` chunk stayed
at 64 KB, so the registry did not bloat the bundle.

**Remaining — and deliberately not done yet:**

- **Run `npm run extract:pages -- --write`.** The database is now *behind* the
  extractor by four values (three FAQ headings and one trailing space, all
  described under "Live bugs" below). Nothing public reads those rows yet, and
  `page_revisions` is still 0, so no hand-edit can be lost by re-upserting.
  *(Corrected: `--write` is **not** blocked. It reads `server/.env`, where
  `SUPABASE_SERVICE_ROLE_KEY` is set — an earlier draft said the key was missing
  because it looked only at the Vite root `.env`.)*
- **Delete `src/states/` — last, and not before the database path is proven.**
  *(Corrected: `milta-web/` **is** a git repository — `git log` shows history
  back through the SEO work. A deletion is recoverable. The earlier warning that
  there is "no undo" was wrong; the primary working directory `d:\milta-web-v3`
  is not a repo, but the project inside it is.)* Prove the CMS route first, then
  remove files in batches.

**Done since:** the CMS route is mounted, and the comparison it exists to support
now runs.

- `App.jsx` mounts `CmsServicePage` at **`/cms-preview/*`** — lazily, so it keeps
  its own 8 KB chunk and never lands in a public page's graph. It renders a row
  at a *second* URL, so it is kept out of the index three ways: added to
  `EXCLUDE` in `prerender.mjs`, disallowed in `robots.txt`, and the row's own
  canonical still points at the real URL. `prerender.mjs` now also skips any
  route containing `*` — a splat is a pattern, not a URL, and would otherwise
  have been queued for rendering as a literal path.
- `CmsServicePage` takes a `stripPrefix` prop, so one component serves a row at
  its real URL and at the preview URL. Without it the preview looked up
  `/cms-preview/us/...`, which matches no row.
- `scripts/check-cms-preview.mjs` (`npm run check:cms-preview`) is the gate. It
  renders each sampled URL **twice in a real browser** — once from the database
  and once from the hard-coded component — and compares them. Sampling is
  deterministic and per-service, so every service is covered and a failure
  reproduces.

**Current result: 186 checks pass, 4 fail, across 19 pages** (`--sample 16`; use
`--all` for all 215). All four failures are the same thing — the database is
behind the extractor — and all four clear with the `--write` above.

Two lessons are worth keeping, because they shaped the check:

- **Compare line multisets, not word sequences.** The seven kit pages put the
  breadcrumb between the h1 and the subtitle; ServiceLayout puts it after. A
  word-by-word diff reported six pages "differing at word 7" and said nothing
  about the seventh, which was *crashing*. Ordering-insensitive comparison
  surfaced the crash immediately.
- **Name the known differences instead of skipping the pages that have them.**
  `isKnownDelta` excuses exactly two things — the consultation-button label and
  zero-padded card badges. Excusing the kit *pages* wholesale would have hidden
  the crash, since the crash was on a kit page.

**Exit check:** `npm run build` produces the same 363 pages, and `check:seo` passes
unchanged.

---

### Phase 3 · Admin API on the existing Express server
*✅ **complete***

`server/admin.js`, mounted at `/api/admin` by `server.js`. Kept in its own module
because it is the only part of the server that uses the service role key and
requires auth — mixing it into the public form handlers would make that boundary
easy to lose.

**Auth.** Built on `node:crypto`, no new dependencies: scrypt for the password,
HMAC-SHA256 for session tokens, `timingSafeEqual` on both. A single shared
credential does not justify adding JWT and bcrypt packages to a deploy that also
handles contact forms. Per-IP rate limiting (8 attempts, 15-min lockout).
Generate credentials with `node scripts/make-admin-password.mjs "<password>"`.

**Endpoints** — everything below `/login` requires a bearer token:

| Method | Route | Notes |
|---|---|---|
| POST | `/login` | rate limited |
| GET | `/me` | token check |
| GET | `/pages` | filters `q`,`state`,`service`,`kind`,`status`; paginated |
| GET | `/facets` | distinct values for dropdowns |
| GET | `/pages/:id` | full row incl. `content` |
| PATCH | `/pages/:id` | whitelisted fields; writes a revision first |
| POST | `/pages/:id/publish` · `/unpublish` | |
| GET | `/pages/:id/revisions` | |
| POST | `/pages/:id/revert` | current state snapshotted first, so a revert is reversible |

**Guardrails.** The list endpoint never selects `content` — at ~8 KB a row, a
100-row page would ship close to a megabyte to draw a table of titles. `pageSize` is
capped at 100. `url`, `id`, `source_file` and `extracted_at` are not writable:
changing a URL is a routing change, not a content edit. Postgres error 23514 is
translated into "Cannot publish: a published page needs its state…" rather than a
raw constraint name.

**Fails closed.** With `ADMIN_*` unset the module logs what is missing, returns
503 on every admin route, and leaves the rest of the server untouched — verified
that `/api/blogs` still answers 200.

**The blog write path is now behind the same gate.** `requireAdmin` is exported
from `admin.js` and applied to `POST /api/blogs/:id/update` in `server.js`, so
there is one auth implementation rather than two. That route was previously open
to the internet — see the security note below.

**Exit check:** ✅ 17 automated checks pass against a live server, covering
auth rejection, signature tampering, pagination caps, search, filters, field
whitelisting, revision-on-save, revert, and publish-gating. Test data removed
afterwards; database back to 224 pages / 0 revisions.

---

### Phase 4 · The admin screen
*✅ **complete***

`/admin`, lazy-loaded so the editor never lands in a public page's chunk (its own
16 KB bundle). Excluded from `EXCLUDE` in `prerender.mjs` and disallowed in
`robots.txt`, the way `/uk/addblog` is — verified after a full build: no
`dist/admin`, and the only "admin" string in `sitemap.xml` is a blog slug that
happens to contain the word.

| File | Role |
|---|---|
| `src/admin/AdminApp.jsx` | login gate, list ⇄ editor |
| `src/admin/api.js` | token storage, typed calls, 401 → sign-out |
| `src/admin/PageList.jsx` | search + filters, server-paginated |
| `src/admin/PageEditor.jsx` | meta fields, content, publish, history |
| `src/admin/ContentEditor.jsx` | recursive editor for the `content` object |
| `src/admin/SeoPreview.jsx` | search-result preview with length counters |

**The content editor walks the data rather than hard-coding a form per section.**
ServiceLayout takes 13 optional sections, `cardGroups` renders differently per
entry shape, and city pages will add more — a form per section would need revising
every time the contract grows. Strings become text fields (multiline when long),
arrays become add/remove lists, objects recurse. Sections are ordered to match
ServiceLayout's render order, not JSON key order. `icon` is the one field that is
not free text: it gets a picker limited to the 72 names the registry knows, because
a typo there silently renders no icon.

**Safety.** Typing never touches the live site — save writes a revision, publish is
a separate deliberate action, and publish is disabled while there are unsaved
changes. A `beforeunload` guard catches navigating away mid-edit. The server's
refusal to publish an identity-less row surfaces verbatim.

**Exit check:** ✅ 9 automated browser checks pass against the real screen —
signed-out shows only a login form with no page data behind it, the list renders
server-paginated rows with the correct total, the editor opens with meta fields,
SEO preview and content sections, and the console is free of React errors.

Two defects were found and fixed by looking at the rendered screenshots rather
than trusting the checks: the site's floating `SocialBar` was sitting on top of the
**Publish** button (now suppressed on `/admin`), and sections listed in JSON key
order put *Faqs* above *Hero*.

---

### Phase 5 · Document ingestion
*✅ **complete***

Your instinct here was right: upload to Supabase Storage, extract, map to fields,
delete the source. Uploads never touch Render's disk — multer keeps the file in
memory and it goes straight to object storage.

**New dependencies** (server only — the frontend bundle is unchanged):
`mammoth` 1.12 for DOCX, `pdf-parse` 2.4 for PDF. Neither introduced a
vulnerability; the 5 that `npm audit` reports in `server/` are pre-existing, via
`ws` (from `@supabase/supabase-js`) and `qs` (from `express`).

| File | Role |
|---|---|
| `server/ingest.js` | parse → blocks → proposal. Touches no table. |
| `server/admin.js` | `POST /api/admin/ingest`, behind `requireAdmin` |
| `src/admin/DocumentImport.jsx` | review panel, one "Use this" per suggestion |

**Extraction proposes; it never writes.** The endpoint returns a suggestion and
nothing else. Each field is applied by hand, one click at a time, and even then it
only lands in the *unsaved* draft — the editor still has to press Save. A
heuristic that guesses a title from the first heading will sometimes be wrong, and
being wrong should cost a click to undo, not a revision to recover.

DOCX goes through mammoth, which yields semantic HTML, so the document's own
structure (headings, bullets, `Q:`/`A:` pairs) maps onto ServiceLayout sections.
PDF has no reliable structure and degrades to paragraphs.

**Storage.** A private `ingest` bucket (the three existing buckets are all
public), 10 MB limit, MIME-restricted. The file is deleted in a `finally` block —
including when parsing *fails*, since a document that could not be read is exactly
the one there is no reason to keep. One document per request; batch imports belong
in a local script against the API, not in a 512 MB dyno that also answers contact
forms.

**Exit check:** ✅ 16 unit checks (`npm test` in `server/`) against real files —
a DOCX built in the test, mammoth's own fixtures, and a hand-built PDF — plus 10
route checks (`npm run test:routes`) and 6 browser checks inside
`npm run check:admin`, which drives a real `.docx` through the file input and
applies a suggestion. Verified afterwards: `pages` still 224, `page_revisions`
still 0, ingest bucket empty, and the page used for the test byte-identical to
before.

One bug worth recording: validation originally ran *after* the upload, so the
bucket's own MIME rule rejected the file first and surfaced its wording ("mime
type text/plain is not supported") instead of ours — and spent two network calls
on a file that was never going to be read.

---

### Phase 6 · Load the real volume and measure
*3–4 days · go / no-go*

The database-size half of this question is now answered with a real measurement
rather than an estimate. The 216 complete rows average **9.0 KB** each:

| Pages | Content size | Verdict |
|---|---|---|
| 400 (states only) | 4 MB | Free tier, comfortably |
| 20,000 (Option A) | 176 MB | **Fits Supabase Free's 500 MB** |
| 800,000 | 6.9 GB | Needs Pro's 8 GB, before indexes |

So Option A does not require paying for Supabase at all — the free database tier
holds the tiered target with room to spare. Only the 800K plan forces the upgrade,
and it lands uncomfortably close to Pro's ceiling.

Still to measure at volume:

- Seed to your Phase 0 target. Measure **search latency, full build wall time,
  dist size, and file count.**
- Index `slug`, `state` and `city`. Without them, admin search degrades badly
  somewhere in the low tens of thousands of rows.
- Run one **full production build** at target volume and time it. If it exceeds
  what you will tolerate on every deploy, cut the page count here — not after
  launch.

**Exit check:** Real measurements, and a page count you have confirmed the pipeline
can build and ship.

---

### Phase 7 · Cutover
*2–3 days*

States carry the real risk, because they replace pages that already rank. Ship them
first and on their own.

- Run `check:seo` and `verify:deploy` against the live host. That second script
  exists because a partial upload once collapsed the whole site into a single
  canonical — do not skip it.
- Release cities in batches, watching indexation between them rather than
  publishing all at once.

**Exit check:** Sitemap count matches expectation, canonicals resolve, and no drop
in the 363 pages that ranked before.

---

## Hosting — what to pay for, and the reason that actually applies

One correction to the tiering you were given: your frontend is not on Render. It is
static HTML on Apache. Render serves only the API, which changes what the free tier
costs you.

| Component | Today | Free tier holds? | What forces a change |
|---|---|---|---|
| Frontend | Apache / cPanel | **Yes** | Inode cap, somewhere past ~20K pages |
| Express API | Render Free | **Upgrade** | Cold starts on the contact form — see below |
| Database | Supabase Free | **Measure** | 500 MB; answer this at Phase 6, not now |
| Storage | Supabase Free | **Yes** | Nothing, if you delete after extraction |
| Bulk import | — | **Do not** | Run locally against the API, never on the dyno |

The reason to leave Render's free tier is not page count — it is that the service
sleeps after 15 minutes and takes about a minute to wake. Your API handles
`/api/contact`, `/api/newsletter` and `/api/apply`. A prospect who submits the
contact form during that cold start waits a minute or gives up. That is a lost
lead, and it is happening today, before any of this work starts.

At $7 a month that is the highest-value fix in this document, and it is independent
of everything else. Do it now.

---

## Reference — files this process touches

| Path | Role |
|---|---|
| `src/App.jsx` | 288 routes; collapses to about 60 in Phase 2 |
| `src/states/` | 227 files, 8 services across 28 states — deleted in Phase 2 |
| `src/utils/useFullSEO.js` | Meta tags; its config object becomes the CMS columns |
| `scripts/prerender.mjs` | `CMS_TABLES` and `extractRoutes` — the extension point |
| `server/server.js` | 398 lines; admin endpoints extend this, not a new service |
| `src/api/blogs.js` | The read pattern to copy for pages |
| `scripts/verify-deploy.mjs` | Post-deploy gate; mandatory at Phase 7 |
| `src/components/Location/statesData.js` | Existing state-to-service URL map; seed data for Phase 1 |
