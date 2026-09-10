import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { toServiceLayout } = require("./layoutService.js");

describe("document layout", () => {
  it("keeps the banner CTA and places the intro after it", () => {
    const { content } = toServiceLayout({
      html: [
        "<h1>Bookkeeping Services in Delaware</h1>",
        "<p>Trusted support for growing businesses.</p>",
        "<p>Book a free consultation today.</p>",
        "<h2>Intro</h2>",
        "<p>We keep your books organized.</p>",
      ].join(""),
      text: "",
    });

    expect(content.order).toEqual(["hero", "intro"]);
    expect(content.hero.ctaLabel).toBe("Book a free consultation today.");
    expect(content.hero.subtitle).toBe("Trusted support for growing businesses.");
    expect(content.intro.paragraphs).toEqual(["We keep your books organized."]);
  });
});