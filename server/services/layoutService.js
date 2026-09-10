// Turn a document's markup into the ServiceLayout content contract.
//
// Uploads used to store `content` as one string — plain text or a blob of HTML —
// and CmsServicePage wrapped that in a single prose section. It rendered, but the
// page had no hero, no sections, and nothing the content editor could edit field
// by field: one giant textarea instead of the structured form every extracted
// page gets.
//
// This produces the same shape the 224 extracted state pages carry, so a page
// built from a document and a page lifted out of JSX are indistinguishable
// downstream — same template, same editor, same `servicelayout/v1` format.
//
// The contract, as ServiceLayout dispatches it (see _ServiceLayout.jsx):
//
//   hero          { titleLead, highlight, subtitle, breadcrumb }
//   intro         the opening block, which Intro has a dedicated renderer for
//   cardGroups[]  ordered, heterogeneous; the SHAPE picks the renderer —
//                   `rows`       -> ComparisonTable
//                   `paragraphs` -> Prose
//                   string items -> Checklist
//   faqs[]        { q, a }
//   faqsHeading   the document's own FAQ title, if it gave one
//
// A document cannot say which of `solutions`, `advantages` or `industries` it
// meant — those are editorial distinctions, not textual ones — so this maps only
// what the markup actually determines and leaves the rest to be added by hand in
// the content editor, which offers every section ServiceLayout renders.
//
// Nothing is truncated. Losing a paragraph because a heuristic capped a list at
// six is worse than an over-long section an editor can trim.

const CONTENT_FORMAT = "servicelayout/v1";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

const decodeEntities = (s) =>
  String(s).replace(/&([a-z]+|#\d+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m);

// Tags that sit INSIDE a sentence. Every other tag separates words, so stripping
// it has to leave a space behind: a nested list reads "<li>Outer<ul><li>Inner",
// and removing those tags outright welds it into "OuterInner" — one word where
// there were two, and the inner item gone as far as a reader or a crawler is
// concerned.
const INLINE_TAG = /^\/?(strong|em|b|i|span|a|code|sup|sub|u|small|mark|abbr)\b/i;

const tidy = (s) =>
  decodeEntities(String(s || ""))
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/<([^>]+)>/g, (_, inner) => (INLINE_TAG.test(inner) ? "" : " "))
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

/* ── Markup -> ordered blocks ─────────────────────────────────────────────── */

// Headings, paragraphs, list items, tables — plus blockquote and pre, which
// carry real copy (a pull quote, a code or address block) and were being dropped
// on the floor because they were not in this list.
const BLOCK_RE = /<(h[1-6]|p|li|table|blockquote|pre)\b[^>]*>([\s\S]*?)<\/\1>/gi;

// Is the whole of this block bold?
//
// `tidy` strips inline tags, so boldness is gone by the time a block has text —
// and boldness is the only thing marking a heading in a document written without
// heading styles, which is how most of these are written. Captured here, before
// it is lost.
const isAllBold = (inner) => {
  if (!/<strong\b/i.test(inner)) return false;
  return tidy(String(inner).replace(/<strong\b[^>]*>[\s\S]*?<\/strong>/gi, "")) === "";
};

// A list item whose FIRST run is bold and is followed, in the SAME <li>, by
// more text with no separator at all — how Word renders a numbered step whose
// title was bolded rather than styled:
//
//   <li><strong>Data Collection</strong> We securely gather invoices…</li>
//
// `asCard` already recognises "Title — description" and "Title: description",
// but there is no separator here — the bold run IS the boundary, and `tidy`
// throws that away before asCard ever sees the text, collapsing the item to
// "Data Collection We securely gather…" with no way to find the title again.
// That is why the Data Entry document's six-step process rendered as a plain
// checklist of run-on sentences instead of the six titled cards the template
// calls for.
//
// Recovered here, while the tags are still there to read, and folded into an
// explicit "lead — rest" so every existing card-detection path downstream
// (asCard, looksLikeCards, toCards) picks it up unchanged.
//
// Narrow like every other inference in this file: the bold run must be short
// and unpunctuated — a title, not a sentence a document happens to bold the
// first few words of — and something has to follow it, or a bullet that is
// simply bold all the way through (already handled by isAllBold) would be
// mistaken for one with a blank description.
const LEAD_BOLD_RE = /^\s*(?:<[a-z][^>]*>\s*)*<strong\b[^>]*>([\s\S]*?)<\/strong>\s*(?:<\/[a-z][^>]*>\s*)*(\S[\s\S]*)$/i;
const leadBoldOf = (inner) => {
  const m = LEAD_BOLD_RE.exec(String(inner || ""));
  if (!m) return null;
  // Some documents already punctuate the boundary themselves, on either side
  // of it — "**Startups:**  Build a solid…" (colon INSIDE the bold) or
  // "**Startups**— Build a solid…" (dash outside it, no space). Either way the
  // caller adds its own "lead — rest" join, so a separator already present on
  // either side has to come off first or it survives alongside the new one —
  // "Startups: — Build…" — and asCard's own title/description split then
  // matches the FIRST separator (the colon), stranding the leftover dash at
  // the front of the description instead of joining it to the title.
  const lead = tidy(m[1]).replace(/[—–:-]\s*$/, "");
  const rest = tidy(m[2]).replace(/^[—–:-]\s*/, "");
  if (!lead || !rest) return null;
  if (lead.length > 60 || lead.split(/\s+/).length > 8 || /[.!?]$/.test(lead)) return null;
  return { lead, rest };
};

function toBlocks(html) {
  const blocks = [];
  // A fresh matcher per call: this function recurses into single-cell tables,
  // and a shared /g regex carries lastIndex between those calls.
  const re = new RegExp(BLOCK_RE.source, "gi");
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    if (tag === "table") {
      // A one-cell table is a layout box, not data. Word wraps a page banner in
      // one to give it a background, and reading that as a table turned the page
      // title and its two sentences into a row of pipe-separated cells.
      // Unwrapping recovers the paragraphs — and their boldness.
      const cells = [];
      const cellRe = /<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi;
      let c;
      while ((c = cellRe.exec(m[2])) !== null) cells.push(c[2]);
      if (cells.length === 1) {
        // `boxed` records that these blocks were inside that layout box, which
        // is the only reason the banner's two sentences belong together as one
        // subtitle. Without it, "the paragraphs after the title" is every
        // paragraph until the next heading — and on a document whose banner is
        // not a table that swallowed the page's whole opening section.
        const inner = toBlocks(cells[0]).map((b) => ({ ...b, boxed: true }));
        if (inner.length) { blocks.push(...inner); continue; }
        // The cell holds bare text with no <p> around it, so recursing finds
        // nothing and the copy would be dropped on the floor. Keep the words.
        const cellText = tidy(cells[0]);
        if (cellText) {
          blocks.push({ tag: "p", text: cellText, level: null, bold: isAllBold(cells[0]) });
        }
        continue;
      }

      const table = parseTable(m[2]);
      if (table) { blocks.push({ tag: "table", table }); continue; }
      // Not parsable as rows and cells. Fall through so the words inside it are
      // still carried across as copy rather than discarded with the markup.
      const fallback = tidy(m[2]);
      if (fallback) blocks.push({ tag: "p", text: fallback, level: null });
      continue;
    }
    // A list item is the one place leadBoldOf is tried — see its own comment.
    // Never on a fully-bold block: that shape is a card with no description at
    // all, which the plain tidy() below already handles correctly.
    const leadBold = tag === "li" && !isAllBold(m[2]) ? leadBoldOf(m[2]) : null;
    const text = leadBold ? `${leadBold.lead} — ${leadBold.rest}` : tidy(m[2]);
    if (!text) continue;
    const isHeading = tag[0] === "h" && tag !== "hr";
    blocks.push({
      tag: tag === "blockquote" || tag === "pre" ? "p" : tag,
      text,
      level: isHeading ? Number(tag[1]) : null,
      bold: !isHeading && isAllBold(m[2]),
    });
  }
  return blocks;
}

// A table inside a <table> body: rows of already-tidied cell text.
function parseTable(inner) {
  const rows = [];
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let r;
  while ((r = rowRe.exec(inner)) !== null) {
    const cells = [];
    const cellRe = /<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let c;
    while ((c = cellRe.exec(r[1])) !== null) cells.push(tidy(c[2]));
    if (cells.length) rows.push(cells);
  }
  return rows.length ? rows : null;
}

// Plain text (PDF, .txt) has no markup, so structure has to be inferred. A short
// line with no terminal punctuation, followed by more text, reads as a heading;
// a line opening with a bullet glyph or "1." reads as a list item.
function blocksFromText(text) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const bullet = /^([-*•·]|\d+[.)])\s+/.exec(line);
    if (bullet) return { tag: "li", text: tidy(line.slice(bullet[0].length)), level: null };
    const looksHeading = line.length <= 80 && !/[.!?;:,]$/.test(line) && /[A-Za-z]/.test(line);
    return looksHeading
      ? { tag: "h2", text: tidy(line), level: 2 }
      : { tag: "p", text: tidy(line), level: null };
  }).filter((b) => b.text);
}

/* ── Sub-headings written as paragraphs ───────────────────────────────────── */

