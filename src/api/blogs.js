// Blog reads — fetched from our own backend API, which runs the Supabase query
// server-side (see server/server.js, "BLOG ENDPOINTS"). The browser never
// connects to *.supabase.co directly: some networks (corporate firewalls, a few
// ISPs) filter that host at the TLS/SNI layer, which left the blog list silently
// empty with ERR_QUIC_PROTOCOL_ERROR / ERR_CONNECTION_CLOSED. Going through our
// own origin also keeps the ~780 KB Supabase SDK out of the client bundle
// entirely — these are now plain fetch calls, same as api/client.js.
//
// API_BASE contract matches api/client.js: in dev, vite proxies /api ->
// localhost:5000 (vite.config.js); in prod it falls back to the Render backend.
// Set VITE_API_URL to point dev at a deployed backend when the local server
// itself can't reach Supabase (e.g. behind the same network filter).

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://milta-website.onrender.com/api' : '/api');

// Forward only the params the backend understands, and only when they carry a
// value — an undefined/empty value would otherwise serialise as "undefined".
const QUERY_KEYS = ['featured', 'editors_pick', 'limit', 'order', 'ascending', 'table'];

const buildQuery = (params) => {
  const qs = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
};

export const getBlogs = async (params = {}) => {
  try {
    const res = await fetch(`${API_BASE}/blogs${buildQuery(params)}`);
    if (!res.ok) throw new Error(`GET /blogs -> ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('getBlogs error:', error.message || error);
    return [];
  }
};

export const getBlogBySlug = async (slug, table = 'blogs') => {
  try {
    const query = table ? `?table=${encodeURIComponent(table)}` : '';
    const res = await fetch(`${API_BASE}/blogs/${encodeURIComponent(slug)}${query}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /blogs/${slug} -> ${res.status}`);

    const data = await res.json();
    if (!data || !data.blog) return null;

    // Server returns { blog, latestPosts } — latestPosts come from the same
    // table as the post, so a UK post lists UK posts (not US ones).
    return { blog: data.blog, latestPosts: data.latestPosts || [] };
  } catch (error) {
    console.error('getBlogBySlug error:', error.message || error);
    return null;
  }
};
