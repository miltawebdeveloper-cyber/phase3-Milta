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

async function run(query) {
  const { data, error, count } = await query;
  const translated = translate(error);
  if (translated) throw translated;
  return { data, count };
}

module.exports = { table, run, configured, DatabaseError, rawClient: () => client };