// A short line that titles a list is a heading, whatever tag it arrived in.
//
// Word documents are written by people, and people make a sub-heading by
// bolding a line rather than by applying a heading style. mammoth reports that
// as a plain <p>, so the parser saw body copy. On the Colorado tax document
// every group title was written this way:
//
//   1. Tax Preparation Service in Colorado   <h3>  ← a real heading
//   We handle every aspect of…               <p>
//   Federal Tax Preparation                  <p>   ← a sub-heading, in a <p>
//   • Form 1040 (Individual Returns): …      <li>
//   State Colorado tax preparation           <p>   ← another
//   • Income Tax: …                          <li>
//
// Reading those as paragraphs flattened three labelled groups into one list of
// ten bullets with the titles swept into a footnote. The authored Delaware tax
// page stores them as three separate sections — "Federal Tax Preparation",
// "State NY Tax Preparation", "Local Tax Expertise" — which is what the document
// says and what this restores.
//
// The test is deliberately narrow, because promoting a real sentence would split
// a section in half: short, no sentence-ending punctuation, and immediately
// followed by a list item. A lead-in like "Beyond basic returns, we expertly
// handle niche filings to cover all your needs:" is too long to qualify and
// stays what it is — the section's subtitle.
// A document with no heading styles at all, which is how most are written.
//
// The Arkansas bookkeeping document has 72 blocks and not one heading tag: every
// line is a paragraph, and the headings are marked by being bold. Read literally
// that is one enormous run of prose with no structure to organise, which is
// exactly what it produced.
//
// Bold gives back the headings. Telling a SECTION heading from a CARD title
// needs one more observation — how the document uses them:
//
//   Why Choose Milta for Bookkeeping Services?   bold   ← section
//   With numerous services available…            text
//   Customized Solutions for Small Business      bold   ← card
//   Our services are specifically designed…      text
//   Affordable, Professional Services            bold   ← card
//   At Milta, we offer high-quality…             text
//
// A section heading is followed by its intro and then something else — bullets,
// or the end of the section. A run of bold-then-paragraph PAIRS is a card list.
// So in any run of two or more such pairs, the first is the section and the rest
// are its cards. On this document that yields "Why Choose Milta" with four cards
// and "Comprehensive Bookkeeping and Financial Solutions" with eight, which is
// what the reference Bookkeeping page has.
// `faqStart` — see the identical parameter on promoteSubHeadings below. A bold
// paragraph after the document's own "FAQs" heading ("Personal Information:",
// "Income Information:") is a label INSIDE an answer, not a section heading.
// This function runs FIRST, before promoteSubHeadings, so without this guard
// here too it promotes those lines to headings before promoteSubHeadings ever
// sees them — its own faqStart guard only stops a NEW promotion, so a block
// already turned into a heading by this pass stays one. extractFaqs then finds
// "Personal Information:" already sitting at `.level` and can never fold it
// and its bullets into the answer they belong to; they are published instead
// as their own standalone section, and the answer that should have contained
// them ends wherever this function cut it off.
function inferHeadingsFromBold(blocks, faqStart = -1) {
  // Runs on every document, not only one with no real heading styles at all.
  //
  // It used to skip entirely whenever ANY block anywhere had a real heading
  // level, on the reasoning that a document using real styles reads bold as
  // emphasis rather than structure. But a document can be almost ENTIRELY
  // written in bold paragraphs and still carry one stray real heading —
  // the Arizona Digital Marketing document does, a single accidental <h3>
  // sitting among what is otherwise sixteen bold section/card titles — and
  // that one heading used to disable this function for the whole document.
  // Every bold line was then promoted independently, as a peer of every
  // other, by promoteSubHeadings' cruder bold rule below: "Milta Digital
  // Marketing Services in Arizona" and each of its eight services all came
  // out as separate top-level sections instead of one heading with eight
  // cards under it.
  //
  // Marking is still scoped to PLAIN paragraphs only (`tag === "p"`), so a
  // block the document itself styled as a real heading is never touched or
  // reclassified — only bold paragraphs are candidates, and only a bold
  // paragraph counts toward `pairAt` below (tracked via `inferredBold`,
  // never the raw `level`, so a genuine pre-existing heading that happens to
  // be level 2 can never be mistaken for one of these and swept into a card
  // group with its neighbours).
  // The level a bold-inferred SECTION heading takes — the same level any
  // genuine pre-existing heading in the document already uses, so a bold
  // line and a real heading can be siblings instead of the bold one
  // outranking it. Hard-coding this to 2 was fine when the function ran
  // only on documents with no real headings anywhere, but this one does:
  // once the guard above was removed, a bold line was still forced to
  // level 2 even where the document's own real heading sat at level 3 —
  // making the bold "section" outrank the section it was written inside,
  // and the document's own <h3> read as a sub-heading of it instead of the
  // other way around. Falls back to 2, matching a document with no real
  // headings at all.
  const realLevels = blocks.map((b) => b.level).filter(Boolean);
  const sectionLevel = realLevels.length ? Math.min(...realLevels) : 2;
  const subLevel = Math.min(sectionLevel + 1, 6);

  const out = blocks.map((b) => ({ ...b }));
  out.forEach((b, i) => {
    if (faqStart >= 0 && i > faqStart) return;
    if (b.tag === "p" && b.bold && b.text) { b.tag = `h${sectionLevel}`; b.level = sectionLevel; b.inferredBold = true; }
  });

  const pairAt = (i) => out[i]?.inferredBold && out[i + 1]?.tag === "p" && !out[i + 1].level;

  let i = 0;
  while (i < out.length) {
    if (!pairAt(i)) { i += 1; continue; }

    let end = i;
    let pairs = 0;
    while (pairAt(end)) { pairs += 1; end += 2; }

    // Two or more pairs in a row: the first heading owns the section, the rest
    // are cards inside it.
    if (pairs >= 2) {
      for (let k = i + 2; k < end; k += 2) { out[k].tag = `h${subLevel}`; out[k].level = subLevel; }
    } else {
      // A LONE bold heading+paragraph pair — not part of a repeating group —
      // sitting directly after a heading the document itself styled as a
      // real heading (never one this function inferred) is that heading's
      // own subtitle, written in bold, not a second section immediately
      // following the first with nothing in between. "Why Choose Milta as
      // Your Digital Marketing Service in Arizona" is the one real <h3> in
      // the Arizona Digital Marketing document; "Accelerate Your Revenue
      // Growth and Achieve Online Success" is a single bold line right
      // after it, and the six reasons that follow belong to "Why Choose
      // Milta", not to a second, headless section of their own. Demoted
      // back to a plain paragraph, it becomes that heading's subtitle
      // through the same path a non-bold subtitle already takes.
      const prev = out[i - 1];
      if (prev && prev.level && !prev.inferredBold) {
        out[i].tag = "p";
        out[i].level = null;
        out[i].bold = false; // otherwise promoteSubHeadings' own bold rule re-promotes it right back
        delete out[i].inferredBold;
      }
    }
    i = end;
  }

  return out;
}

const SUBHEADING_MAX = 70;

// `faqStart` is the index of the document's own "FAQs" / "Frequently Asked
// Questions" heading, or -1 if it has none — found in the RAW blocks, before
// this function runs, because it is itself a real heading and unaffected by
// anything this function does.
function promoteSubHeadings(blocks, faqStart = -1) {
  const levels = blocks.map((b) => b.level).filter((l) => l && l > 1);
  const sectionLevel = levels.length ? Math.min(...levels) : 2;
  const subLevel = Math.min(sectionLevel + 1, 6);

  return blocks.map((b, i) => {
    if (b.level || b.tag !== "p") return b;
    const text = String(b.text || "").trim();
    if (!text) return b;

    // Inside the FAQ block, a bold line is a label WITHIN an answer — "Personal
    // Information:" ahead of one bullet list, "Income Information:" ahead of
    // another, both under the SAME question — not a heading for a page section
    // of its own. extractFaqs reads these directly and folds them into the
    // answer they belong to; promoted to a heading here, "Personal
    // Information" published instead as a standalone section with its bullets
    // as items, which is what the Arizona tax document did.
    if (faqStart >= 0 && i > faqStart) return b;

    // The line under a scaffold label IS the heading that label introduces.
    //
    // "CTA:" / "Banner Section:" are dropped as scaffolding, but the author put
    // the real heading on the next line and did not always bold it. Without this
    // that line stayed body copy and the section rendered headless — which is
    // what "Focus on Growth, Leave the Rest to Us!" did once its "CTA:" label
    // was correctly skipped.
    // Only when the label arrived as a PARAGRAPH. A document that styled its
    // label as a real heading ("<h2>Intro</h2>") has already said where the
    // section starts, and the line under it is that section's copy — promoting
    // it would leave the section with a heading and no body.
    const prev = blocks[i - 1];
    if (prev && prev.tag === "p" && !prev.level && isScaffold(prev.text)) {
      return { ...b, tag: `h${sectionLevel}`, level: sectionLevel, inferred: true, text: text.replace(/\s*:$/, "") };
    }

    // A fully bold line is a SECTION heading, even in a document that also uses
    // real heading styles.
    //
    // These documents mix the two freely, and the authored pages prove which is
    // which. On the Delaware tax page:
    //
    //   intro     "Specializing in Business and Individual Tax Preparation…"
    //   solutions "Miltafs Comprehensive Tax Services: Expert Tax Preparation…"
    //
    // Both are section headings on the page and both are bold PARAGRAPHS in the
    // document — while "Stay Compliant with Expert Tax Preparation Services",
    // the section between them, is a real <h3>. Reading only the h3s left the
    // intro with no heading and shifted everything after it.
    //
    // Bold is used at section level here, not below it: "Federal Tax
    // Preparation" and "Local Tax Expertise" are bold lines over lists, and the
    // authored page stores each as its own section rather than as a card.
    // `inferred` records that this heading is a bold PARAGRAPH we promoted, not
    // a line the author styled as a heading. The hero reads it: a document that
    // writes its banner entirely in bold paragraphs puts the button label in one
    // of them, and only a promoted heading may be taken back out of the section
    // flow and used as hero.ctaLabel.
    if (b.bold) {
      // …unless the document's own deeper headings say it is one of THEM.
      //
      // A card list is sometimes written with its first card bolded and the rest
      // styled as headings — the author formatted one item differently and moved
      // on. The Arizona VA document does this with its twelve services:
      //
      //   Our Virtual Assistant Services in Arizona   <h2>  ← the section
      //   At Milta, we offer a wide range…            <p>
      //   Real Estate Virtual Assistant Arizona       bold  ← card one
      //   Our Real Estate Virtual Assistant Services… <p>
      //   Data Entry                                  <h4>  ← card two
      //
      // Promoted to section level, the bold line split the grid in half: the
      // heading kept its lead-in and lost all twelve cards, and card one became
      // the heading of the other eleven. Looking ahead past its own paragraphs,
      // the next heading is DEEPER than section level — so the document is
      // telling us this line is a peer of those, not a peer of the <h2>.
      //
      // Only a deeper heading demotes it. On the Delaware tax document the bold
      // lines are followed by headings at section level, so they stay sections,
      // which is what the authored page has.
      let peer = sectionLevel;
      for (let j = i + 1; j < blocks.length; j += 1) {
        if (blocks[j].tag === "p" && !blocks[j].level && !blocks[j].bold) continue;
        if (blocks[j].level && blocks[j].level > sectionLevel) peer = blocks[j].level;
        break;
      }
      return { ...b, tag: `h${peer}`, level: peer, inferred: true, text: text.replace(/\s*:$/, "") };
    }

    // Not bold: a short line titling a list is still a sub-heading, which is how
    // a document that uses no bold at all marks its groups.
    if (blocks[i + 1]?.tag !== "li") return b;
    if (text.length > SUBHEADING_MAX) return b;
    if (/[.!?]$/.test(text)) return b;

    // Unless the list under it is a list of CARDS, in which case this line is a
    // lead-in and the cards are the content.
    //
    // A true sub-heading over a list names ONE thing and the bullets are facts
    // about it ("Form 1040:" / "applies every eligible deduction"). A lead-in
    // introduces SEVERAL named things, each with its own description — which is
    // exactly what a card list is:
    //
    //   Getting started with Milta's virtual assistant services is simple:
    //   1. Consultation: Contact us to discuss your business requirements.
    //   2. Selection: Choose from our range of services…
    //
    // Promoted, that line became a card title and all four steps collapsed into
    // its bullets — one card where the reference page has four. Left as a
    // paragraph, the steps flow into the section's own card handling.
    const run = [];
    for (let j = i + 1; j < blocks.length && blocks[j].tag === "li"; j += 1) run.push(blocks[j].text);
    if (looksLikeCards(run)) return b;

    // The trailing colon belongs to the lead-in, not to the title it becomes.
    return { ...b, tag: `h${subLevel}`, level: subLevel, text: text.replace(/\s*:$/, "") };
  });
}

