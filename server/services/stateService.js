// State Data — the editorial record behind /areas-we-serve.
//
// That listing was driven entirely by a hand-written file
// (src/components/Location/statesData.js), so a state created in the CMS had
// nowhere to put its own description and appeared with a generated one. This is
// where a state's copy lives, and the site reads it alongside the file.
//
// Every read here tolerates the `states` table not existing yet: db/002 has to be
// run in the SQL editor, and until it is, the rest of the CMS must keep working
// rather than 500 on a missing relation.

const { table, run } = require("./databaseService");

// PostgREST's code for "undefined table". Anything else is a real error and is
// allowed to surface.
const MISSING_TABLE = /42P01|does not exist|schema cache/i;

const slugOf = (name) => String(name || "").trim().replace(/\s+/g, "").toLowerCase();

const STATE_KINDS = ["state", "service_state"];
const CITY_KINDS = ["city", "service_city"];

const tolerate = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    if (MISSING_TABLE.test(error?.message || "")) return fallback;
    throw error;
  }
};

// The verification columns arrive with db/002 as well, so a select naming them
// fails on an un-migrated database. Ask for them, and fall back to the columns
// that have always existed rather than taking the whole panel down.
const VERIFY_COLS = "imported_at,import_source,import_text,verified_at,verified_by,verified_hash,verification_note";

const selectPages = async (base, extra = VERIFY_COLS) => {
  try {
    const { data } = await run(base(`${extra},`));
    return { rows: data || [], migrated: true };
  } catch (error) {
    if (!/does not exist|42703|schema cache|column/i.test(error?.message || "")) throw error;
    const { data } = await run(base(""));
    return { rows: data || [], migrated: false };
  }
};

/** Every state on record, with how many pages each one has. */
async function listStates({ country = "us" } = {}) {
  const states = await tolerate(
    async () => (await run(table("states").select("*").eq("country", country).order("name"))).data || [],
    null,
  );

  // Pages are the source of truth for what exists; the states table adds the
  // editorial detail. A state with pages but no row still has to be listed, or
  // the panel would hide most of the site.
  const { rows: pages, migrated } = await selectPages(
    (extra) => table("pages").select(`state,status,${extra}id`).eq("kind", "service_state"),
  );

  const byState = new Map();
  for (const p of pages || []) {
    if (!p.state) continue;
    const key = slugOf(p.state);
    if (!byState.has(key)) byState.set(key, { name: p.state, pages: 0, published: 0, imported: 0, verified: 0 });
    const e = byState.get(key);
    e.pages += 1;
    if (p.status === "published") e.published += 1;
    if (p.import_text) e.imported += 1;
    if (p.verified_at) e.verified += 1;
  }

  const rows = [];
  const seen = new Set();

  for (const s of states || []) {
    const key = slugOf(s.name);
    seen.add(key);
    rows.push({ ...s, counts: byState.get(key) || { pages: 0, published: 0, imported: 0, verified: 0 } });
  }

  for (const [key, counts] of byState) {
    if (seen.has(key)) continue;
    // Known from its pages, but with no State Data row yet.
    rows.push({
      id: null, name: counts.name, slug: key, country,
      description: null, notes: null, status: "active",
      unregistered: true,
      counts,
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return { states: rows, tableMissing: states === null, migrated };
}

async function getState(slug, { country = "us" } = {}) {
  const row = await tolerate(
    async () => (await run(table("states").select("*").eq("slug", slug).eq("country", country).maybeSingle())).data,
    null,
  );

  const { rows: pages } = await selectPages(
    (extra) => table("pages")
      .select(`id,url,state,service,status,updated_at,content,${extra}kind`)
      .eq("kind", "service_state")
      .order("service"),
  );

  const mine = pages.filter((p) => slugOf(p.state || "") === slug);
  return { state: row, pages: mine };
}

async function upsertState(input, { country = "us" } = {}) {
  const name = String(input?.name || "").trim();
  if (!name) return { error: "A state name is required." };

  const row = {
    name,
    slug: slugOf(name),
    country,
    description: input.description ?? null,
    notes: input.notes ?? null,
    status: input.status === "hidden" ? "hidden" : "active",
    updated_at: new Date().toISOString(),
  };

  try {
    const { data } = await run(
      table("states").upsert(row, { onConflict: "slug,country" }).select().maybeSingle(),
    );
    return { state: data };
  } catch (error) {
    if (MISSING_TABLE.test(error?.message || "")) {
      return { error: "State Data is not set up yet — run db/002_states_and_verification.sql." };
    }
    if (/duplicate key/i.test(error?.message || "")) {
      return { error: `${name} already exists.` };
    }
    return { error: error.message };
  }
}

/* ── Whole-state removal ──────────────────────────────────────────────────── */
//
// The counterpart to deleting one page: take a state out of the CMS completely.
// Matching is by slug, so "New York" and "new york" both resolve here even if a
// stray page was saved with the odd spelling.

// Resolve every exact `state` spelling that maps to this slug. Usually one.
async function namesForSlug(target) {
  const { data } = await run(
    table("pages").select("state").not("state", "is", null).limit(20000),
  );
  return [...new Set((data || []).map((r) => r.state).filter((s) => slugOf(s) === target))];
}

// What a removal would take with it — read by the dashboard to fill the warning
// before anything is deleted.
async function stateSummary(slug, { country = "us" } = {}) {
  const target = slugOf(slug);

  const row = await tolerate(
    async () => (await run(
      table("states").select("*").eq("slug", target).eq("country", country).maybeSingle(),
    )).data,
    null,
  );

  const names = await namesForSlug(target);

  const count = async (build) => {
    if (!names.length) return 0;
    const { count: n } = await run(build(
      table("pages").select("id", { count: "exact", head: true }).in("state", names),
    ));
    return n || 0;
  };

  const [statePages, statePagesPublished, cityPages] = await Promise.all([
    count((q) => q.in("kind", STATE_KINDS)),
    count((q) => q.in("kind", STATE_KINDS).eq("status", "published")),
    count((q) => q.in("kind", CITY_KINDS)),
  ]);

  return {
    slug: target,
    name: row?.name || names[0] || String(slug),
    country,
    hasData: Boolean(row),
    statePages,
    statePagesPublished,
    cityPages,
  };
}

// Permanent. page_revisions cascades with each page (db/001_pages.sql), so a
// removed state has no history to restore from — same as deletePage, at the
// scale of a whole state. City pages are left alone unless `includeCities`.
async function deleteState(slug, { country = "us", includeCities = false } = {}) {
  const target = slugOf(slug);
  const names = await namesForSlug(target);

  const result = { slug: target, statePages: 0, cityPages: 0, deletedStateRow: false };

  if (names.length) {
    const stateDel = await run(
      table("pages").delete({ count: "exact" }).in("kind", STATE_KINDS).in("state", names),
    );
    result.statePages = stateDel.count || 0;

    if (includeCities) {
      const cityDel = await run(
        table("pages").delete({ count: "exact" }).in("kind", CITY_KINDS).in("state", names),
      );
      result.cityPages = cityDel.count || 0;
    }
  }

  // The editorial row, if the table exists and a row is there.
  await tolerate(async () => {
    const { data } = await run(
      table("states").delete().eq("slug", target).eq("country", country).select("id"),
    );
    result.deletedStateRow = (data || []).length > 0;
    return null;
  }, null);

  return result;
}

module.exports = {
  listStates, getState, upsertState, slugOf, stateSummary, deleteState,
};
