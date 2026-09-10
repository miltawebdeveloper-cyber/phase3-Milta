import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import index from "../../../db/templates/index.json";
import { SERVICE_TEMPLATES, templateFor as clientTemplateFor } from "./index";
import planSections from "./sections/planSections";
import { componentFor } from "./sections/registry";

const require = createRequire(import.meta.url);
const contentService = require("../../../server/services/contentService.js");
const { templateFor: serverTemplateFor } = require("../../../server/services/serviceTemplates.js");

const TEST_DOCUMENT_HTML = `
<h1>Accounting and Professional Services in Delaware</h1>
<p>Milta provides industry-leading financial and management support for high-growth businesses.</p>

<h2>Why Businesses Trust Us</h2>
<ul>
  <li>Fixed monthly retainers with transparent reporting.</li>
  <li>Dedicated team of seasoned professionals.</li>
  <li>Fast monthly closes and real-time ledger access.</li>
</ul>

<h2>Core Capabilities</h2>
<ul>
  <li>General Ledger Maintenance — Complete audit-ready reconciliation and recording</li>
  <li>Accounts Payable & Receivable — Timely invoicing, bill pay, and cash-flow monitoring</li>
  <li>Financial Reporting — Monthly P&L, balance sheets, and cash projections</li>
  <li>Tax Filing Assistance — Comprehensive state and federal compliance support</li>
</ul>

<h2>Industries We Specialize In</h2>
<ul>
  <li>Healthcare & Medical Practices</li>
  <li>Construction & Contractors</li>
  <li>Ecommerce & Retail</li>
  <li>Professional Services & Law Firms</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>What software platforms do you support?</h3>
<p>We support QuickBooks Desktop, QuickBooks Online, Xero, and Wave Accounting.</p>
<h3>How quickly can we transition our books to Milta?</h3>
<p>Most onboarding transitions are completed within 5 to 10 business days.</p>
`;

const sampleBuffer = Buffer.from(TEST_DOCUMENT_HTML, "utf8");

describe("Milta CMS Document Upload and Service Templates Integration", () => {
  it("registers all 8 services in client SERVICE_TEMPLATES", () => {
    expect(Object.keys(SERVICE_TEMPLATES).length).toBe(8);
  });

  for (const { service } of index.templates) {
    describe(`Service: ${service}`, () => {
      it("resolves to a valid React component from client templateFor()", () => {
        const Component = clientTemplateFor(service);
        expect(typeof Component).toBe("function");
      });

      it("shapes an uploaded document according to the service template during preview", async () => {
        const template = serverTemplateFor(service);
        expect(template).toBeTruthy();
        expect(template.service).toBe(service);

        // Preview document through contentService
        const preview = await contentService.previewDocument(
          { buffer: sampleBuffer, mimetype: "text/html", originalname: `${service.toLowerCase()}-upload.html` },
          { service },
        );

        expect(preview.template?.service).toBe(service);
        expect(preview.fields?.content).toBeTruthy();
        expect(typeof preview.fields.content).toBe("object");

        const content = preview.fields.content;

        // All sections required by the template must be present
        for (const s of template.sections) {
          expect(s.key in content).toBe(true);
        }

        // Order must be recorded and start with hero
        expect(Array.isArray(content.order)).toBe(true);
        expect(content.order[0]).toBe("hero");

        // Copy from uploaded document must be preserved
        const serialized = JSON.stringify(content);
        expect(serialized).toContain("General Ledger Maintenance");
        expect(serialized).toContain("Fixed monthly retainers");
        expect(serialized).toContain("QuickBooks Online");

        // planSections must resolve into a non-empty list of sections
        const plan = planSections(content);
        expect(plan.length).toBeGreaterThanOrEqual(4);

        // Every planned section must have a registered component in registry
        for (const section of plan) {
          const Comp = componentFor(section.type);
          expect(Comp).toBeTruthy();
        }

        // Render through the service's React template component
        const TemplateComponent = clientTemplateFor(service);
        const renderedHtml = renderToStaticMarkup(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(TemplateComponent, {
              content,
              service,
              preview: true,
              fallbackTitle: "Fallback Service Title",
            }),
          ),
        );

        expect(renderedHtml.length).toBeGreaterThan(300);
        expect(renderedHtml).toContain("<h1");
        const h1Matches = renderedHtml.match(/<h1\b/g) || [];
        expect(h1Matches.length).toBe(1);
        expect(renderedHtml).toContain("<h2");
      });
    });
  }
});
