// Phase 3 — admin API for the `pages` CMS.
//
// Mounted at /api/admin by server.js. Every route below the login handler
// requires a bearer token; there is no unauthenticated write path.
//
// Two deliberate choices worth knowing:
//
// 1. This uses the SERVICE ROLE key, not the anon key the rest of server.js
//    uses. The anon key cannot write to `pages` at all — RLS grants it published
//    reads only. That key must never leave this process.
//
// 2. Auth is built on node:crypto rather than a JWT/bcrypt dependency. A single
//    shared admin credential does not justify pulling more packages into a
//    deploy that handles contact forms, and scrypt + HMAC are in the standard
//    library. If you later need per-editor accounts, swap this for Supabase Auth
//    — the middleware boundary below is the only thing that changes.

const crypto = require("crypto");
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

/* =========================================
   CONFIG
   ========================================= */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 12);

// Fail closed and loudly. A misconfigured admin API that silently accepts
// everything is worse than one that refuses to start.
const configProblems = [];
if (!SUPABASE_URL) configProblems.push("VITE_SUPABASE_URL");
if (!SERVICE_KEY) configProblems.push("SUPABASE_SERVICE_ROLE_KEY");
if (!PASSWORD_HASH) configProblems.push("ADMIN_PASSWORD_HASH");
if (!SESSION_SECRET) configProblems.push("ADMIN_SESSION_SECRET");

const CONFIGURED = configProblems.length === 0;
if (!CONFIGURED) {
  console.error(
    `[admin] disabled — missing env: ${configProblems.join(", ")}\n` +
      `        generate the first two with: node scripts/make-admin-password.mjs`,
  );
}

const db = CONFIGURED
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

router.use((req, res, next) => {
  if (!CONFIGURED) {
    return res.status(503).json({
      error: "Admin API is not configured on this server.",
      missing: configProblems,
    });
  }
  next();
});

/* =========================================
   TOKENS
   ========================================= */

const b64url = (buf) => Buffer.from(buf).toString("base64url");

const sign = (payload) => {
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
};

const verify = (token) => {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  // timingSafeEqual throws on length mismatch, which is itself a signal, so
  // compare digests of equal length only.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

// Hash format: scrypt$<saltHex>$<keyHex>, produced by scripts/make-admin-password.mjs
const checkPassword = (password) => {
  if (typeof password !== "string" || !password) return false;
  const [scheme, saltHex, keyHex] = String(PASSWORD_HASH).split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    console.error("[admin] ADMIN_PASSWORD_HASH is malformed");
    return false;
  }
  const expected = Buffer.from(keyHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(expected, actual);
};

/* =========================================
   LOGIN  (rate limited)
   ========================================= */

// In-memory, per-IP. Resets when the dyno restarts, which on Render's free tier
// is often — good enough to stop online guessing, not a substitute for a strong
// password.
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

const rateLimit = (ip) => {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.until) {
    attempts.set(ip, { count: 1, until: now + LOCKOUT_MS });
    return { blocked: false };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    return { blocked: true, retryInSec: Math.ceil((rec.until - now) / 1000) };
  }
  return { blocked: false };
};

router.post("/login", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const limit = rateLimit(ip);
  if (limit.blocked) {
    return res
      .status(429)
      .json({ error: `Too many attempts. Try again in ${limit.retryInSec}s.` });
  }

  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  attempts.delete(ip);
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  res.json({ token: sign({ sub: "admin", iat: Date.now(), exp }), expiresAt: exp });
});

/* =========================================
   AUTH GATE — everything below requires a token
   ========================================= */

// Exported so routes that live outside this router can sit behind the same gate
// without a second implementation. server.js uses it for the blog write path.
function requireAdmin(req, res, next) {
  if (!CONFIGURED) {
    return res.status(503).json({ error: "Admin API is not configured on this server." });
  }
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token && verify(token);
  if (!payload) return res.status(401).json({ error: "Not signed in." });
  req.admin = payload;
  next();
}

router.use(requireAdmin);

router.get("/me", (req, res) => {
  res.json({ user: req.admin.sub, expiresAt: req.admin.exp });
});

/* =========================================
   PAGES
   ========================================= */

// Only these may be written through the API. `url` is deliberately absent: it is
// the join key to the router, the sitemap and the prerenderer, so changing it is
// a routing change and not a content edit. `id`, `created_at`, `source_file` and
// `extracted_at` are provenance and must not be client-settable.
const EDITABLE = new Set([
  "meta_title", "meta_description", "meta_keywords", "canonical",
  "author", "robots", "og_title", "og_description", "og_image",
  "content", "content_format",
  "kind", "country", "state", "city", "service",
  "status",
]);

const MAX_PAGE_SIZE = 100;