/* ── FAQs ─────────────────────────────────────────────────────────────────── */

const Q_RE = /^\s*(?:q\s*[:.\-]|question\s*[:.\-])\s*(.+)$/i;
const A_RE = /^\s*(?:a\s*[:.\-]|answer\s*[:.\-])\s*(.+)$/i;

// "1: Question? Answer" — optionally behind an "FAQ's Section:" label. The
// question mark is required, so an ordinary numbered paragraph ("1. Bank and
// Credit Card Reconciliation") can never match.
const NUMBERED_FAQ_RE = /^\s*(?:faq'?s?\s*section\s*:?\s*)?(\d{1,2})\s*[:.)]\s*([\s\S]*?\?)\s*([\s\S]+)$/i;

// The document's own "FAQs" / "Frequently Asked Questions" heading. Shared
// between toServiceLayout (which needs to know where the FAQ block starts
// BEFORE promoteSubHeadings runs, so a bold sub-label inside an answer is
// never promoted to a section heading) and extractFaqs (which does the actual
// extraction) — one regex, so the two can never disagree about the boundary.
const FAQ_HEADING_RE = /^(faqs?\b|frequently asked)/i;

// Two ways a document writes FAQs: explicit "Q:"/"A:" pairs, or a heading that
// asks a question with the answer in the block beneath it. `consumed` keeps a
// block from being used twice — as an FAQ answer and again as body copy.
function extractFaqs(blocks) {
  const faqs = [];
  const consumed = new Set();
  let faqHeading = "";

  // A heading that announces the FAQ block. It is claimed only if pairs are
  // actually found below — consuming it unconditionally deleted the heading of
  // any document that names an FAQ section this parser could not read.
  const headingIdx = blocks.findIndex((b) => b.level && FAQ_HEADING_RE.test(b.text || ""));
  if (headingIdx >= 0) consumed.add(headingIdx);

  // The level this document writes its SECTION headings at — the shallowest
  // heading below the <h1>. Anything deeper than this is inside a section, which
  // is where a question-and-answer pair lives.
  const levels = blocks.map((b) => b.level).filter((l) => l && l > 1);
  const sectionLevel = levels.length ? Math.min(...levels) : 2;

  for (let i = 0; i < blocks.length; i++) {
    if (consumed.has(i)) continue;
    const b = blocks[i];

    // A numbered question and its answer in ONE paragraph, which is how the
    // Arkansas bookkeeping document writes them:
    //
    //   FAQ's Section: 1: What is bookkeeping, and why do I need it? Bookkeeping
    //   involves recording, organizing and managing your transactions…
    //   2: Can I handle bookkeeping myself? While some owners manage their own…
    //
    // Neither of the other two shapes matches that, so all ten arrived as body
    // paragraphs and the page had no FAQ block at all. The split is at the first
    // question mark; the "FAQ's Section:" label is scaffolding and is dropped.
    const numbered = NUMBERED_FAQ_RE.exec(b.text || "");
    if (numbered) {
      const question = tidy(numbered[2]);
      const answer = tidy(numbered[3]);
      if (question && answer) {
        faqs.push({ q: question, a: answer });
        consumed.add(i);
        continue;
      }
    }

    const q = Q_RE.exec(b.text || "");
    if (q) {
      const next = blocks[i + 1];
      const a = next && A_RE.exec(next.text || "");
      if (a) {
        // The answer is the "A:" line PLUS any list or paragraph blocks beneath
        // it, up to the next question. It is kept as text with "- " bullets and
        // a blank line between paragraphs — exactly the structure the document
        // wrote. FaqAnswer reproduces that rather than reformatting it; a
        // single-line answer still joins to just that one line, unchanged.
        const lines = [tidy(a[1])];
        let j = i + 2;
        while (
          j < blocks.length &&
          !blocks[j].level &&
          !Q_RE.test(blocks[j].text || "") &&
          !NUMBERED_FAQ_RE.test(blocks[j].text || "")
        ) {
          if (blocks[j].tag === "li") {
            while (j < blocks.length && blocks[j].tag === "li") {
              lines.push(`- ${tidy(blocks[j].text)}`);
              consumed.add(j);
              j += 1;
            }
            continue;
          }
          if (blocks[j].tag === "p") {
            const text = tidy(blocks[j].text);
            if (text) lines.push("", text);
            consumed.add(j);
            j += 1;
            continue;
          }
          break;
        }
        faqs.push({ q: tidy(q[1]), a: lines.join("\n") });
        consumed.add(i);
        consumed.add(i + 1);
        continue;
      }
    }
    // A question-shaped heading with a paragraph under it.
    //
    // Not EVERY question-shaped heading, which is what this used to do and what
    // made it dangerous: plenty of section headings are questions. On the
    // Bookkeeping page, "Bookkeeping Service Why Does Every Business Need It?"
    // and "Why Choose Milta for Bookkeeping Services?" are both <h2> section
    // titles with an intro paragraph under them — and both were being swallowed
    // into the FAQ block, which deleted the section's heading and re-published
    // its intro as an answer. The section then landed headless in some other
    // slot.
    //
    // So a question counts as an FAQ only where FAQs actually live:
    //
    //   · below the document's own "FAQs" heading, whatever its level, or
    //   · at a deeper level than the section headings around it — an <h3> among
    //     <h2>s is a question inside a section, not a section of its own —
    //     but ONLY when the document names no "FAQs" heading at all.
    //
    // That second rule used to fire unconditionally, and a document that DOES
    // have a real FAQs heading further down can still write an ordinary,
    // question-phrased sub-heading much earlier — "What are Financial
    // Controller Services?", an <h3> among <h2>s, three sections above the
    // actual FAQ block. Read by level alone it was indistinguishable from a
    // real FAQ pair, and got pulled out of its own section (which the sub-
    // heading-becomes-a-card rule in the body walker was already going to
    // handle correctly) and published as FAQ #1 instead — deleting the
    // section's own heading and card in the process. Once the document HAS
    // named where its FAQs live, that is the only place they are read from.
    const looksLikeFaq = headingIdx >= 0 ? i > headingIdx : b.level > sectionLevel;
    if (b.level && /\?\s*$/.test(b.text || "") && looksLikeFaq) {
      const next = blocks[i + 1];
      if (next && next.tag === "p") {
        // The answer is not always one paragraph. "What documents are
        // required…" continues past its lead sentence into two labelled
        // groups, each introduced by a bold line and followed by its own
        // bullet list:
        //
        //   To ensure accurate and complete…, you'll need to provide…:      p
        //   Personal Information:                                          p (bold)
        //   • Social Security numbers and dates of birth…                  li
        //   • Copies of last year's tax return…                            li
        //   Income Information:                                            p (bold)
        //   • W-2 forms for you and your spouse                            li
        //   …
        //
        // All of it is ONE answer — FAQSection renders `a` with
        // `white-space: pre-line`, so blank lines and "- " bullets in the
        // string reproduce this exactly. Absorption stops at the next
        // question-shaped heading, which is the only kind of `.level` block
        // that can appear here: promoteSubHeadings leaves every bold line
        // inside the FAQ block un-promoted for exactly this reason.
        const lines = [tidy(next.text)];
        let j = i + 2;
        while (j < blocks.length && !blocks[j].level) {
          if (blocks[j].tag === "li") {
            const bulletLines = [];
            while (j < blocks.length && blocks[j].tag === "li") {
              bulletLines.push(`- ${tidy(blocks[j].text)}`);
              consumed.add(j);
              j += 1;
            }
            lines.push(...bulletLines);
            continue;
          }
          if (blocks[j].tag === "p") {
            const text = tidy(blocks[j].text);
            if (text) lines.push("", text);
            consumed.add(j);
            j += 1;
            continue;
          }
          break;
        }
        faqs.push({ q: tidy(cardTitle(b.text)), a: lines.join("\n") });
        consumed.add(i);
        consumed.add(i + 1);
      }
    }

    // A question written as a PLAIN PARAGRAPH under the document's "FAQs"
    // heading, with its answer in the paragraphs and lists that follow — the
    // shape a Google-Docs FAQ section uses:
    //
    //   FAQs About …                       (heading, consumed above)
    //   1. Can you prepare both returns?    p, ends "?"      ← question
    //   Absolutely. We handle …            p                ┐ answer, up to
    //   2. What documents are required?     p, ends "?"      ┘ the next question
    //   To file you will need …            p     ┐
    //   Personal Information:               p     │  one answer, kept whole with
    //   • Social Security numbers …        li     │  "- " bullets and a blank
    //   Income Information:                 p     │  line between paragraphs
    //   • W-2 forms …                      li     ┘
    //
    // Guarded hard: only AFTER a real "FAQs" heading, only a <p> (never a
    // heading) that ends in "?". Body copy is all above the heading, and a
    // section title carries `.level`, so this cannot pull anything out of the
    // page body.
    const isQuestionP = (blk) =>
      blk && blk.tag === "p" && !blk.level && /\?\s*$/.test(blk.text || "");
    if (headingIdx >= 0 && i > headingIdx && isQuestionP(b)) {
      const question = tidy(String(b.text || "").replace(/^\s*\d{1,2}\s*[.)]\s*/, ""));
      const lines = [];
      let j = i + 1;
      while (j < blocks.length && !blocks[j].level && !isQuestionP(blocks[j])) {
        if (blocks[j].tag === "li") {
          while (j < blocks.length && blocks[j].tag === "li") {
            lines.push(`- ${tidy(blocks[j].text)}`);
            consumed.add(j);
            j += 1;
          }
          continue;
        }
        if (blocks[j].tag === "p") {
          const text = tidy(blocks[j].text);
          if (text) {
            if (lines.length) lines.push("");
            lines.push(text);
          }
          consumed.add(j);
          j += 1;
          continue;
        }
        break;
      }
      if (question && lines.length) {
        faqs.push({ q: question, a: lines.join("\n") });
        consumed.add(i);
        continue;
      }
    }

    // A bullet under the document's "FAQs" heading, written as a bold
    // question with the answer running on immediately after it in the SAME
    // list item, no separator at all:
    //
    //   <li><strong>Why should I outsource CPA services?</strong>Outsourcing
    //   helps reduce operational costs, enhances efficiency…</li>
    //
    // toBlocks' own leadBoldOf (used for every OTHER <li> — "Title: description"
    // cards) never rewrites this one: its guard rejects a bold lead that ends
    // in punctuation, and a question always does. So it survives as one run-on
    // string, and the question mark already in it is the only split point —
    // recovered here rather than there, because only here is "under the FAQs
    // heading" known.
    if (headingIdx >= 0 && i > headingIdx && b.tag === "li") {
      const qa = /^\s*([\s\S]*?\?)\s*(\S[\s\S]*)$/.exec(b.text || "");
      if (qa) {
        const question = tidy(qa[1]);
        const answer = tidy(qa[2]);
        if (question && answer) {
          faqs.push({ q: question, a: answer });
          consumed.add(i);
          continue;
        }
      }
    }
  }
  if (headingIdx >= 0) {
    if (faqs.length) {
      faqHeading = blocks[headingIdx].text;
    } else {
      // No pairs, so there is no FAQ section for it to title. Hand it back to
      // the body walker rather than dropping it.
      consumed.delete(headingIdx);
    }
  }

  return { faqs, consumed, faqHeading };
}

