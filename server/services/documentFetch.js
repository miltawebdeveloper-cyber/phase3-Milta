// Fetch a document from a link an admin pastes in, as an alternative to
// uploading a file. The result — { buffer, filename, mimetype } — is shaped
// exactly like a multer file, so it drops straight into documentService.extract
// alongside a real upload; nothing downstream has to know which one it was.
//
// Two link shapes are supported:
//   Google Docs share link   ("docs.google.com/document/d/<id>/...") is
//                             rewritten to Google's own "export as .docx" URL.
//                             This only works while the doc's sharing is set to
//                             "Anyone with the link can view" — anything else
//                             comes back as an HTML sign-in page instead of a
//                             document, which is caught and reported below
//                             rather than parsed as one.
//   Direct file URL           is fetched as written; its name and type come
//                             from the URL and the response's own headers.
//
// This is the one place in the CMS where admin-typed TEXT turns into an
// outbound network request the server makes on its own — guarded accordingly:
// only http(s), a hard timeout, the same size cap as a regular upload enforced
// WHILE streaming (not after the fact), and a refusal to reach anything that
// resolves to localhost or a private address, checked again after redirects.

const dns = require("dns").promises;
const net = require("net");

const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 15000;

class FetchError extends Error {
  constructor(message) {
    super(message);
    this.name = "FetchError";
  }
}

const GOOGLE_DOC_RE = /^https?:\/\/docs\.google\.com\/document\/d\/([\w-]+)/i;

// Every share-link variant Google hands out ("/edit", "/edit?usp=sharing",
// "/view", …) starts with the same "/document/d/<id>" prefix, so one pattern
// picks the id out of all of them and re-points it at the export endpoint.
function resolveUrl(input) {
  const url = String(input || "").trim();
  const m = GOOGLE_DOC_RE.exec(url);
  if (m) {
    return { fetchUrl: `https://docs.google.com/document/d/${m[1]}/export?format=docx`, isGoogleDoc: true };
  }
  return { fetchUrl: url, isGoogleDoc: false };
}

// A private/loopback/link-local address the server should never be talked into
// fetching on an admin's behalf, however the pasted URL got there.
function isPrivateAddress(address) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 127 || a === 10 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (net.isIP(address) === 6) {
    const low = address.toLowerCase();
    return low === "::1" || low.startsWith("fe80:") || low.startsWith("fc") || low.startsWith("fd");
  }
  return false;
}

async function assertPublicHost(hostname) {
  if (hostname === "localhost") throw new FetchError("That link points at a local address, which the server can't reach.");
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new FetchError("Could not resolve that link's address.");
  }
  if (records.some((r) => isPrivateAddress(r.address))) {
    throw new FetchError("That link points at a private address, which the server can't reach.");
  }
}

// Content-Type -> the extension documentService.kindOf already recognises, so
// a response with no usable filename still gets identified correctly.
const EXT_BY_CONTENT_TYPE = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "text/plain": "txt",
  "text/html": "html",
};

function filenameFrom(fetchUrl, contentType, contentDisposition) {
  const fromDisposition = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition || "")?.[1];
  if (fromDisposition) { try { return decodeURIComponent(fromDisposition); } catch { return fromDisposition; } }
  try {
    const last = new URL(fetchUrl).pathname.split("/").filter(Boolean).pop();
    if (last && last.includes(".")) return decodeURIComponent(last);
  } catch { /* fall through to the content-type guess */ }
  const ext = EXT_BY_CONTENT_TYPE[String(contentType || "").split(";")[0].trim()];
  return ext ? `document.${ext}` : "document";
}

async function fetchDocument(input) {
  const { fetchUrl, isGoogleDoc } = resolveUrl(input);

  let parsed;
  try { parsed = new URL(fetchUrl); } catch { throw new FetchError("That doesn't look like a valid link."); }
  if (!/^https?:$/.test(parsed.protocol)) throw new FetchError("Only http:// and https:// links are supported.");

  await assertPublicHost(parsed.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(fetchUrl, { signal: controller.signal, redirect: "follow" });
  } catch (err) {
    if (err.name === "AbortError") throw new FetchError("That link took too long to respond.");
    throw new FetchError("Could not reach that link.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new FetchError(
      isGoogleDoc
        ? 'Could not read that Google Doc — make sure sharing is set to "Anyone with the link can view".'
        : `That link returned an error (${res.status}).`,
    );
  }

  // A redirect can land somewhere the original host-check never saw.
  if (res.url) {
    try { await assertPublicHost(new URL(res.url).hostname); } catch { throw new FetchError("That link redirected somewhere the server can't reach."); }
  }

  const contentType = res.headers.get("content-type") || "";
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_BYTES) {
    throw new FetchError(`That file is too large; the limit is ${Math.round(MAX_BYTES / 1048576)} MB.`);
  }

  // A private Google Doc's export URL still answers 200 — with an HTML
  // sign-in page, not a document. Status alone can't catch that; the content
  // type can.
  if (isGoogleDoc && contentType.startsWith("text/html")) {
    throw new FetchError('Could not read that Google Doc — make sure sharing is set to "Anyone with the link can view".');
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > MAX_BYTES) {
      throw new FetchError(`That file is too large; the limit is ${Math.round(MAX_BYTES / 1048576)} MB.`);
    }
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (!buffer.length) throw new FetchError("That link had nothing to read.");

  return {
    buffer,
    filename: isGoogleDoc ? "document.docx" : filenameFrom(fetchUrl, contentType, res.headers.get("content-disposition")),
    mimetype: contentType.split(";")[0].trim(),
  };
}

module.exports = { fetchDocument, resolveUrl, FetchError, MAX_BYTES };
