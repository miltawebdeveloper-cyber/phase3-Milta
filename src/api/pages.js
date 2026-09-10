// CMS page reads — fetched from our own backend API (server/server.js, "CMS
// PAGE ENDPOINTS"), which runs the Supabase query server-side. The browser never
// connects to *.supabase.co directly: some networks (corporate firewalls, a few
// ISPs) filter that host at the TLS/SNI layer, which left CMS service pages and
// the areas-we-serve listing empty. RLS still applies server-side — the anon key
// the backend uses is granted published rows only, so an unpublished draft
// cannot leak even if its URL is guessed. These are now plain fetch calls, same
// as api/client.js and api/blogs.js.
//
// API_BASE contract matches api/client.js: dev proxies /api -> localhost:5000
// (vite.config.js); prod falls back to the Render backend. Set VITE_API_URL to
// point dev at a deployed backend when the local one can't reach Supabase.

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://milta-website.onrender.com/api' : '/api');

export const getPageByUrl = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(`${API_BASE}/pages/by-url?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`GET /pages/by-url -> ${res.status}`);
    return (await res.json()) ?? null;
  } catch (error) {
    console.error('getPageByUrl error:', error.message || error);
    return null;
  }
};

// Used by the sitemap / tooling to enumerate published pages.
export const getPageUrls = async ({ kind, limit } = {}) => {
  try {
    const qs = new URLSearchParams();
    if (kind) qs.set('kind', kind);
    if (limit) qs.set('limit', String(limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    const res = await fetch(`${API_BASE}/pages/urls${suffix}`);
    if (!res.ok) throw new Error(`GET /pages/urls -> ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('getPageUrls error:', error.message || error);
    return [];
  }
};

// Every published state service page, for the "areas we serve" listing.
//
// Without this a page created in the CMS was invisible: `statesData.js` is a
// hand-written file, so an uploaded page rendered at its URL but nothing on the
// site linked to it. The backend handles the 1000-row PostgREST paging.
export const getStateServiceLinks = async () => {
  try {
    const res = await fetch(`${API_BASE}/pages/state-service-links`);
    if (!res.ok) throw new Error(`GET /pages/state-service-links -> ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('getStateServiceLinks error:', error.message || error);
    return [];
  }
};

// State descriptions for the areas-we-serve listing. The `states` table is
// optional (arrives with db/002); until then the backend returns {} and the
// listing falls back to the hand-written descriptions. A missing table must
// not blank a live marketing page.
export const getStateDescriptions = async () => {
  try {
    const res = await fetch(`${API_BASE}/states/descriptions`);
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

// The row stores SEO in columns; useFullSEO wants one config object.
export const seoFromRow = (row) => ({
  title: row.meta_title,
  description: row.meta_description,
  keywords: row.meta_keywords,
  canonical: row.canonical,
  author: row.author,
  robots: row.robots,
  ogTitle: row.og_title,
  ogDescription: row.og_description,
  ogImage: row.og_image,
});