/* ── Tables ───────────────────────────────────────────────────────────────── */

const TICKY = /^(|-|—|–|x|n\/a|no|yes|y|true|false|✓|✔|✔️|✗|✘|✅|❌)$/i;
const TICKED = /^(x|yes|y|true|✓|✔|✔️|✅)$/i;

// ServiceLayout's only table renderer draws ticks and dashes, so a table of real
// values (prices, dates) would be flattened into meaningless ticks. Only adopt
// the table renderer when every data cell actually is a tick or a blank.
const isTickTable = (rows) =>
  rows.slice(1).every((r) => r.slice(1).every((c) => TICKY.test(c.trim())));

const tableSection = (rows, titleLead, highlight = "") => {
  const [head, ...body] = rows;
  // A table with a header and no data rows renders as an empty ComparisonTable,
  // which the template drops entirely — so its one row of copy would vanish.
  // Anything that thin goes out as prose instead.
  if (body.length && isTickTable(rows)) {
    return {
      titleLead: titleLead || "",
      highlight,
      headers: head,
      rows: body.map((r) => ({ label: r[0], marks: r.slice(1).map((c) => TICKED.test(c.trim())) })),
    };
  }
  // Not a tick table — keep every value as readable text rather than losing it.
  return {
    titleLead: titleLead || "",
    highlight,
    paragraphs: [head.join(" | "), ...body.map((r) => r.join(" | "))],
  };
};

/* ── Presentation ─────────────────────────────────────────────────────────── */

// A page built from a document rendered through ServiceLayout but did not LOOK
// like a ServiceLayout page, because three presentational fields were never set:
//
//   highlight  the tail of a heading, drawn in the brand colour. Every
//              hand-built page splits its headings this way; an upload put the
//              whole heading in titleLead, so no page had the green accent.
//   bg         alternating section backgrounds. Prose defaults to "default" and
//              Checklist to "paper", so leaving it unset gives an arbitrary
//              order rather than bands.
//   overline   the small caps eyebrow. Deliberately NOT invented here — see
//              below.
//
// These change how existing words are presented; none of them writes new copy.

// Split a heading so its tail carries the accent colour, following the break the
// hand-written pages actually use. Reading a sample of them, the highlight is a
// noun phrase and the split almost always falls after a trailing preposition:
//
//   "Bookkeeping Services for Small Businesses in" + "Delaware, USA"
//   "Expert Payroll Management Services in"        + "Connecticut"
//   "How Milta Empowers"                           + "CPA Firms"
//
// So: break after the last preposition if there is one, otherwise take the last
// word or two. A heading under three words stays whole — splitting "Why Us"
// reads worse than leaving it alone.
const BREAK_WORD = /^(in|for|to|with|of|across|about|on)$/i;

const splitHeading = (text) => {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return { titleLead: words.join(" "), highlight: "" };

  // Last preposition that still leaves something after it to highlight.
  for (let i = words.length - 2; i > 0; i--) {
    if (BREAK_WORD.test(words[i])) {
      return {
        titleLead: words.slice(0, i + 1).join(" "),
        highlight: words.slice(i + 1).join(" "),
      };
    }
  }

  const tail = words.length >= 5 ? 2 : 1;
  return {
    titleLead: words.slice(0, -tail).join(" "),
    highlight: words.slice(-tail).join(" "),
  };
};

// Documents are written with scaffolding in them — "Banner Section:",
// "Content:", "Intro Section:" — which are instructions to the author, not copy
// for the page. One of them became an <h1> reading "Banner Section:", so they
// are recognised and skipped rather than promoted to a heading.
// "cta" and "call to action" are here for the same reason the rest are: the
// documents label the block that way and the label is not copy. Left in, the
// Arizona VA page took a heading reading "CTA" and pushed the line the author
// actually wrote — "Focus on Growth, Leave the Rest to Us!" — down into body
// text. The Tax documents do the same with "Call to Action".
//
// The trailing colon is REQUIRED unless the line is the bare keyword and
// nothing else — a scaffold label reads "Content:", never "Content" with more
// words tacked on and no punctuation at all. Without that requirement this
// matched "Content Marketing Service" (a real heading in the Arizona Digital
// Marketing document, one of eight services written as "Content" + up to 24
// more characters) and silently dropped it, along with the seven other
// services it sat between — the card the heading owned rendered with no title
// at all, which is worse than the one authoring mistake this guards against.
const SCAFFOLD_WORD = "(?:banner|content|intro|body|hero|section|heading|main|page|cta|call to action)";
const SCAFFOLD = new RegExp(
  // "Banner:" / "Banner Section:"  ·  "Banner Section" (word + "section" as a
  // bare two-word phrase is never a real page heading, so the colon is
  // optional there)  ·  bare "Banner" / "Section"
  `^${SCAFFOLD_WORD}(?:\\s+section)?\\s*:\\s*$`
  + `|^${SCAFFOLD_WORD}\\s+section\\s*$`
  + `|^${SCAFFOLD_WORD}\\s*$`
  // Two DIFFERENT scaffold words together, colon required — "Hero Banner:".
  // Without the colon this would risk matching a real short heading that
  // happens to start with a scaffold-ish word ("Content Marketing Service" is
  // the exact case the trailing-colon rule above already exists to avoid), so
  // unlike the "X Section" case this combination is only ever scaffolding when
  // the author punctuated it as a label.
  + `|^${SCAFFOLD_WORD}\\s+${SCAFFOLD_WORD}\\s*:\\s*$`,
  "i",
);
const isScaffold = (text) => {
  const t = String(text || "").trim();
  if (!t || t.length > 40) return false;
  return SCAFFOLD.test(t) || /^[\w\s]{0,30}section\s*:\s*$/i.test(t);
};

