// What a section is CALLED in the admin screen.
//
// The label comes from the section manifest — the same file the render planner
// and the section registry read — so the editor cannot end up offering a section
// the page cannot draw, or calling it something the rest of the system does not
// recognise. Adding a section is one entry there, not an edit here.
//
// Label and key deliberately differ for one section, and it is worth being
// explicit about why. The opening block is stored under the key `hero`, and that
// key cannot move: 227 published rows carry it, the extractor writes it,
// layoutMerge and the verification outline rank by it, and _ServiceLayout reads
// it. Renaming it would be a migration across every row and eight modules.
//
// But nobody at Milta calls it a hero. The source documents editors upload label
// that block "Banner Section:" — layoutService has a rule for exactly that
// string — and the UK page components call the same element a "Banner Title". An
// editor looking for the banner should not have to know it is filed under
// "Hero". So: the key stays, the label changes.
import { SECTIONS, labelForKey } from "../states/_templates/sections/manifest";

// Only the sections whose label is not simply their key humanised. Kept as a
// derived map rather than a hand-written one so it cannot fall out of step with
// the manifest.
export const SECTION_LABELS = Object.fromEntries(
  SECTIONS
    .filter((s) => s.label && s.label !== humanise(s.key))
    .map((s) => [s.key, s.label]),
);

function humanise(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// A key or an outline id ("cardGroups[0]", "cardGroups.2") turned into words.
// The index is preserved, because "Card Groups 2" is the section a reviewer is
// looking at and "Card Groups" is all three of them.
export function sectionLabel(key) {
  const raw = String(key ?? "");
  const [, base, suffix = ""] = /^([A-Za-z]+)(.*)$/.exec(raw) || [, raw, ""];

  const words = labelForKey(base) || humanise(base);

  const index = /[[.](\d+)\]?$/.exec(suffix);
  return index ? `${words} ${Number(index[1]) + 1}` : words;
}

export default sectionLabel;
