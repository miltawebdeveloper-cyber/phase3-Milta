// Client for /api/content.
//
// React talks only to the Express API — never to Supabase — so the backend's
// storage and database can be replaced without touching a component.
import { getToken, clearToken, AuthError } from "../api";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://phase3-milta.onrender.com/api" : "/api");

const qs = (params) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== "" && v != null) search.set(k, v);
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

async function handle(res) {
  let payload = null;
  try { payload = await res.json(); } catch { /* empty body */ }

  if (res.status === 401) {
    clearToken();
    throw new AuthError(payload?.error || "Session expired.");
  }
  // 422 means the document was read but held nothing to apply. That is a result
  // the caller renders, not a failure to throw on.
  if (!res.ok && res.status !== 422) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload;
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  if (!token) throw new AuthError("Not signed in.");

  return handle(await fetch(`${API_BASE}/content${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

export const listStates = (pageType) => request(`/states${qs({ pageType })}`);
export const listCities = (state, q) => request(`/cities${qs({ state, q })}`);
export const listPages = (params) => request(`/pages${qs(params)}`);
export const getPage = (id) => request(`/pages/${id}`);
export const createPage = (body) => request("/pages", { method: "POST", body });
export const publishPage = (id) => request(`/pages/${id}/publish`, { method: "POST" });
export const unpublishPage = (id) => request(`/pages/${id}/unpublish`, { method: "POST" });
export const updatePage = (id, patch) => request(`/pages/${id}`, { method: "PUT", body: patch });
export const deletePage = (id) => request(`/pages/${id}`, { method: "DELETE" });
export const deletePages = (ids) =>
  request("/pages/bulk-delete", { method: "POST", body: { ids } });
export const getHistory = (id) => request(`/pages/${id}/history`);
export const revertPage = (id, revisionId) =>
  request(`/pages/${id}/revert`, { method: "POST", body: { revisionId } });

// Read a document WITHOUT touching the page. This is what the dashboard uses:
// the fields come back, land in the editable form, and the database is written
// only when the editor presses Save.
//
// `service` is optional and changes only what comes BACK: when it names a
// service with a template, the preview is shaped into that service's structure,
// so the admin sees the page they are about to create rather than the document's
// own shape. Nothing is written either way.
//
// `state`/`city` are optional too, but pass them whenever the page already has
// one — they are what lets the preview's breadcrumb read "Tax Services in
// Arizona" instead of a guess cut from the banner title. See DocumentDropzone,
// which has the page's own state/city to hand.
export async function previewDocument(file, service = "", location = {}) {
  const token = getToken();
  if (!token) throw new AuthError("Not signed in.");
  const { state = "", city = "" } = location;

  const form = new FormData();
  form.append("document", file);
  if (service) form.append("service", service);
  if (state) form.append("state", state);
  if (city) form.append("city", city);

  return handle(await fetch(`${API_BASE}/content/documents/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }));
}

// Same as previewDocument, but for a pasted link instead of a chosen file — a
// Google Docs share link (sharing must be "Anyone with the link can view"), or
// a URL that points straight at a file. The server does the fetching; the
// browser never touches the link's target directly. Everything past this call
// is identical to the file path: same response shape, same nothing-written
// guarantee.
export async function previewDocumentFromUrl(url, service = "", location = {}) {
  const { state = "", city = "" } = location;
  return request("/documents/preview", { method: "POST", body: { url, service, state, city } });
}

// Straight-to-database variant, kept for scripted/bulk use. The dashboard does
// not call this — it previews first so a human sees the content before it lands.
// Returns { updated: true, ... }, or { updated: false, reason: "empty" } when the
// document held nothing usable at all.
export async function uploadDocument(pageId, file) {
  const token = getToken();
  if (!token) throw new AuthError("Not signed in.");

  const form = new FormData();
  form.append("document", file);

  // No Content-Type header — the browser must set the multipart boundary.
  return handle(await fetch(
    `${API_BASE}/content/pages/${pageId}/upload`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form },
  ));
}

/* ── State Data ───────────────────────────────────────────────────────────── */
//
// Kept apart from the page calls on purpose: State Data is the editorial record
// for a state, a page is one service inside it, and the two panels are meant to
// be usable independently.

export const listStateData = () => request("/state-data");
export const getStateData = (slug) => request(`/state-data/${encodeURIComponent(slug)}`);
export const saveStateData = (slug, body) =>
  request(`/state-data/${encodeURIComponent(slug)}`, { method: "PUT", body });

// What a whole-state removal would delete — read to fill the warning dialog.
export const getStateSummary = (slug, country = "us") =>
  request(`/states/${encodeURIComponent(slug)}/summary${qs({ country })}`);

// Remove a state from the CMS entirely. `includeCities` also wipes its city pages.
export const deleteState = (slug, { country = "us", includeCities = false } = {}) =>
  request(
    `/states/${encodeURIComponent(slug)}${qs({ country, includeCities })}`,
    { method: "DELETE" },
  );

/* ── Content verification ─────────────────────────────────────────────────── */

export const listVerification = (params) => request(`/verify${qs(params)}`);
export const getVerification = (id) => request(`/verify/${id}`);
export const completeVerification = (id, body) =>
  request(`/verify/${id}/complete`, { method: "POST", body: body || {} });
export const reopenVerification = (id) =>
  request(`/verify/${id}/reopen`, { method: "POST", body: {} });

/* ── Section library ──────────────────────────────────────────────────────── */
//
// The designs already used across the site, offered for reuse. Structure only —
// see sectionLibrary.js for why the text is stripped.

export const listSectionLibrary = (params) => request(`/section-library${qs(params)}`);

// The eight per-service templates. Used to tell an admin which structure a page
// will be given BEFORE it is created, rather than after.
export const listServiceTemplates = () => request("/service-templates");