// A CTA sentence in the hero block: short, action-phrased, often starts with an
// imperative or contains "contact", "get started", "schedule" etc.
//
// The distinction matters because:
//   subtitle  = the page's descriptive blurb ("With 15 years of experience…")
//   ctaLabel  = the button label on the hero banner ("Contact Us Today")
//
// A document can write them in the same banner box, but they are presented
// differently: the subtitle is large display text and the ctaLabel is a button.
// Recognising the CTA here means the upload sets both fields automatically
// rather than leaving ctaLabel empty until the editor fills it in by hand.
const CTA_RE = /\b(contact|get started|schedule|book|call us|reach out|speak|consult|sign up|request|start|today|now|free consultation|free quote|free demo|free trial|learn more|find out|discover|click here|call now|talk to us|let.{0,10}help|arrange)\b/i;
const isCta = (text) => {
  const t = String(text || "").trim();
  // A CTA is SHORT (button label) and action-phrased. A long sentence that
  // mentions "contact" in passing (e.g. "We contact clients weekly") is not a
  // CTA — it is body copy that happens to contain the word.
  if (t.length > 160 || t.split(/\s+/).length > 22) return false;
  return CTA_RE.test(t);
};

// A section's closing button, written as one paragraph with the editorial
// label INSIDE it: "CTA: Contact Us Today for a Free Consultation!" — one
// block, not two. `isScaffold` only recognises the label on a line by itself
// ("CTA:" / "Call to Action:" and nothing else), so a line shaped like this
// passed straight through as body copy, with the label sitting in the middle
// of the section's closing sentence and the button drawing its generic
// fallback instead.
//
// The Arizona tax document writes its closing section exactly this way:
//
//   Ready to Simplify Your Taxes?                                     h
//   If you're looking for tax services near me, our tax preparation…  p (subtitle)
//   CTA: Contact Us Today for a Free Consultation!                    p ← this
//
// and the reference Delaware page stores that third line as `closing.ctaLabel`
// — the field Prose already draws a button from — with nothing about "CTA:" in
// the copy. Stripped and confirmed CTA-shaped, the remainder is what goes
// there; the whole line is left as ordinary body text otherwise, so a
// paragraph that only happens to start with those words unprefixed by a colon
// ("Call to action is the heart of good copy…") is never mistaken for one.
const CTA_PREFIX_RE = /^(cta|call to action)\s*:\s*/i;
const ctaFromPrefixedLine = (text) => {
  const t = String(text || "").trim();
  const m = CTA_PREFIX_RE.exec(t);
  if (!m) return null;
  const rest = t.slice(m[0].length).trim();
  return rest && isCta(rest) ? rest : null;
};

// A dropped scaffold heading sometimes has the section's REAL heading fused
// onto the same paragraph as the sentence that follows it — no line break
// between them, because the author never pressed Enter there. The Arizona tax
// document writes its closing section as:
//
//   <h3>Call to Action</h3>                                          scaffold
//   <p>Ready to Simplify Your Taxes? If you're looking for tax…</p>  ← ONE <p>
//   <p>CTA: Contact Us Today for a Free Consultation!</p>
//
// `promoteSubHeadings`' "the line under a scaffold label IS the heading" rule
// only fires when that line is its OWN block; here it isn't one. Read
// literally, the closing section came out with no heading at all and "Ready to
// Simplify Your Taxes?" sitting as the opening clause of its body paragraph.
//
// Narrow on purpose — tried only immediately after a scaffold heading was
// dropped, and only on the FIRST paragraph of the section (see its one call
// site): a leading clause has to be short (a heading, not a sentence) and end
// in "?" or "!", which is how a closing section is normally phrased ("Ready to
// Simplify Your Taxes?", "Need Help Getting Started?"). A genuine rhetorical
// question inside body copy never sits in that position, so it is never
// mistaken for one.
const FUSED_HEADING_RE = /^([^.?!]{3,60}[?!])\s+(\S[\s\S]*)$/;
const splitFusedHeading = (text) => {
  const m = FUSED_HEADING_RE.exec(String(text || "").trim());
  return m ? { heading: m[1].trim(), rest: m[2].trim() } : null;
};

/* ── Cards ────────────────────────────────────────────────────────────────── */

// CardGroup is the design this site actually uses — 552 of the hand-built
// sections are cards, against 110 checklists. An upload could never produce one,
// because CardGroup wants `items: [{ icon, title, desc }]` and a document's
// bullets arrive as plain strings. So every imported page came out as flat
// checklists and prose: correct content, wrong design.
//
// Two document habits map onto a card, and both are recognised here:
//
//   "Expert Oversight — we handle month-end close"   a bullet with a lead-in
//   <h3>Expert Oversight</h3><p>we handle…</p>       a sub-heading and its text

// The separator has to be surrounded by space, or "month-end close" splits on
// its own hyphen. An em or en dash counts on its own.
const CARD_BULLET = /^(.{2,70}?)(?:\s+[—–]\s*|\s*[—–]\s+|\s+-\s+|:\s+)(.{8,})$/;

const asCard = (text) => {
  const m = CARD_BULLET.exec(String(text || "").trim());
  if (!m) return null;
  const title = m[1].trim().replace(/[:\-—–]\s*$/, "");
  const desc = m[2].trim();
  // A "title" that is really a sentence is not a card title.
  if (!title || title.split(/\s+/).length > 8 || /[.!?]$/.test(title)) return null;
  return { title, desc };
};

// Documents number their card titles — "1. Cost Savings", "2. Expert Team" —
// because in Word the list is the only thing giving them order. The card design
// already draws the position in its badge, so keeping the numeral in the text
// prints it twice: "1  1. Cost Savings". The authored pages store the bare name,
// which is what this returns.
//
// Only a leading ordinal goes. "1099-MISC forms" and "24-Hour IRS
// Acknowledgement" have no separator after the digits and are left alone.
const cardTitle = (text) => String(text || "").replace(/^\s*\d{1,2}[.)]\s+/, "").trim();

// Bullets are cards only if MOST of them are shaped like one. A single stray
// dash in an otherwise plain list should not turn the whole section into cards.
const looksLikeCards = (bullets) => {
  if (bullets.length < 2) return false;
  const cards = bullets.filter((b) => asCard(b)).length;
  return cards >= Math.ceil(bullets.length * 0.6);
};

// Pick an icon by matching the card's title against the 72 the registry knows.
// A miss returns "" and CardGroup falls back to its numbered badge, which is
// already the built-in behaviour — so a bad guess is never worse than no guess.
const ICON_NAMES = (() => {
  try {
    // eslint-disable-next-line global-require
    return require("../../db/icon-names.json");
  } catch {
    return [];
  }
})();

const ICON_WORDS = ICON_NAMES.map((name) => ({
  name,
  words: name.replace(/Icon$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/\s+/),
}));

const STOP_TITLE = new Set(["the", "and", "for", "with", "your", "our", "a", "an", "of", "to", "in"]);

// Matching a card title against icon NAMES alone fails on every word that
// matters here: no icon is called "payroll", "tax" or "compliance". This maps
// the vocabulary these pages actually use onto icons the registry has. Every
// value below is checked against icon-names.json at load, so a rename in the
// registry cannot leave a dangling reference behind.
const ICON_BY_TOPIC = [
  [/payroll|wages|salar/, "PaymentsIcon"],
  [/tax|filing|return/, "ReceiptLongIcon"],
  [/bookkeep|ledger|reconcil|account(ing|s)?\b/, "AccountBalanceIcon"],
  [/complian|regulat|legal|audit/, "GavelIcon"],
  [/report|analytic|insight|dashboard|metric/, "BarChartIcon"],
  [/growth|scal|improv|increas|optimi/, "TrendingUpIcon"],
  [/secur|protect|safe|confidential/, "SecurityIcon"],
  [/support|help|assist|service/, "SupportAgentIcon"],
  [/team|staff|people|expert|special/, "GroupsIcon"],
  [/time|deadline|fast|quick|speed|hour/, "TimerIcon"],
  [/cloud|software|integrat|sync|automat/, "CloudSyncIcon"],
  [/accura|precis|quality|verif|check|error/, "VerifiedIcon"],
  [/cost|price|saving|budget|afford/, "SavingsIcon"],
  [/invoice|billing|receivab|payab/, "RequestQuoteIcon"],
  [/document|record|paperwork|file/, "DescriptionIcon"],
  [/business|company|corporate|enterprise/, "BusinessIcon"],
  [/plan|strateg|advis|consult/, "AssignmentIcon"],
  [/data|entry|storage|database/, "StorageIcon"],
  [/market|seo|campaign|advertis/, "AdsClickIcon"],
  [/partner|relationship|trust/, "HandshakeIcon"],
  [/local|state|city|region/, "LocationCityIcon"],
  [/review|oversight|monitor|track/, "FactCheckIcon"],
].filter(([, name]) => ICON_NAMES.includes(name));

const iconFor = (title) => {
  const text = String(title || "").toLowerCase();
  const topic = ICON_BY_TOPIC.find(([re]) => re.test(text));
  if (topic) return topic[1];

  // Fall back to matching the words of the icon's own name.
  const words = text.split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP_TITLE.has(w));
  for (const w of words) {
    const hit = ICON_WORDS.find((i) => i.words.some((iw) => iw === w || (iw.length > 4 && w.startsWith(iw))));
    if (hit) return hit.name;
  }
  return "";
};

const toCards = (bullets) =>
  bullets.map((b) => {
    const card = asCard(b) || { title: b, desc: "" };
    return { icon: iconFor(card.title), title: cardTitle(card.title), desc: card.desc };
  });

/* ── Assembly ─────────────────────────────────────────────────────────────── */

