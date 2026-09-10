// Pages, states, cities and revisions. Speaks rows; knows nothing about HTTP.

const { table, run } = require("./databaseService");

// The list view never selects `content`: it is ~8 KB a row, and a 100-row page
// would ship close to a megabyte to draw a list of titles.
const SUMMARY = "id,kind,country,state,city,service,url,slug,meta_title,status,updated_at";

const STATE_KINDS = ["state", "service_state"];
const CITY_KINDS = ["city", "service_city"];

const kindsFor = (pageType) => (pageType === "city" ? CITY_KINDS : STATE_KINDS);

// Postgres `or` filters take a comma-separated list, so a search term containing
// a comma or parenthesis would change the filter's meaning.
const safeTerm = (q) => String(q || "").replace(/[%,()]/g, " ").trim();

/* ── Lookups for the dashboard ────────────────────────────────────────────── */

// Distinct states that actually have pages of this type.
async function listStates(pageType) {
  const { data } = await run(
    table("pages").select("state").in("kind", kindsFor(pageType)).not("state", "is", null).limit(20000),
  );
  return [...new Set((data || []).map((r) => r.state))].sort();
}

// Cities within one state. Server-side search and a hard cap: there is no path
// here that can return 800,000 rows to a browser.
async function listCities(state, { q = "", limit = 50 } = {}) {
  let query = table("pages")
    .select("city")
    .in("kind", CITY_KINDS)
    .eq("state", state)
    .not("city", "is", null);

  const term = safeTerm(q);
  if (term) query = query.ilike("city", `%${term}%`);

  const { data } = await run(query.limit(Math.min(limit, 200) * 8));
  return [...new Set((data || []).map((r) => r.city))].sort().slice(0, Math.min(limit, 200));
}

/* ── Pages ────────────────────────────────────────────────────────────────── */

// The pages belonging to one state (or one city within a state). A state has one
// row per service, so this is what the user picks from after choosing a location.
async function listPages({ pageType, state, city, q = "", page = 1, pageSize = 25 }) {
  const size = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const from = (Math.max(Number(page) || 1, 1) - 1) * size;

  let query = table("pages").select(SUMMARY, { count: "exact" }).in("kind", kindsFor(pageType));

  if (state) query = query.eq("state", state);
  if (city) query = query.eq("city", city);
  else if (pageType === "state") query = query.is("city", null);

  const term = safeTerm(q);
  if (term) {
    query = query.or(
      `meta_title.ilike.%${term}%,url.ilike.%${term}%,service.ilike.%${term}%,city.ilike.%${term}%`,
    );
  }

  const { data, count } = await run(
    query.order("service", { ascending: true }).range(from, from + size - 1),
  );

  return {
    rows: data || [],
    page: Math.max(Number(page) || 1, 1),
    pageSize: size,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / size)),
  };
}

async function getPage(id) {
  const { data } = await run(table("pages").select("*").eq("id", id).maybeSingle());
  return data ?? null;
}

/* ── Revisions ────────────────────────────────────────────────────────────── */

// Written BEFORE any update, so if the update fails the history still records
// what was there. This is what makes an automatic overwrite recoverable.
async function saveRevision(page, { editedBy, note }) {
  await run(
    table("page_revisions").insert({
      page_id: page.id,
      snapshot: page,
      edited_by: editedBy || null,
      note: note || null,
    }),
  );
}

async function listRevisions(pageId, limit = 20) {
  const { data } = await run(
    table("page_revisions")
      .select("id,edited_by,note,created_at")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(Number(limit) || 20, 1), 50)),
  );
  return data || [];
}

async function getRevision(pageId, revisionId) {
  const { data } = await run(
    table("page_revisions").select("*").eq("id", revisionId).eq("page_id", pageId).maybeSingle(),
  );
  return data ?? null;
}

/* ── Writes ───────────────────────────────────────────────────────────────── */

