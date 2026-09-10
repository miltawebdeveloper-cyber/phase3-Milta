// The per-service templates and the per-service DATA have to name the same eight
// services.
//
// They live on opposite sides of the app — db/templates/<service>.json is read by
// the server when a document is uploaded, src/states/_templates/<Service>.jsx by
// the browser when the page is drawn — and nothing but this connects them. A
// service present in one and missing from the other is a page shaped by a
// template that nothing renders, or rendered by a template nothing shapes.
import { createRequire } from "node:module";
import { describe, it, expect } from "vitest";
import index from "../../../db/templates/index.json";
import ServiceTemplateLayout from "./ServiceTemplateLayout";
import { SERVICE_TEMPLATES, templateFor } from "./index";
import { componentFor } from "./sections/registry";
import { typeOf } from "./sections/planSections";

// serviceTemplates is the server's CommonJS module; `blankSection` is the exact
// function the upload path uses to turn a template section into a page section,
// so going through it is what makes this a test of the real join rather than of
// a re-description of it.
const require = createRequire(import.meta.url);
const { blankSection } = require("../../../server/services/serviceTemplates.js");
const templateData = Object.fromEntries(
  index.templates.map((t) => [t.service, require(`../../../db/templates/${t.file}`)]),
);

const SERVICES = index.templates.map((t) => t.service);

describe("the service templates", () => {
  it("covers every service that has a data template", () => {
    expect(Object.keys(SERVICE_TEMPLATES).sort()).toEqual([...SERVICES].sort());
  });

  it("has no template for a service the data does not know", () => {
    const unknown = Object.keys(SERVICE_TEMPLATES).filter((s) => !SERVICES.includes(s));
    expect(unknown).toEqual([]);
  });

  it("resolves each service to its own component", () => {
    for (const service of SERVICES) {
      expect(templateFor(service)).toBe(SERVICE_TEMPLATES[service]);
    }
  });

  it("gives every service a distinct template file", () => {
    // Distinct components, not one component registered eight times: the whole
    // point of the eight files is that a service can diverge on its own.
    expect(new Set(Object.values(SERVICE_TEMPLATES)).size).toBe(SERVICES.length);
  });

  it("falls back to the shared layout rather than to nothing", () => {
    // A page whose service is blank, misspelt or new still has to render.
    expect(templateFor("")).toBe(ServiceTemplateLayout);
    expect(templateFor(undefined)).toBe(ServiceTemplateLayout);
    expect(templateFor("Not A Service")).toBe(ServiceTemplateLayout);
  });

  it("needs no section component that does not already exist", () => {
    // The point of checking before building anything: every section any of the
    // eight templates calls for is drawn by a component already in sections/.
    // A template kind with no component would be a page shaped into a section
    // nothing can render.
    const undrawable = [];
    for (const [service, template] of Object.entries(templateData)) {
      template.sections.forEach((section, i) => {
        const type = typeOf(section.key, blankSection(section));
        if (!componentFor(type)) {
          undrawable.push(`${service} #${i + 1} ${section.key}/${section.kind} -> ${type}`);
        }
      });
    }
    expect(undrawable).toEqual([]);
  });

  it("uses only the four section kinds the components cover", () => {
    const kinds = new Set(
      Object.values(templateData).flatMap((t) => t.sections.map((s) => s.kind)),
    );
    expect([...kinds].sort()).toEqual(["cards", "checklist", "prose", "table"]);
  });

  it("matches the database's service names exactly", () => {
    // `pages.service` stores "Data Entry" and "Virtual Assistant" with the
    // space. A key that normalised them would miss every lookup.
    expect(SERVICE_TEMPLATES["Data Entry"]).toBeTruthy();
    expect(SERVICE_TEMPLATES["Virtual Assistant"]).toBeTruthy();
    expect(SERVICE_TEMPLATES["Financial Controller"]).toBeTruthy();
  });
});
