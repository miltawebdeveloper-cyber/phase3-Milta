// The ONLY module that knows the database is Supabase.
//
// Everything above this layer works in plain rows and plain errors, so moving to
// a VPS with Postgres means rewriting this file and storageService.js — not the
// API, not the services above, and nothing at all in React.
//
// Uses the service role key, which bypasses RLS. That key must never leave the
// server process.

require("../dns-bypass");
const { createClient } = require("@supabase/supabase-js");

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configured = Boolean(URL && SERVICE_KEY);

const client = configured
  ? createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// Postgres error codes translated once, here, so no caller has to know them.
class DatabaseError extends Error {
  constructor(message, { code, conflict = false } = {}) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.conflict = conflict;
  }
}

function translate(error) {
  if (!error) return null;
  if (error.code === "23514") {
    return new DatabaseError(
      String(error.message).includes("identity")
        ? "A published page needs its state (and city, for a city page) filled in."
        : "That change breaks a database rule for this page.",
      { code: error.code, conflict: true },
    );
  }
  if (error.code === "23505") {
    return new DatabaseError("Another page already uses that URL.", { code: error.code, conflict: true });
  }
  return new DatabaseError(error.message || "Database error", { code: error.code });
}

const table = (name) => {
  if (!configured) throw new DatabaseError("Database is not configured on this server.");
  return client.from(name);
};

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// The network path to Supabase from this host is unreliable at the TLS layer
// (see dns-bypass.js) — connections intermittently hang until they time out,
// surfacing here as postgrest-js resolving with `status: 0` instead of
// rejecting. That status is postgrest-js's own signal for "the request never
// got a response" (as opposed to a real Postgres/PostgREST error, which always
// carries a real HTTP status), so it is what marks an attempt as retryable.
// A short per-attempt deadline (well under the ~10s connect timeout we've
// observed failing attempts take) keeps a bad attempt from eating the whole
// retry budget.
const ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 6000;

// The retry loop on its own, returning postgrest-js's raw response
// ({ data, error, count, status }) rather than throwing — exported so any
// caller with its own Supabase client (server.js's public, anon-key routes
// included) gets the same resilience without going through the service-role
// `table()`/`run()` pair above, which is deliberately restricted to this
// service-role client.
async function retryQuery(query) {
  let result;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    if (typeof query.abortSignal === "function") query.abortSignal(AbortSignal.timeout(ATTEMPT_TIMEOUT_MS));
    // eslint-disable-next-line no-await-in-loop
    result = await query;
    const isNetworkFailure = result.status === 0 && result.error;
    if (!isNetworkFailure || attempt === ATTEMPTS) break;
    // eslint-disable-next-line no-await-in-loop
    await sleep(300 * attempt);
  }
  return result;
}

async function run(query) {
  const { data, error, count } = await retryQuery(query);
  const translated = translate(error);
  if (translated) throw translated;
  return { data, count };
}

module.exports = { table, run, retryQuery, configured, DatabaseError, rawClient: () => client };
