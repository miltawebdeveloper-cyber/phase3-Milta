// Admin API client.
//
// Every call here needs a bearer token, so this module is imported only by the
// lazily-loaded /admin route — it must never end up in the graph of a public
// page. See src/api/client.js for the same reasoning applied to Supabase.

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://milta-website.onrender.com/api' : '/api');

const TOKEN_KEY = 'milta.admin.token';
const EXPIRY_KEY = 'milta.admin.expires';

export const getToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expires = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    // A token the server would reject is worse than no token: it produces a
    // confusing 401 mid-edit instead of a clean login prompt.
    if (!token || !expires || expires < Date.now()) return null;
    return token;
  } catch {
    return null;
  }
};

const setToken = (token, expiresAt) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(expiresAt));
  } catch {
    /* private browsing — the session simply will not persist a reload */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch { /* ignore */ }
};

export class AuthError extends Error {}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  if (!token) throw new AuthError('Not signed in.');

  const res = await fetch(`${API_BASE}/admin${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try { payload = await res.json(); } catch { /* empty body */ }

  if (res.status === 401) {
    clearToken();
    throw new AuthError(payload?.error || 'Session expired.');
  }
  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload;
}

export async function login(password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || 'Sign in failed.');
  setToken(payload.token, payload.expiresAt);
  return payload;
}

const qs = (params) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v != null) search.set(k, v);
  }
  const s = search.toString();
  return s ? `?${s}` : '';
};

// Reads a document and returns a PROPOSAL. Nothing is saved by this call — the
// editor applies what it wants and saves through savePage like any other edit.
export async function ingestDocument(file) {
  const token = getToken();
  if (!token) throw new AuthError('Not signed in.');

  const form = new FormData();
  form.append('document', file);

  // No Content-Type header: the browser must set the multipart boundary itself.
  const res = await fetch(`${API_BASE}/admin/ingest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  let payload = null;
  try { payload = await res.json(); } catch { /* empty body */ }

  if (res.status === 401) { clearToken(); throw new AuthError(payload?.error || 'Session expired.'); }
  if (!res.ok) throw new Error(payload?.error || `Could not read that document (${res.status}).`);
  return payload;
}

export const listPages = (params) => request(`/pages${qs(params)}`);
export const getFacets = () => request('/facets');
export const getPage = (id) => request(`/pages/${id}`);
export const savePage = (id, patch) => request(`/pages/${id}`, { method: 'PATCH', body: patch });
export const publishPage = (id) => request(`/pages/${id}/publish`, { method: 'POST' });
export const unpublishPage = (id) => request(`/pages/${id}/unpublish`, { method: 'POST' });
export const getRevisions = (id) => request(`/pages/${id}/revisions`);
export const revertPage = (id, revisionId) =>
  request(`/pages/${id}/revert`, { method: 'POST', body: { revisionId } });