// Postgres raises 23514 for a CHECK violation. The only CHECKs on this table are
// the publish-identity rules, so translate that into something an editor can act
// on rather than surfacing the raw constraint name.
const friendlyError = (error) => {
  if (error && error.code === "23514") {
    if (String(error.message).includes("identity")) {
      return "Cannot publish: a published page needs its state (and city, for a city page) filled in.";
    }
    return "That change breaks a database rule for this page.";
  }
  if (error && error.code === "23505") return "Another page already uses that URL.";
  return error && error.message ? error.message : "Unknown error";
};

// GET /api/admin/pages?q=&state=&service=&kind=&status=&page=1&pageSize=25
router.get("/pages", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
    const from = (page - 1) * pageSize;

    // Never `select("*")` for a list: `content` is ~8 KB per row and a 100-row
    // page would ship close to a megabyte to draw a table of titles.
    let query = db
      .from("pages")
      .select("id,kind,country,state,city,service,url,slug,meta_title,status,updated_at", {
        count: "exact",
      });

    const { q, state, service, kind, status } = req.query;
    if (state) query = query.eq("state", state);
    if (service) query = query.eq("service", service);
    if (kind) query = query.eq("kind", kind);
    if (status) query = query.eq("status", status);
    if (q) {
      const term = String(q).replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `city.ilike.%${term}%,state.ilike.%${term}%,meta_title.ilike.%${term}%,url.ilike.%${term}%`,
        );
      }
    }

    const { data, error, count } = await query
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    res.json({
      rows: data || [],
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    });
  } catch (error) {
    console.error("GET /api/admin/pages error:", error);
    res.status(500).json({ error: friendlyError(error) });
  }
});

// Distinct values for the filter dropdowns.
router.get("/facets", async (req, res) => {
  try {
    const { data, error } = await db.from("pages").select("state,service,kind").limit(5000);
    if (error) throw error;
    const uniq = (key) => [...new Set((data || []).map((r) => r[key]).filter(Boolean))].sort();
    res.json({ states: uniq("state"), services: uniq("service"), kinds: uniq("kind") });
  } catch (error) {
    console.error("GET /api/admin/facets error:", error);
    res.status(500).json({ error: friendlyError(error) });
  }
});

router.get("/pages/:id", async (req, res) => {
  try {
    const { data, error } = await db
      .from("pages")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Page not found." });
    res.json({ page: data });
  } catch (error) {
    console.error(`GET /api/admin/pages/${req.params.id} error:`, error);
    res.status(500).json({ error: friendlyError(error) });
  }
});

// Snapshot the row as it stands, then apply the patch. Written before the update
// so that if the update fails the history still shows what was there.
const saveRevision = async (page, editedBy, note) => {
  const { error } = await db.from("page_revisions").insert({
    page_id: page.id,
    snapshot: page,
    edited_by: editedBy,
    note: note || null,
  });
  if (error) throw error;
};

router.patch("/pages/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: current, error: readError } = await db
      .from("pages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) return res.status(404).json({ error: "Page not found." });

    const patch = {};
    const rejected = [];
    for (const [key, value] of Object.entries(req.body || {})) {
      if (key === "note") continue;
      if (EDITABLE.has(key)) patch[key] = value;
      else rejected.push(key);
    }
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: "Nothing to update.", ignoredFields: rejected });
    }

    await saveRevision(current, req.admin.sub, req.body.note);

    const { data, error } = await db
      .from("pages")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      const status = error.code === "23514" || error.code === "23505" ? 400 : 500;
      return res.status(status).json({ error: friendlyError(error) });
    }

    res.json({ page: data, ignoredFields: rejected });
  } catch (error) {
    console.error(`PATCH /api/admin/pages/${req.params.id} error:`, error);
    res.status(500).json({ error: friendlyError(error) });
  }
});

const setStatus = (status) => async (req, res) => {
  try {
    const { id } = req.params;
    const { data: current, error: readError } = await db
      .from("pages").select("*").eq("id", id).maybeSingle();
    if (readError) throw readError;
    if (!current) return res.status(404).json({ error: "Page not found." });

    await saveRevision(current, req.admin.sub, `status -> ${status}`);

    const { data, error } = await db
      .from("pages").update({ status }).eq("id", id).select().maybeSingle();

    if (error) {
      const code = error.code === "23514" ? 400 : 500;
      return res.status(code).json({ error: friendlyError(error) });
    }
    res.json({ page: data });
  } catch (error) {
    console.error(`POST /api/admin/pages/${req.params.id} status error:`, error);
    res.status(500).json({ error: friendlyError(error) });
  }
};

router.post("/pages/:id/publish", setStatus("published"));
router.post("/pages/:id/unpublish", setStatus("draft"));

/* =========================================
   DOCUMENT INGESTION
   ========================================= */

// Upload a .docx or .pdf, read it, and hand back a PROPOSAL. This route never
// writes to `pages` — the editor reviews the suggestion and saves through the
// ordinary PATCH endpoint, so a bad parse cannot rewrite a live page.
//
// The file goes to Supabase Storage and is deleted again as soon as it has been
// read. Two reasons: Render's filesystem is ephemeral, so multer's memory storage
// plus object storage is the only durable path; and keeping every source document
// forever would fill the free 1 GB for no benefit once the text is in a row.
const multer = require("multer");
const { extract, kindOf, MIME_BY_KIND, MAX_BYTES } = require("./ingest");

