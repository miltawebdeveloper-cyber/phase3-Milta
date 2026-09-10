// The label an editor reads is allowed to differ from the key the row stores.
// This pins the one case where it does, and pins the boundary: the mapping must
// never leak back into the data.
import { describe, it, expect } from "vitest";
import sectionLabel, { SECTION_LABELS } from "./sectionLabels";

describe("sectionLabel", () => {
  it("calls the hero section a Banner, which is what the documents call it", () => {
    expect(sectionLabel("hero")).toBe("Banner");
  });

  it("leaves every other section humanised from its key", () => {
    expect(sectionLabel("intro")).toBe("Intro");
    expect(sectionLabel("whyEssential")).toBe("Why Essential");
    expect(sectionLabel("comparisonTable")).toBe("Comparison Table");
    expect(sectionLabel("faqs")).toBe("Faqs");
  });

  it("keeps the index on an outline id, in either notation", () => {
    // The verification outline writes cardGroups[0]; the render plan writes
    // cardGroups.0. Both name one section, and a reviewer needs to know which.
    expect(sectionLabel("cardGroups[0]")).toBe("Card Groups 1");
    expect(sectionLabel("cardGroups.2")).toBe("Card Groups 3");
  });

  it("survives input it was not given", () => {
    expect(sectionLabel("")).toBe("");
    expect(sectionLabel(undefined)).toBe("");
    expect(sectionLabel(null)).toBe("");
  });

  it("renames nothing but the label", () => {
    // If this ever grows past `hero`, check that each addition is a DISPLAY
    // change only — the content key, the extractor and layoutMerge all still
    // rank by the key, and renaming one is a migration, not an edit.
    expect(Object.keys(SECTION_LABELS)).toEqual(["hero"]);
  });
});
