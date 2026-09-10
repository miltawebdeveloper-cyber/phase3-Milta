// planSections is the only piece of the Delaware layout with a decision in it,
// so it is the piece worth testing. Everything else draws what it is handed.
import { describe, it, expect } from "vitest";
import planSections, { typeOf, isEmptySection } from "./planSections";

const hero = { titleLead: "Bookkeeping Services in", highlight: "Delaware" };
const ids = (plan) => plan.map((s) => s.id);
const types = (plan) => plan.map((s) => s.type);

describe("document order", () => {
  it("keeps cardGroups in the order the document wrote them", () => {
    const plan = planSections({
      hero,
      cardGroups: [
        { titleLead: "First", paragraphs: ["a"] },
        { titleLead: "Second", items: [{ title: "b", desc: "c" }] },
        { titleLead: "Third", items: ["d", "e"] },
      ],
    });

    expect(ids(plan)).toEqual(["hero", "cardGroups.0", "cardGroups.1", "cardGroups.2"]);
    expect(types(plan)).toEqual(["banner", "prose", "cards", "checklist"]);
  });

  it("honours an explicit content.order over the canonical one", () => {
    const content = {
      hero,
      intro: { titleLead: "Intro", paragraphs: ["i"] },
      industries: { titleLead: "Industries", items: ["Retail"] },
      whyEssential: { titleLead: "Why", items: ["x"] },
      order: ["industries", "whyEssential", "intro"],
    };

    // Canonical order would be intro, whyEssential, industries.
    expect(ids(planSections(content))).toEqual([
      "hero",
      "industries",
      "whyEssential",
      "intro",
    ]);
  });

  it("ignores names in content.order that no longer exist", () => {
    const plan = planSections({
      hero,
      intro: { titleLead: "Intro", paragraphs: ["i"] },
      order: ["solutions", "intro", "comparisonTable"],
    });

    expect(ids(plan)).toEqual(["hero", "intro"]);
  });

  it("appends sections missing from content.order in canonical order", () => {
    const plan = planSections({
      hero,
      intro: { titleLead: "Intro", paragraphs: ["i"] },
      industries: { titleLead: "Industries", items: ["Retail"] },
      faqs: [{ q: "q?", a: "a" }],
      order: ["industries"],
    });

    expect(ids(plan)).toEqual(["hero", "industries", "intro", "faqs"]);
  });

  it("opens with the banner however the row orders it", () => {
    const plan = planSections({
      intro: { titleLead: "Intro", paragraphs: ["i"] },
      hero,
      order: ["intro", "hero"],
    });

    expect(plan[0].id).toBe("hero");
  });

  it("moves a closing block that asks to sit after the questions", () => {
    const plan = planSections({
      hero,
      closing: { titleLead: "Closing", paragraphs: ["z"], placement: "afterFaqs" },
      faqs: [{ q: "q?", a: "a" }],
    });

    expect(ids(plan)).toEqual(["hero", "faqs", "closing"]);
  });
});

describe("banding", () => {
  it("alternates by position so a reorder never doubles a band", () => {
    const plan = planSections({
      hero,
      // Every section stored with the same bg — which is what a reorder of rows
      // banded for the old fixed order would leave behind.
      intro: { titleLead: "A", paragraphs: ["a"], bg: "paper" },
      prose: { titleLead: "B", paragraphs: ["b"], bg: "paper" },
      industries: { titleLead: "C", items: ["Retail"], bg: "paper" },
    });

    expect(plan.map((s) => s.band)).toEqual(["deep", "default", "paper", "default"]);
  });

  it("numbers body sections from one and leaves the banner unnumbered", () => {
    const plan = planSections({
      hero,
      intro: { titleLead: "A", paragraphs: ["a"] },
      industries: { titleLead: "C", items: ["Retail"] },
    });

    expect(plan.map((s) => s.index)).toEqual([null, 1, 2]);
  });
});

describe("empty sections", () => {
  it("drops a section that has a shape but no words", () => {
    const plan = planSections({
      hero,
      solutions: { titleLead: "", highlight: "", items: [{ icon: "TimerIcon", title: "", desc: "" }] },
      intro: { titleLead: "Intro", paragraphs: ["i"] },
    });

    expect(ids(plan)).toEqual(["hero", "intro"]);
  });

  it("counts a heading alone as content", () => {
    expect(isEmptySection({ titleLead: "Just a heading" })).toBe(false);
    expect(isEmptySection({ items: [] })).toBe(true);
    expect(isEmptySection({ bg: "paper", columns: 2 })).toBe(true);
  });

  it("keeps the banner even when it is empty, so the page still emits an h1", () => {
    const plan = planSections({ hero: {}, intro: { titleLead: "Intro", paragraphs: ["i"] } });
    expect(plan[0].type).toBe("banner");
  });
});

describe("renderer choice", () => {
  it("picks by key where the design is an editorial decision", () => {
    expect(typeOf("industries", { items: ["Retail"] })).toBe("industries");
    expect(typeOf("solutions", { items: [{ title: "a" }] })).toBe("featureCards");
    expect(typeOf("advantages", { items: [{ title: "a" }] })).toBe("advantages");
    expect(typeOf("closing", { paragraphs: ["a"] })).toBe("prose");
  });

  it("picks by shape for an unnamed cardGroups entry", () => {
    expect(typeOf("cardGroups", { rows: [{ label: "a", marks: [true] }] })).toBe("table");
    expect(typeOf("cardGroups", { paragraphs: ["a"] })).toBe("prose");
    expect(typeOf("cardGroups", { items: ["a", "b"] })).toBe("checklist");
    expect(typeOf("cardGroups", { items: [{ title: "a", desc: "b" }] })).toBe("cards");
  });
});

describe("bad input", () => {
  it("returns an empty plan rather than throwing", () => {
    expect(planSections(null)).toEqual([]);
    expect(planSections("a string of html")).toEqual([]);
    expect(planSections([])).toEqual([]);
  });
});