// `url` is deliberately not writable: it is the join key to the router, the
// sitemap and the prerenderer, so changing it is a routing change, not a content
// edit. `id`, `created_at` and the extraction provenance are not client-settable.
const WRITABLE = new Set([
  "meta_title", "meta_description", "meta_keywords", "canonical",
  "author", "robots", "og_title", "og_description", "og_image",
  "content", "content_format", "kind", "country", "state", "city", "service", "status",
]);

// Create a page. `url` IS settable here — unlike on update, where changing it
// would silently move an existing page out from under the router, the sitemap
// and the prerenderer. On create there is nothing to move.
//
// New pages are always drafts. A page assembled from one document has never been
// looked at on the live site, and publishing is one deliberate click away.
const URL_SHAPE = /^\/[\w\-./]*$/;

async function createPage(input = {}) {
  const url = String(input.url || "").trim();
  if (!url) return { error: "A page URL is required." };
  if (!url.startsWith("/")) return { error: "The page URL must start with a slash, e.g. /us/services/…" };
  if (!URL_SHAPE.test(url)) return { error: "The page URL may only contain letters, numbers, - _ . and /" };

  const state = String(input.state || "").trim();
  if (!state) return { error: "A state is required." };

  const city = String(input.city || "").trim() || null;
  const service = String(input.service || "").trim() || null;

  // A new page gets its SERVICE's structure, the same way an upload to an
  // existing page does.
  //
  // Without this a page created from a document came out shaped like the
  // document alone, while the identical document uploaded to an existing page
  // came out shaped like its service — so "add a new Bookkeeping page" and
  // "update a Bookkeeping page" produced different pages from the same file.
  // One path, one result.
  let content = input.content ?? "";
  let template = null;
  if (content && typeof content === "object" && !Array.isArray(content) && service) {
    // eslint-disable-next-line global-require
    const { templateFor } = require("./serviceTemplates");
    // eslint-disable-next-line global-require
    const { applyDocumentStructure } = require("./layoutMerge");
    template = templateFor(service);
    if (template) content = applyDocumentStructure({}, content, { template, state: city || state }).content;
  }

  // kind follows the identity that is actually present, so the database's own
  // publish constraints line up with the row rather than fighting it.
  const kind = city ? "service_city" : service ? "service_state" : "state";

  const row = {
    kind,
    country: input.country || "us",
    state,
    city,
    service,
    url,
    slug: url.replace(/\/+$/, "").split("/").pop() || url,
    meta_title: input.meta_title ?? null,
    meta_description: input.meta_description ?? null,
    meta_keywords: input.meta_keywords ?? null,
    canonical: input.canonical ?? null,
    content,
    // The format has to follow the content it describes. A structured body is
    // always servicelayout/v1 — labelling it "html" would have it read back as a
    // string by anything that trusts this column. Only a string body can be
    // plain or html, and the caller's choice is honoured there.
    content_format: content && typeof content === "object"
      ? "servicelayout/v1"
      : (input.content_format === "plain" ? "plain" : "html"),
    status: "draft",
    source_file: input.source_file ?? null,
  };

  try {
    const { data } = await run(table("pages").insert(row).select().maybeSingle());
    return { page: data };
  } catch (error) {
    // A duplicate URL is the one failure a user can actually fix, so name it.
    if (error.conflict) return { error: `A page already exists at ${url}.` };
    throw error;
  }
}

// The `internal` option widens the whitelist to the server-set provenance columns
// (import_*, verified_*). They are never client-settable: the import baseline is
// what a cross-check is measured against, so a caller that could write it could
// declare any page complete.
const INTERNAL = new Set([
  "import_text", "import_source", "imported_at",
  "verified_at", "verified_by", "verified_hash", "verification_note",
]);

