// The manifest is now the single definition of what a section is, so these
// tests guard the joins it sits between: the components that draw sections, the
// planner that orders them, and the admin editor that offers them.
//
// The one join not covered here is the server's two ordering lists — they are
// CommonJS and cannot be imported into vitest cleanly, so
// scripts/check-document-order.mjs asserts those instead.
import { describe, it, expect } from "vitest";
import { SECTIONS, SECTION_KEYS, blankFor, typeForKey, rankOf } from "./manifest";
import { SECTION_COMPONENTS } from "./registry";
import { CANONICAL_ORDER, typeOf } from "./planSections";
import sectionLabel, { SECTION_LABELS } from "../../../admin/sectionLabels";

describe("the manifest and the components agree", () => {
  it("has a component for every section type it declares", () => {
    // A manifest entry naming a type nothing answers to would let an editor add
    // a section that silently renders nothing.
    const undrawable = SECTIONS
      .filter((s) => s.type && !SECTION_COMPONENTS[s.type])
      .map((s) => `${s.key} -> ${s.type}`);

    expect(undrawable).toEqual([]);
  });

  it("declares a type for every section except the FAQ heading", () => {
    // faqsHeading is furniture — it titles the FAQ block and draws nothing of
    // its own — so it is the only entry allowed a null type.
    const typeless = SECTIONS.filter((s) => !s.type).map((s) => s.key);
    expect(typeless).toEqual(["faqsHeading"]);
  });

  it("uses every registered component", () => {
    // A component in the registry that no section can produce is dead code, and
    // usually means a manifest entry was forgotten.
    const declared = new Set(SECTIONS.map((s) => s.type).filter(Boolean));
    // `cards` is reachable by shape rather than by key: a cardGroups entry with
    // object items renders as a card grid.
    declared.add("cards");
    const unreachable = Object.keys(SECTION_COMPONENTS).filter((t) => !declared.has(t));
    expect(unreachable).toEqual([]);
  });
});

describe("the planner reads the manifest", () => {
  it("takes its canonical order straight from it", () => {
    expect(CANONICAL_ORDER).toEqual(SECTION_KEYS);
  });

  it("ranks an unknown key last, so it cannot displace a real section", () => {
    expect(rankOf("hero")).toBe(0);
    expect(rankOf("cardGroups.2")).toBe(SECTION_KEYS.indexOf("cardGroups"));
    expect(rankOf("cardGroups[2]")).toBe(SECTION_KEYS.indexOf("cardGroups"));
    expect(rankOf("somethingNobodyDeclared")).toBe(SECTION_KEYS.length);
  });

  it("resolves each key to the type the manifest declares", () => {
    for (const s of SECTIONS) {
      if (!s.type || s.key === "cardGroups") continue;
      // Shape-decided keys are given their declared shape so the manifest's
      // answer is the one under test.
      const blank = blankFor(s.key);
      const data = Array.isArray(blank) ? blank[0] : blank;
      expect(typeOf(s.key, data)).toBe(s.type);
    }
  });
});

describe("the editor reads the manifest", () => {
  it("labels every section from it", () => {
    for (const s of SECTIONS) expect(sectionLabel(s.key)).toBe(s.label);
  });

  it("only overrides a label where it differs from the humanised key", () => {
    // If this grows past `hero`, each addition must be a DISPLAY change only —
    // the content key, the extractor and layoutMerge all still rank by the key,
    // and renaming one is a migration, not an edit.
    expect(Object.keys(SECTION_LABELS)).toEqual(["hero"]);
    expect(SECTION_LABELS.hero).toBe("Banner");
  });

  it("hands out a fresh blank each time, never the manifest's own object", () => {
    const first = blankFor("intro");
    first.titleLead = "typed into by an editor";
    expect(blankFor("intro").titleLead).toBe("");
  });

  it("returns null for a key it does not know, rather than an empty section", () => {
    expect(blankFor("notASection")).toBeNull();
    expect(typeForKey("notASection")).toBeNull();
  });

  it("gives every section help text", () => {
    const missing = SECTIONS.filter((s) => !s.help).map((s) => s.key);
    expect(missing).toEqual([]);
  });
});