// Emit the sections gathered under one heading, in the order they appeared.
// Paragraphs and bullets under the same heading become two entries rather than
// one, because Prose and Checklist are different renderers — merging them would
// silently drop one or the other.
function flush(heading, paragraphs, bullets, tables, out, cards = [], ctaLabel = "") {
  const split = splitHeading(heading || "");
  const { titleLead, highlight } = split;

  // One heading in the document is ONE section on the page.
  //
  // A heading, a sentence introducing it, its points, and a sentence closing it
  // are how these pages are written — and how the authored ones are stored:
  //
  //   whyEssential { titleLead, highlight, subtitle, items }
  //   solutions    { titleLead, highlight, subtitle, items, footnote }
  //
  // Emitting the paragraphs as one block and the points as another broke that in
  // two ways at once. The heading went to the prose block, so the points landed
  // headless; and because the two blocks are then matched to template slots
  // independently, they were assigned to DIFFERENT sections — the heading under
  // one design and the author's list under another.
  //
  // So paragraphs and points around a single heading are combined: the first
  // paragraph becomes the section's subtitle, a trailing one its footnote, and
  // the points its items. That is the shape the renderers already draw.
  //
  // A run of PARAGRAPHS can be card-shaped too — "Affordable and Scalable: We
  // provide cost-effective, scalable solutions…", one sentence per <p>
  // instead of one per <li>. `looksLikeCards`/`toCards` already turn exactly
  // this shape into real cards for bullets; nothing tried it on paragraphs,
  // so a "Why Choose Miltafs" section written this way stayed four run-on
  // sentences of plain prose instead of four titled cards.
  //
  // Split at the FIRST card-shaped paragraph rather than assuming ALL of them
  // are cards: "Your Trusted Partner for Effortless Financial Management and
  // Growth." is a genuine lead-in sentence ahead of the four "Label:
  // description" ones, and stays this section's ordinary subtitle — the same
  // role the first paragraph already plays when the list is bullets instead.
  let effectiveParagraphs = paragraphs;
  let paragraphCards = null;
  // A trailing paragraph after the run that is NOT itself card-shaped is this
  // section's closing sentence, not one more card with the whole sentence as
  // its title — "By choosing Milta as your digital marketing agency in
  // Arizona, you're partnering with a team…" sits after six real "Label:
  // description" paragraphs this way, and toCards()'s own fallback (any
  // paragraph that fails asCard becomes `{ title: <the whole sentence>, desc:
  // "" }`) turned it into a seventh card reading as one giant, description-less
  // title instead of the footnote under the other six.
  let trailingFootnote = "";
  if (!cards.length && !bullets.length) {
    const firstCardAt = paragraphs.findIndex((p) => asCard(p));
    if (firstCardAt >= 0) {
      let tail = paragraphs.slice(firstCardAt);
      if (tail.length >= 2 && looksLikeCards(tail)) {
        let lastCardAt = tail.length - 1;
        while (lastCardAt >= 0 && !asCard(tail[lastCardAt])) lastCardAt -= 1;
        if (lastCardAt >= 0 && lastCardAt < tail.length - 1) {
          trailingFootnote = tail.slice(lastCardAt + 1).join(" ");
          tail = tail.slice(0, lastCardAt + 1);
        }
        paragraphCards = toCards(tail);
        effectiveParagraphs = paragraphs.slice(0, firstCardAt);
      }
    }
  }

  const items = cards.length
    ? cards.map((c) => ({ ...c, icon: iconFor(c.title) }))
    : bullets.length
      ? (looksLikeCards(bullets) ? toCards(bullets) : [...bullets])
      : paragraphCards;

  let used = false;
  const titled = () => {
    if (used) return { titleLead: "", highlight: "" };
    used = true;
    return { titleLead, highlight };
  };

  for (const rows of tables) {
    const t = titled();
    out.push(tableSection(rows, t.titleLead, t.highlight));
  }

  if (items) {
    const section = { ...titled(), items };
    // One paragraph introduces the list; anything after it closes the section.
    //
    // Deliberately NOT stored as `paragraphs` alongside `items`. Every dispatcher
    // in the codebase — _ServiceLayout's own, the render planner, layoutMerge,
    // the verification outline, the save preview — asks "does it have
    // paragraphs?" before "does it have items?", so a node carrying both is read
    // as prose everywhere and its list is silently dropped. `subtitle` and
    // `footnote` are what the authored sections use for exactly this copy, and
    // both render above and below the list.
    if (effectiveParagraphs.length) section.subtitle = effectiveParagraphs[0];
    const leadFootnote = effectiveParagraphs.length > 1 ? effectiveParagraphs.slice(1).join(" ") : "";
    const footnote = [leadFootnote, trailingFootnote].filter(Boolean).join(" ");
    if (footnote) section.footnote = footnote;
    if (ctaLabel) section.ctaLabel = ctaLabel;
    out.push(section);
  } else if (effectiveParagraphs.length) {
    const section = { ...titled(), paragraphs: [...effectiveParagraphs] };
    if (ctaLabel) section.ctaLabel = ctaLabel;
    out.push(section);
  }

  // Cards and plain bullets under the same heading are rare but real — the cards
  // took `items` above, so the bullets still need somewhere to go.
  if (cards.length && bullets.length) {
    const section = {
      ...titled(),
      items: looksLikeCards(bullets) ? toCards(bullets) : [...bullets],
    };
    if (ctaLabel) section.ctaLabel = ctaLabel;
    out.push(section);
  }

  // A heading with nothing under it is still copy — often a section title whose
  // body is an image, or a run of headings before the text starts. Emitting it
  // as a bare Prose heading keeps the words on the page; dropping it was silent
  // deletion of something the author typed. A heading followed by ONLY a CTA
  // line is the same shape — the section still needs its heading emitted, with
  // the button attached rather than lost.
  //
  // `!items` matters here too, not just the raw `bullets`/`cards` parameters:
  // "Why Partner with Milta?" is followed by three colon-separated paragraphs
  // with no lead-in sentence before them, so `paragraphCards` (further above)
  // already turned them into `items` and left `effectiveParagraphs` empty —
  // both the raw-parameter checks below are true regardless, and without this
  // one the section was emitted TWICE: once correctly, with its three cards,
  // and again immediately after as a second, blank-headed duplicate.
  if (titleLead && !items && !effectiveParagraphs.length && !bullets.length && !tables.length && !cards.length) {
    const section = { titleLead, highlight, paragraphs: [] };
    if (ctaLabel) section.ctaLabel = ctaLabel;
    out.push(section);
  }
}

/**
 * Build a ServiceLayout content object from a document.
 *
 * @param {object} parsed  { html, text } from documentService's readers
 * @returns {{ content: object, stats: object }}
 */