async function updatePage(id, patch, { editedBy, note, internal = false } = {}) {
  const current = await getPage(id);
  if (!current) return null;

  const clean = {};
  const ignored = [];
  for (const [key, value] of Object.entries(patch || {})) {
    if (WRITABLE.has(key) || (internal && INTERNAL.has(key))) clean[key] = value;
    else ignored.push(key);
  }
  if (!Object.keys(clean).length) return { page: current, ignored, changed: false };

  await saveRevision(current, { editedBy, note });

  try {
    const { data } = await run(table("pages").update(clean).eq("id", id).select().maybeSingle());
    return { page: data, ignored, changed: true };
  } catch (error) {
    // db/002 has not been run yet, so the provenance columns do not exist. The
    // content edit matters more than the audit trail for it — retry without them
    // rather than failing the save.
    const missingColumn = /42703|column .* does not exist|schema cache/i.test(error?.message || "");
    const dropped = Object.keys(clean).filter((k) => INTERNAL.has(k));
    if (!missingColumn || !dropped.length) throw error;
    for (const k of dropped) delete clean[k];
    if (!Object.keys(clean).length) return { page: current, ignored, changed: false };
    const { data } = await run(table("pages").update(clean).eq("id", id).select().maybeSingle());
    return { page: data, ignored: [...ignored, ...dropped], changed: true, unmigrated: true };
  }
}

// Permanent. page_revisions carries `on delete cascade` (db/001_pages.sql), so
// the page's history goes with it — there is no revision to restore from after
// this, unlike updatePage.
async function deletePage(id) {
  const current = await getPage(id);
  if (!current) return null;
  await run(table("pages").delete().eq("id", id));
  return { page: current };
}

// Same no-undo semantics as deletePage, for a set of pages chosen in the
// dashboard. The rows are read back first so the caller can report exactly which
// ones existed — an id that matched nothing is simply absent from `deleted`,
// never an error. One `in` delete, so the cascade fires per row as usual.
async function deletePages(ids) {
  const list = [...new Set((ids || []).map((v) => String(v).trim()).filter(Boolean))];
  if (!list.length) return { deleted: [], requested: 0 };

  const { data } = await run(table("pages").select(SUMMARY).in("id", list));
  const found = data || [];
  if (found.length) {
    await run(table("pages").delete().in("id", found.map((p) => p.id)));
  }
  return { deleted: found, requested: list.length };
}

async function revertPage(id, revisionId, { editedBy } = {}) {
  const revision = await getRevision(id, revisionId);
  if (!revision) return { error: "notFound" };

  const restore = {};
  for (const key of WRITABLE) {
    if (revision.snapshot[key] !== undefined) restore[key] = revision.snapshot[key];
  }
  const result = await updatePage(id, restore, {
    editedBy,
    note: `revert to revision ${revisionId}`,
  });
  return result ? { page: result.page } : { error: "notFound" };
}

// Every state page with the columns a cross-check needs. The list is small
// (one row per service per state) and the panel has to show a status for each,
// so it is fetched whole rather than paged.
async function listAllForVerification({ state } = {}) {
  const cols = "id,url,state,service,status,updated_at,content";
  const build = (extra) => {
    let q = table("pages").select(extra ? cols + "," + extra : cols).in("kind", STATE_KINDS);
    if (state) q = q.eq("state", state);
    return q.order("state").order("service").limit(5000);
  };
  try {
    const { data } = await run(build("import_text,import_source,imported_at,verified_at,verified_by,verified_hash,verification_note"));
    return data || [];
  } catch (error) {
    // db/002 not run yet: report on structure alone rather than failing.
    if (!/42703|does not exist|schema cache|column/i.test(error?.message || "")) throw error;
    const { data } = await run(build(""));
    return data || [];
  }
}

module.exports = {
  listAllForVerification,
  listStates, listCities, listPages, getPage, createPage,
  updatePage, deletePage, deletePages, revertPage, listRevisions, saveRevision,
  SUMMARY, WRITABLE,
};