const INGEST_BUCKET = process.env.INGEST_BUCKET || "ingest";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

// One document per request. Batch imports belong in a local script talking to
// this API, not in a 512 MB web dyno that also answers contact forms.
router.post("/ingest", (req, res) => {
  upload.single("document")(req, res, async (uploadErr) => {
    if (uploadErr) {
      const tooBig = uploadErr.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        error: tooBig
          ? `File is too large; the limit is ${Math.round(MAX_BYTES / 1048576)} MB.`
          : uploadErr.message,
      });
    }
    if (!req.file) return res.status(400).json({ error: "No document was uploaded." });

    // Validate BEFORE the storage round-trip. Uploading first meant the bucket's
    // own MIME restriction rejected the file and surfaced its wording ("mime type
    // text/plain is not supported") instead of ours, and it spent two network
    // calls on a file that was never going to be read.
    const kind = kindOf(req.file.mimetype, req.file.originalname);
    if (!kind) return res.status(400).json({ error: "Only .docx and .pdf files can be read." });
    if (!req.file.buffer?.length) return res.status(400).json({ error: "Empty file." });

    const safeName = req.file.originalname.replace(/[^\w.-]+/g, "_").slice(-80);
    const objectPath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    let stored = false;

    try {
      const { error: upErr } = await db.storage
        .from(INGEST_BUCKET)
        .upload(objectPath, req.file.buffer, {
          // The browser's reported mimetype can be blank or wrong (Windows often
          // sends application/octet-stream for .docx); send what we detected so
          // the bucket's allow-list agrees with our own validation.
          contentType: MIME_BY_KIND[kind],
          upsert: false,
        });

      // A missing bucket should say so plainly rather than surfacing as a
      // generic storage failure the editor cannot act on.
      if (upErr && /bucket/i.test(upErr.message || "")) {
        return res.status(503).json({
          error: `Storage bucket "${INGEST_BUCKET}" does not exist. Create it (private) in Supabase, or set INGEST_BUCKET.`,
        });
      }
      if (upErr) throw upErr;
      stored = true;

      const proposal = await extract(req.file.buffer, req.file.mimetype, req.file.originalname);
      res.json({ ...proposal, storedAs: objectPath });
    } catch (error) {
      console.error("POST /api/admin/ingest error:", error);
      res.status(400).json({ error: error.message || "Could not read that document." });
    } finally {
      // Always clean up, including on a parse failure — a document that could
      // not be read is exactly the one there is no reason to keep.
      if (stored) {
        const { error: rmErr } = await db.storage.from(INGEST_BUCKET).remove([objectPath]);
        if (rmErr) console.error(`ingest: failed to delete ${objectPath}: ${rmErr.message}`);
      }
    }
  });
});

/* =========================================
   REVISIONS
   ========================================= */

router.get("/pages/:id/revisions", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { data, error } = await db
      .from("page_revisions")
      .select("id,edited_by,note,created_at")
      .eq("page_id", req.params.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ revisions: data || [] });
  } catch (error) {
    console.error(`GET /api/admin/pages/${req.params.id}/revisions error:`, error);
    res.status(500).json({ error: friendlyError(error) });
  }
});

// Restore a page to an earlier snapshot. The current state is itself snapshotted
// first, so a revert can be reverted.
router.post("/pages/:id/revert", async (req, res) => {
  try {
    const { id } = req.params;
    const { revisionId } = req.body || {};
    if (!revisionId) return res.status(400).json({ error: "revisionId is required." });

    const { data: revision, error: revError } = await db
      .from("page_revisions")
      .select("*")
      .eq("id", revisionId)
      .eq("page_id", id)
      .maybeSingle();
    if (revError) throw revError;
    if (!revision) return res.status(404).json({ error: "Revision not found for this page." });

    const { data: current, error: readError } = await db
      .from("pages").select("*").eq("id", id).maybeSingle();
    if (readError) throw readError;
    if (!current) return res.status(404).json({ error: "Page not found." });

    await saveRevision(current, req.admin.sub, `revert to revision ${revisionId}`);

    const restore = {};
    for (const key of EDITABLE) {
      if (revision.snapshot[key] !== undefined) restore[key] = revision.snapshot[key];
    }

    const { data, error } = await db
      .from("pages").update(restore).eq("id", id).select().maybeSingle();

    if (error) {
      const code = error.code === "23514" ? 400 : 500;
      return res.status(code).json({ error: friendlyError(error) });
    }
    res.json({ page: data, revertedTo: revisionId });
  } catch (error) {
    console.error(`POST /api/admin/pages/${req.params.id}/revert error:`, error);
    res.status(500).json({ error: friendlyError(error) });
  }
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
