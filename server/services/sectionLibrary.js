// Every section design already in use, offered back so a page can reuse one.
//
// A document can say "here is a list of features"; it cannot say whether that
// should be rendered as `solutions`, `advantages` or a card group with an
// "OUR SERVICES" eyebrow. Those are editorial choices, so the converter leaves
// them alone — which left the editor with "Add a section", i.e. build the design
// from an empty object.
//
// But the designs already exist: 155 distinct ones across the site, and the top
// few account for most of it (one card layout appears 397 times). Reusing one is
// both faster and more consistent than rebuilding it field by field.
//
// TEXT IS NOT COPIED BY DEFAULT. Lifting Texas's paragraphs into Colorado would
// put the same copy on two indexed URLs, which is the one thing a site like this
// cannot afford. The default hands over the SHAPE — overline, background, column
// count, icons, and the right number of empty slots — ready to type into.

const { table, run } = require("./databaseService");

const rendererOf = (g) => {
  if (!g || typeof g !== "object") return null;
  if (g.rows) return "table";
  if (g.paragraphs) return "prose";
  if (Array.isArray(g.items)) return typeof g.items[0] === "string" ? "checklist" : "cards";
  return null;
};

// Two sections are "the same design" when they sit under the same key, render
// the same way and carry the same eyebrow. Heading and body text differ per page
// and are not part of the design.
const designKey = (sectionKey, kind, overline) =>
  [sectionKey, kind, String(overline || "").trim().toLowerCase()].join("|");

// Strip the words, keep the structure. What is left is the design: how many
// cards, which icons, which background, how many columns.
function blankOf(node, kind) {
  const out = { ...node };
  out.titleLead = "";
  out.highlight = "";
  if ("subtitle" in out) out.subtitle = "";
  if ("footnote" in out) delete out.footnote;

  if (kind === "prose") out.paragraphs = (node.paragraphs || []).map(() => "");
  else if (kind === "checklist") out.items = (node.items || []).map(() => "");
  else if (kind === "cards") {
    out.items = (node.items || []).map((i) => ({
      icon: i?.icon || "",
      title: "",
      desc: "",
      ...(Array.isArray(i?.bullets) ? { bullets: i.bullets.map(() => "") } : {}),
    }));
  } else if (kind === "table") {
    // Headers name the columns and are part of the design; the rows are data.
    out.headers = node.headers || node.head || [];
    out.rows = (node.rows || []).map((r) => ({
      label: "",
      marks: (r?.marks || []).map(() => false),
    }));
    delete out.head;
  }
  return out;
}

const sizeOf = (node, kind) => {
  if (kind === "prose") return (node.paragraphs || []).length;
  if (kind === "table") return (node.rows || []).length;
  return (node.items || []).length;
};

/**
 * @param {object} opts { q, limit }
 * @returns {{ designs: array, scanned: number }}
 */
async function listDesigns({ q = "", limit = 60 } = {}) {
  const { data } = await run(
    table("pages").select("url,state,service,content").in("kind", ["state", "service_state"]).limit(5000),
  );

  const byDesign = new Map();

  for (const page of data || []) {
    const content = page.content;
    if (!content || typeof content !== "object") continue;

    for (const [sectionKey, value] of Object.entries(content)) {
      if (sectionKey === "hero" || sectionKey === "faqs" || sectionKey === "faqsHeading" || sectionKey === "order") continue;
      const nodes = Array.isArray(value) ? value : [value];

      for (const node of nodes) {
        const kind = rendererOf(node);
        if (!kind) continue;

        const key = designKey(sectionKey, kind, node.overline);
        let entry = byDesign.get(key);
        if (!entry) {
          entry = {
            id: key,
            section: sectionKey,
            kind,
            overline: node.overline || "",
            example: "",
            count: 0,
            sourceUrl: page.url,
            samples: [],
          };
          byDesign.set(key, entry);
        }

        entry.count += 1;
        if (!entry.example) entry.example = [node.titleLead, node.highlight].filter(Boolean).join(" ").trim();
        // A bounded sample is enough to choose a representative one, and keeps
        // this from holding every section on the site in memory.
        if (entry.samples.length < 40) entry.samples.push(node);
      }
    }
  }

  // Pick a REPRESENTATIVE example, not the biggest one. Taking the largest gave
  // a prose design with 53 empty paragraph boxes and a card design with no icons
  // — technically the richest, useless to type into. The median size is what the
  // design usually looks like, and an example that carries icons is preferred
  // because the icons are part of the design.
  const MAX_SLOTS = 12;
  for (const entry of byDesign.values()) {
    const sizes = entry.samples.map((n) => sizeOf(n, entry.kind)).sort((a, b) => a - b);
    const median = sizes[Math.floor(sizes.length / 2)] || 0;
    const target = Math.min(median, MAX_SLOTS);

    const score = (n) => {
      const icons = (n.items || []).filter((i) => i && i.icon).length;
      return icons * 100 - Math.abs(sizeOf(n, entry.kind) - target);
    };
    const best = entry.samples.slice().sort((a, b) => score(b) - score(a))[0];

    entry.size = Math.min(sizeOf(best, entry.kind), MAX_SLOTS);
    entry.blank = blankOf(best, entry.kind);

    // Trim an over-long example down to a workable number of slots.
    const trim = (arr) => (Array.isArray(arr) && arr.length > MAX_SLOTS ? arr.slice(0, MAX_SLOTS) : arr);
    if (entry.blank.items) entry.blank.items = trim(entry.blank.items);
    if (entry.blank.paragraphs) entry.blank.paragraphs = trim(entry.blank.paragraphs);
    if (entry.blank.rows) entry.blank.rows = trim(entry.blank.rows);

    delete entry.samples;
  }

  let designs = [...byDesign.values()].sort((a, b) => b.count - a.count);

  const term = String(q || "").trim().toLowerCase();
  if (term) {
    designs = designs.filter((d) =>
      [d.section, d.kind, d.overline, d.example].join(" ").toLowerCase().includes(term));
  }

  return {
    designs: designs.slice(0, Math.min(Math.max(Number(limit) || 60, 1), 200)),
    scanned: (data || []).length,
    total: byDesign.size,
  };
}

module.exports = { listDesigns, blankOf, rendererOf, designKey };
