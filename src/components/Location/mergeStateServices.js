// Build the areas-we-serve listing from published CMS pages.
//
// StatesServicesSection calls this with an EMPTY base object, so the result is
// exactly the published `service_state` rows the CMS has right now — nothing
// carried over from anywhere else. A page created in the CMS appears the next
// time this runs; a page removed or unpublished is simply absent from `rows`
// and so absent here too. There used to be a hand-written fallback file
// (statesData.js) this merged into; it no longer feeds this listing.
//
// The function itself stays generic — additive over whatever base it is
// given, deduping by URL — so a non-empty base still works exactly as before,
// it is just no longer what this listing uses.

// statesData keys have no spaces ("NewYork"); the database stores "New York".
const keyOf = (state) => String(state || "").replace(/\s+/g, "");

// Trailing slashes are inconsistent in the existing URLs — 15 Digital Marketing
// canonicals have none — so compare without one or the same page is added twice.
const sameUrl = (a) => String(a || "").replace(/\/+$/, "").toLowerCase();

const prettify = (s) => String(s || "").replace(/([A-Z])/g, " $1").trim();

// Matches the naming already used in the file ("Payroll Services in Florida"),
// so an added link does not read differently from the ones beside it.
const labelFor = (row) => {
  const state = prettify(keyOf(row.state));
  const service = String(row.service || "").trim();
  if (!service) return row.meta_title || state;
  return /services?$/i.test(service)
    ? `${service} in ${state}`
    : `${service} Services in ${state}`;
};

export function mergeStateServices(base, rows) {
  if (!rows || !rows.length) return base;

  // Shallow-clone down to the arrays being appended to; the caller's object is
  // React state and must not be mutated in place.
  const out = {};
  for (const [k, v] of Object.entries(base)) {
    out[k] = { ...v, services: [...(v.services || [])] };
  }

  for (const row of rows) {
    if (!row || !row.url || !row.state) continue;
    const key = keyOf(row.state);
    if (!key) continue;

    if (!out[key]) {
      // The first row seen for this state — give it a generic description
      // until/unless the CMS's own State Data record supplies a real one.
      out[key] = {
        description: `Milta supports businesses in ${prettify(key)} with bookkeeping, payroll, tax and CPA services.`,
        services: [],
      };
    }

    const already = out[key].services.some((s) => sameUrl(s.url) === sameUrl(row.url));
    if (already) continue;

    out[key].services.push({ name: labelFor(row), url: row.url });
  }

  return out;
}

export { keyOf, labelFor };