function toServiceLayout({ html, text }) {
  const parsed = html ? toBlocks(html) : blocksFromText(text || "");
  // Computed on the RAW blocks, before either bold-promotion pass runs, so a
  // document's own real "FAQs" heading protects everything after it from
  // being turned into a new section heading by EITHER pass — a bold line
  // inside an answer ("Personal Information:") is a label, not a heading, and
  // only stays readable as one if it is never promoted to begin with. A bold
  // paragraph is never itself a real heading (`tag !== "p"` for those), so
  // this index is identical whether read before or after bold-promotion.
  const faqStart = parsed.findIndex((b) => b.level && FAQ_HEADING_RE.test(b.text || ""));
  const rawBlocks = inferHeadingsFromBold(parsed, faqStart);
  const blocks = promoteSubHeadings(rawBlocks, faqStart);
  const { faqs, consumed, faqHeading } = extractFaqs(blocks);
  const live = blocks.filter((_, i) => !consumed.has(i));

  const content = {};
  const cardGroups = [];

  // The first heading is the page's H1. Without one, fall back to the first
  // paragraph so the page still has a title rather than rendering headless.
  // Skip scaffolding: a document written with "Banner Section:" above its real
  // title made that label the page's <h1>. The first heading that is actually a
  // heading wins.
  let firstHeadingIdx = live.findIndex((b) => b.level && !isScaffold(b.text));

  // A banner written as a layout box (a Word table used only for background
  // shading) marks its title by the box itself, not necessarily by also
  // bolding or heading-styling the words inside it — the Arizona Digital
  // Marketing document's box holds three plain paragraphs (title, subtitle,
  // button) and only the button happens to be bold. Read by `.level` alone,
  // that bold button — not the title above it — became `firstHeadingIdx`, so
  // the hero banner displayed "Request a Proposal Today!" as its headline and
  // the real title was demoted to the intro's heading instead.
  //
  // If the box's own first paragraph is not what `.level` found — because
  // nothing inside the box has a level, or because a LATER line in the same
  // box does — the box's first paragraph is the true title.
  const firstBoxedIdx = live.findIndex((b) => b.boxed);
  if (firstBoxedIdx !== -1
    && (firstHeadingIdx === -1 || firstHeadingIdx > firstBoxedIdx || !live[firstHeadingIdx].boxed)) {
    firstHeadingIdx = firstBoxedIdx;
  }

  // The same failure as the boxed case above, without a box: a banner can hold
  // its title and subtitle as two ordinary PLAIN paragraphs — no bold, no
  // heading style at all — with only the button beneath them bolded. Read by
  // `.level` alone, that has no title to find until the button, so the button
  // becomes `firstHeadingIdx` and the real title and subtitle are demoted into
  // the intro section instead. The Arizona Data Entry document is written
  // exactly this way:
  //
  //   Banner Section:                                           bold  ← scaffold
  //   Precision-Driven Data Management Services in Arizona, USA plain ← the title
  //   Our specialized solutions are designed to…                plain ← subtitle
  //   Book a free 30-minute Zoom consultation today.             bold  ← the button
  //
  // Narrow on purpose: only when the block `.level` found IS CTA-shaped (so a
  // document that already gets its title right from a real heading or a bold
  // line is untouched), and only the FIRST plain paragraph before it is taken
  // — never reaching past a heading of any kind, boxed content, or the start
  // of the document.
  if (firstHeadingIdx >= 0 && isCta(live[firstHeadingIdx].text)) {
    const plainTitleIdx = live.findIndex(
      (b, i) => i < firstHeadingIdx && b.tag === "p" && !b.level,
    );
    if (plainTitleIdx !== -1) firstHeadingIdx = plainTitleIdx;
  }

  const heroBlock = firstHeadingIdx >= 0 ? live[firstHeadingIdx] : null;

  // The subtitle is the paragraphs immediately after the heading — all of them,
  // not just the first.
  //
  // A banner is normally written as two sentences on separate lines:
  //
  //   Bookkeeping Services for Small Businesses in Arkansas, USA
  //   With over 15+ years of experience, our bookkeeping company…
  //   Contact us today for trusted bookkeeping services in Arkansas…
  //
  // Taking one left the other stranded as a headingless block, which became the
  // page's `intro` and pushed every real section down a slot: the intro copy
  // landed in `prose`, the prose in a card group, and so on down the page. The
  // authored Delaware page stores both sentences as one subtitle, which is what
  // joining them here produces.
  // Several sentences become one subtitle only when the banner is a layout box
  // holding them. Everywhere else the paragraph after the title is the subtitle
  // and the ones after it are the page's opening copy.
  const heroBoxed = firstHeadingIdx >= 0 && live[firstHeadingIdx].boxed;

  // Collect ALL leading paragraphs that belong to the hero banner:
  //   · when the banner is a layout box (Word table) — take all boxed ones;
  //   · otherwise — take every consecutive paragraph until the next heading or
  //     non-paragraph, not just one. A document whose banner sits above the
  //     first <h2> without a box still writes two or three sentences in a row.
  const subtitleIdxs = [];
  for (let i = Math.max(firstHeadingIdx, -1) + 1; i < live.length; i += 1) {
    if (live[i].tag !== "p" || live[i].level) break;
    subtitleIdxs.push(i);
    // Non-boxed: keep going until the sequence breaks (next heading / list).
    // Boxed: stop at the first non-boxed paragraph inside the box.
    if (heroBoxed && !live[i].boxed) break;
  }
  const subtitleTaken = new Set(subtitleIdxs);

  // Separate the CTA sentence(s) from the descriptive subtitle text.
  //
  // Many documents write the banner like this:
  //
  //   "Bookkeeping Services for Small Businesses in Delaware, USA"   ← <h1>
  //   "With 15+ years of experience, Milta provides…"               ← description
  //   "Contact us today for a free consultation!"                    ← CTA
  //
  // The first is the subtitle; the second should become hero.ctaLabel (the
  // button label), not more subtitle text that the design cannot draw.
  //
  // Priority order:
  //   1. A non-CTA paragraph comes first → it is the subtitle.
  //   2. A CTA paragraph among them → it becomes ctaLabel (first CTA wins).
  //
  // When ALL paragraphs are CTA-shaped (e.g. a one-sentence banner), the only
  // sentence stays as subtitle so the banner has readable text.
  // A banner written entirely in bold paragraphs puts its button label in one of
  // them, and promoteSubHeadings has just turned that line into a heading — so
  // the loop above stopped before reaching it and the CTA never arrived.
  //
  // The Arizona VA document is written exactly that way:
  //
  //   Banner Section:                                        bold  ← scaffold
  //   Boost Your Business Efficiency with Virtual…           bold  ← h1
  //   Looking for top-notch virtual assistant services…      text  ← subtitle
  //   How Our Virtual Assistants Can Transform Your Business bold  ← the BUTTON
  //   Unlock Rewarding Opportunities with Virtual Assistant… bold  ← next section
  //
  // Left alone, the fourth line became a section of its own between the banner
  // and the intro, and the hero button fell back to its generic default.
  //
  // Narrow on purpose, so a real section heading can never be swallowed:
  //   · it must sit immediately after the hero's subtitle paragraphs;
  //   · it must be a heading we INFERRED from bold, never one the author styled;
  //   · it must be CTA-shaped — short and action-phrased;
  //   · and the document must not have given a CTA in the paragraphs already.
  // "Unlock Rewarding Opportunities…" and "Benefits of Virtual Assistant
  // Services…" both fail the CTA test, so the next section is unaffected.
  const afterSubtitle = (subtitleIdxs.length ? subtitleIdxs[subtitleIdxs.length - 1] : firstHeadingIdx) + 1;
  //
  // The heading does not have to be one this file INFERRED from a bold
  // paragraph — the Arizona Financial Controller document writes it as a
  // genuine native <h2>, no different from any other heading in the file:
  //
  //   Strengthen Financial Control with Expert Controller Services in <h2>
  //   Improve financial reporting, budgeting…                          <p>
  //   Schedule Your Free Consultation Today.                          <h2>  ← the button
  //   Elevate Your Financial Strategy…                                 <h2>  ← the next real section
  //
  // `isCta` is what keeps this safe either way: a real section heading never
  // passes it (too long, or none of its words are action-phrased), so a
  // genuine "Book Your Free Consultation" SECTION — as opposed to a banner
  // button — would have to be short and imperative to be mistaken for one,
  // which is not how a section titles itself.
  const ctaHeadingIdx =
    subtitleIdxs.length &&
    live[afterSubtitle]?.level &&
    isCta(live[afterSubtitle].text) &&
    !subtitleIdxs.some((i) => isCta(live[i].text))
      ? afterSubtitle
      : -1;

  const heroParagraphs = subtitleIdxs.map((i) => live[i].text);
  const nonCtaParas = heroParagraphs.filter((t) => !isCta(t));
  const ctaParas = heroParagraphs.filter((t) => isCta(t));
  if (ctaHeadingIdx >= 0) {
    ctaParas.push(live[ctaHeadingIdx].text);
    // It is the button now, so it must not also open a section.
    subtitleTaken.add(ctaHeadingIdx);
  }

  // If there are no non-CTA paragraphs, keep the CTA as the subtitle so the
  // banner still has text rather than going blank.
  const subtitleText = nonCtaParas.length
    ? nonCtaParas.join(" ").trim()
    : heroParagraphs.join(" ").trim();
  const heroCta = nonCtaParas.length && ctaParas.length ? ctaParas[0] : "";

  const heroTitle = heroBlock
    ? heroBlock.text
    : tidy(live.find((b) => b.tag === "p")?.text || "");

  // Which heading level this document uses for its SECTIONS.
  //
  // This was hard-coded as "h3 or deeper is a sub-heading", which is right for a
  // document written h1-title / h2-sections / h3-subheadings and wrong for one
  // written entirely in h3 and h4 — and Word documents are routinely the latter,
  // because an author picks the heading style that looks right rather than the
  // one that is structurally correct. On such a document every section after the
  // first was swallowed as a card of the section above it, which is exactly the
  // structure the page is supposed to follow.
  //
  // So it is read from the document instead: once the title is set aside, the
  // shallowest heading left is the section level, and anything deeper is a
  // sub-heading. That gives h2 for the first kind of document and h3 for the
  // second, without either needing to know about the other.
  //
  // A level used only ONCE, though, is not a section level at all — it is a
  // one-off outlier, not the document's repeating structure. The Arizona
  // Payroll document's banner is a layout box (a Word table), so the hero
  // title comes from `firstBoxedIdx`, not from the genuine <h1> that follows
  // it in the body ("Payroll Management Services in Arizona" — the intro
  // section's own heading, written once). That <h1> is still `live`, still
  // outside the excluded hero index, and shallower than every real <h2>
  // section heading after it — so read by plain minimum it, not h2, becomes
  // the section level, and the entire body (every <h2> AND every <h3>) folds
  // into cards of that single lone heading. Preferring the shallowest level
  // that actually RECURS avoids that: a document's real section level is
  // used many times by definition, so a level seen only once loses to one
  // seen twice or more. The true minimum is kept as the fallback for when
  // nothing recurs (a document with only one section has nothing to compare
  // against anyway, so the plain minimum is as good a guess as any).
  //
  // `subtitleTaken` — not just `firstHeadingIdx` — has to be excluded too:
  // the same document's hero button ("Get Started with a Free Payroll
  // Consultation.") sits in that box as a bold, unstyled line, which
  // inferHeadingsFromBold promotes to a heading at the document's shallowest
  // REAL level (here, 1 — the level the stray body <h1> above genuinely
  // uses). The hero-parsing above already recognises it as the button and
  // claims it into `subtitleTaken`, but left uncounted here it stands in as
  // a second "level 1" heading next to that stray <h1> — just enough for a
  // one-off outlier to look like it recurs, defeating the very check meant
  // to catch it.
  const levelCounts = live.reduce((counts, b, i) => {
    if (!b.level || i === firstHeadingIdx || subtitleTaken.has(i) || isScaffold(b.text)) return counts;
    counts[b.level] = (counts[b.level] || 0) + 1;
    return counts;
  }, {});
  const recurringLevels = Object.keys(levelCounts)
    .map(Number)
    .filter((lvl) => levelCounts[lvl] >= 2);
  const sectionLevel = recurringLevels.length
    ? Math.min(...recurringLevels)
    : live.reduce((min, b, i) => {
        if (!b.level || i === firstHeadingIdx || subtitleTaken.has(i) || isScaffold(b.text)) return min;
        return Math.min(min, b.level);
      }, Infinity);

  // The hero's heading is split like every other one, so the page opens with the
  // same accent-coloured tail the hand-built pages have.
  const heroSplit = splitHeading(heroTitle);
  content.hero = {
    titleLead: heroSplit.titleLead,
    highlight: heroSplit.highlight,
    subtitle: subtitleText,
    breadcrumb: heroTitle.slice(0, 60),
  };
  // Only write ctaLabel when the document explicitly provided one — an empty
  // string would override the hero component's own default button label.
  if (heroCta) content.hero.ctaLabel = heroCta;

  // Walk EVERY block, not just the ones after the heading. Slicing from the
  // heading onwards silently deleted whatever opened the document — a lead
  // paragraph above the title is a normal way to write one, and it was the
  // single largest source of lost copy.
  let heading = "";
  let paragraphs = [];
  let bullets = [];
  let tables = [];
  let cards = [];
  let ctaLabel = "";
  // True for exactly one iteration: the block right after a scaffold heading
  // was dropped. That is the only place splitFusedHeading is tried — see its
  // own comment for why.
  let afterScaffold = false;

  for (let i = 0; i < live.length; i++) {
    const b = live[i];
    // Already used as the hero title / subtitle; using them again would print
    // the same sentence twice on the page.
    if (i === firstHeadingIdx || subtitleTaken.has(i)) continue;

    // A SUB-heading with a paragraph under it is a card inside the current
    // section, not a section of its own. Treating every heading as a new section
    // turned a feature list into a run of one-paragraph blocks.
    //
    // Normally that sub-heading sits one level DEEPER than the section headings
    // around it — but a document sometimes numbers its sub-groups as real
    // headings at the SAME level as everything else:
    //
    //   Our Financial Controller Services in Arizona   <h3>  ← the section
    //   1. Reporting from Management                   <h3>  ← a sub-group
    //   …ten cards…
    //   2. …                                            <h3>  ← another
    //   …three more cards…
    //
    // Read by level alone, "1. Reporting from Management" is indistinguishable
    // from a real section and split off on its own — with nothing under the
    // heading it actually belonged to, which is what happened to this exact
    // Financial Controller document. The number is the tell: a heading that
    // OPENS with an ordinal, right after a section that has taken on no
    // content of its own yet, is a sub-group of that section, not a new one.
    // Once the parent section has real content this never fires again, so a
    // document that numbers its actual top-level sections ("1. Introduction",
    // "2. Services") is unaffected — its first section is never hollow.
    const numberedSubgroup =
      /^\s*\d{1,2}[.)]\s+/.test(b.text || "") &&
      heading && !paragraphs.length && !bullets.length && !cards.length && !tables.length;

    const next = live[i + 1];
    if (b.level && (b.level > sectionLevel || numberedSubgroup) && heading && next && !isScaffold(b.text)) {
      if (next.tag === "p") {
        // The paragraph can introduce a list of its own — "1. Accounting and
        // Bookkeeping Services" followed by a lead sentence AND five bulleted
        // points. Read only as far as `next`, the five points had nowhere
        // scoped to them: they are not this card's own `bullets` (only the
        // sibling next.tag === "li" branch below ever set that), so they fell
        // through as ordinary bullets under the STILL-OPEN parent heading
        // instead — pooling with every other sub-heading's points into one
        // undifferentiated list, orphaned from the six cards that actually
        // owned them.
        const afterP = live[i + 2];
        if (afterP && afterP.tag === "li") {
          const lines = [];
          let j = i + 2;
          while (j < live.length && live[j].tag === "li") { lines.push(live[j].text); j += 1; }
          cards.push({ title: cardTitle(b.text), desc: next.text, bullets: lines });
          i = j - 1;
          continue;
        }
        cards.push({ title: cardTitle(b.text), desc: next.text });
        i += 1;                                 // the paragraph belongs to the card
        continue;
      }
      // A sub-heading followed by a LIST is the same thing written differently —
      // "Form 1040:" with two facts under it. Only the paragraph form was
      // recognised, so each of those became a section of its own and the heading
      // that owned them ("Understanding Key Federal Tax Forms") was left with
      // nothing beneath it. `bullets` is the card field that already exists for
      // exactly this shape.
      if (next.tag === "li") {
        const lines = [];
        let j = i + 1;
        while (j < live.length && live[j].tag === "li") { lines.push(live[j].text); j += 1; }
        cards.push({ title: cardTitle(b.text), bullets: lines });
        i = j - 1;
        continue;
      }
    }

    if (b.level) {
      flush(heading, paragraphs, bullets, tables, cardGroups, cards, ctaLabel);
      const scaffolded = isScaffold(b.text);
      heading = scaffolded ? "" : b.text;
      paragraphs = [];
      bullets = [];
      tables = [];
      cards = [];
      ctaLabel = "";
      afterScaffold = scaffolded;
      continue;
    }
    if (b.tag === "p") {
      // A scaffold label written as an ordinary paragraph — "Hero Banner:"
      // with no bold and no heading style at all. Every OTHER scaffold check
      // in this file requires either a heading tag (the main `if (b.level)`
      // branch below) or bold text (promoteSubHeadings), so a label written
      // this plainly reached neither and survived as a real body paragraph —
      // on the Arizona Financial Controller document, as the very first line
      // of the page, becoming `content.intro`'s opening sentence in place of
      // its real heading and copy.
      //
      // Safe to drop wherever it appears: isScaffold only matches a paragraph
      // whose ENTIRE text is one of these editorial labels, so it can never
      // be mistaken for a real sentence a page actually needed.
      if (isScaffold(b.text)) { afterScaffold = true; continue; }

      // Tried on exactly one block: the first paragraph right after a scaffold
      // heading was dropped. Splitting it recovers the section's own heading
      // when the document fused it onto that paragraph — see splitFusedHeading.
      if (afterScaffold && !heading && !paragraphs.length) {
        const split = splitFusedHeading(b.text);
        if (split) {
          heading = split.heading;
          afterScaffold = false;
          const restCta = ctaFromPrefixedLine(split.rest);
          if (restCta) ctaLabel = restCta;
          else paragraphs.push(split.rest);
          continue;
        }
        // Not fused into one block — heading and body can just as easily be
        // two SEPARATE paragraphs, with nothing to split. The Arizona
        // Financial Controller document writes its CTA banner exactly this
        // way, and the scaffold dropped ahead of it is a real <h2>, not a bold
        // paragraph — the other case `splitFusedHeading` was built for:
        //
        //   <h2>CTA</h2>                                            scaffold
        //   <p>💼 Book Your Free Consultation Today – Limited Time  ← heading
        //      Only!</p>
        //   <p>⏰ Act Fast! Offer expires in 48 hours.</p>           ← body
        //
        // A short, heading-shaped line (no closing period — a real sentence
        // almost always has one) immediately followed by ANOTHER paragraph is
        // this section's own heading; a lone sentence with nothing after it
        // stays body copy, which is what a document that scaffolds a section
        // with no heading of its own looks like ("<h2>Intro</h2><p>We keep
        // your books organized.</p>", with nothing following — see the test
        // for exactly that shape). Requiring a following paragraph is what
        // keeps the two apart.
        if (b.text.length <= SUBHEADING_MAX && !/\.$/.test(b.text.trim()) && next && next.tag === "p") {
          heading = b.text;
          afterScaffold = false;
          continue;
        }
      }
      afterScaffold = false;

      // "CTA: Contact Us Today for a Free Consultation!" — the button, written
      // inline with its own editorial label. Held out of `paragraphs` so it
      // never prints as a sentence in the section's body copy; the first one
      // in a section wins, same as the hero's.
      const inlineCta = ctaFromPrefixedLine(b.text);
      if (inlineCta && !ctaLabel) { ctaLabel = inlineCta; continue; }
      paragraphs.push(b.text);
    }
    else if (b.tag === "li") { bullets.push(b.text); afterScaffold = false; }
    else if (b.tag === "table") { tables.push(b.table); afterScaffold = false; }
  }
  flush(heading, paragraphs, bullets, tables, cardGroups, cards, ctaLabel);

  // The first prose block after the hero is the page's introduction, and
  // ServiceLayout has a dedicated Intro renderer for exactly that — it lands in
  // the same position cardGroups[0] would have, so promoting it changes the
  // markup, not the order.
  if (cardGroups.length && cardGroups[0].paragraphs && !cardGroups[0].rows) {
    const first = cardGroups.shift();
    content.intro = {
      overline: "",
      titleLead: first.titleLead || "",
      highlight: first.highlight || "",
      paragraphs: first.paragraphs,
    };
  }

  // Alternate the section backgrounds. Prose defaults to "default" and Checklist
  // to "paper", so leaving `bg` unset gives whatever order the section types
  // happen to fall in — which reads as arbitrary rather than as bands. Setting it
  // explicitly is what makes a built page look like an authored one.
  cardGroups.forEach((g, i) => { g.bg = i % 2 === 0 ? "default" : "paper"; });

  if (cardGroups.length) content.cardGroups = cardGroups;

  // Record the order the DOCUMENT put its sections in.
  //
  // Without this, order is only implicit — it survives as long as everything
  // lives in `cardGroups`, and is lost the moment a section is added by hand,
  // because a renderer then has nothing to go on but the template's own fixed
  // sequence and a hand-added `whyEssential` sorts ahead of copy the author
  // wrote first.
  //
  // Entries name a key, or an element of an array key ("cardGroups.2"). A
  // consumer that does not understand the field ignores it and falls back to
  // canonical order, so this is additive: no existing row and no existing
  // renderer changes behaviour because it is here.
  content.order = [
    "hero",
    ...(content.intro ? ["intro"] : []),
    ...cardGroups.map((_, i) => `cardGroups.${i}`),
    ...(faqs.length ? ["faqs"] : []),
  ];

  // A document that titles its FAQ block ("Payroll Management FAQs") keeps that
  // heading instead of being flattened to the generic default.
  if (faqs.length) {
    content.faqs = faqs;
    if (faqHeading) content.faqsHeading = { overline: "", titleLead: faqHeading, highlight: "" };
  }

  return {
    content,
    stats: {
      headings: blocks.filter((b) => b.level).length,
      paragraphs: blocks.filter((b) => b.tag === "p").length,
      bullets: blocks.filter((b) => b.tag === "li").length,
      tables: blocks.filter((b) => b.tag === "table").length,
      faqs: faqs.length,
      sections: cardGroups.length,
    },
  };
}

module.exports = {
  toServiceLayout,
  toBlocks,
  blocksFromText,
  extractFaqs,
  tableSection,
  isTickTable,
  toCards,
  CONTENT_FORMAT,
};
