// End-to-end verification of the document upload -> service template structure pipeline.
//
// Proves that when a document is uploaded/previewed in Milta CMS:
// 1. The document is extracted cleanly by documentService.
// 2. The document is shaped into the exact template structure for its service
//    (matching db/templates/<service>.json).
// 3. Sections and render ordering are produced according to the service template.
// 4. The resulting structure renders through the React template in src/states/_templates/
//    using templateFor(service) and planSections().
// 5. No copy or sections are dropped or corrupted.

import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';

const ROOT = 'd:/milta-web-v3/milta-web';
const require = createRequire(import.meta.url);

const index = JSON.parse(fs.readFileSync(`${ROOT}/db/templates/index.json`, 'utf8'));
const documentService = require(`${ROOT}/server/services/documentService.js`);
const layoutService = require(`${ROOT}/server/services/layoutService.js`);
const { applyDocumentStructure } = require(`${ROOT}/server/services/layoutMerge.js`);
const { templateFor: serverTemplateFor, listTemplates } = require(`${ROOT}/server/services/serviceTemplates.js`);
const contentService = require(`${ROOT}/server/services/contentService.js`);

// Client-side template modules from src/states/_templates
const { templateFor: clientTemplateFor, SERVICE_TEMPLATES } = await import('../src/states/_templates/index.js');
const planSections = (await import('../src/states/_templates/sections/planSections.js')).default;
const { componentFor, SECTION_COMPONENTS } = await import('../src/states/_templates/sections/registry.js');

const checks = [];
const check = (name, ok, detail = '') => checks.push([name, ok, detail]);

/* ── 1. Client and Server Template Alignment ───────────────────────────────── */

check('all 8 services are registered in client SERVICE_TEMPLATES',
  Object.keys(SERVICE_TEMPLATES).length === 8,
  `${Object.keys(SERVICE_TEMPLATES).length} services found`);

for (const { service, file } of index.templates) {
  const Component = clientTemplateFor(service);
  check(`client templateFor("${service}") returns a valid React component`,
    typeof Component === 'function',
    typeof Component);

  const serverTemplate = serverTemplateFor(service);
  check(`server templateFor("${service}") returns valid template schema`,
    serverTemplate && serverTemplate.service === service && Array.isArray(serverTemplate.sections),
    serverTemplate ? `${serverTemplate.sections?.length} sections` : 'missing');
}

/* ── 2. Test Document Extraction and Template Shaping per Service ─────────── */

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

const sampleBuffer = Buffer.from(TEST_DOCUMENT_HTML, 'utf8');

for (const { service } of index.templates) {
  const template = serverTemplateFor(service);

  // A. Test CMS previewDocument flow (as invoked when user selects/drops document)
  const preview = await contentService.previewDocument(
    { buffer: sampleBuffer, mimetype: 'text/html', originalname: `${service.toLowerCase()}-upload.html` },
    { service },
  );

  check(`${service}: previewDocument shapes content with service template`,
    preview.template?.service === service,
    `template service: ${preview.template?.service}`);

  check(`${service}: previewDocument yields structured content`,
    preview.fields?.content && typeof preview.fields.content === 'object',
    typeof preview.fields?.content);

  const content = preview.fields.content;

  // B. Verify service template sections are all present
  const requiredKeys = new Set(template.sections.map((s) => s.key));
  const missingKeys = [...requiredKeys].filter((k) => !(k in content));
  check(`${service}: all template sections are present in content`,
    missingKeys.length === 0,
    missingKeys.length ? `missing: ${missingKeys.join(', ')}` : `${requiredKeys.size} sections`);

  // C. Verify order was recorded and starts with hero
  check(`${service}: content.order is recorded starting with hero`,
    Array.isArray(content.order) && content.order[0] === 'hero',
    JSON.stringify(content.order?.slice(0, 4)));

  // D. Verify uploaded document words and headings survived
  const serialized = JSON.stringify(content);
  check(`${service}: uploaded copy survived shaping`,
    serialized.includes('General Ledger Maintenance') &&
    serialized.includes('Fixed monthly retainers') &&
    serialized.includes('QuickBooks Online'),
    'copy preserved');

  // E. Verify client-side planSections resolves all sections without error
  const plan = planSections(content);
  check(`${service}: planSections generates non-empty render plan`,
    plan.length >= 4,
    `${plan.length} plan sections generated`);

  const unresolvedTypes = plan
    .filter((s) => !componentFor(s.type))
    .map((s) => s.type);

  check(`${service}: all planned sections map to registered components in registry.js`,
    unresolvedTypes.length === 0,
    unresolvedTypes.join(', ') || 'all mapped');

  // F. Verify rendering through the service's React template component
  const TemplateComponent = clientTemplateFor(service);
  let renderedHtml = '';
  let renderError = null;

  try {
    renderedHtml = renderToStaticMarkup(
      React.createElement(TemplateComponent, {
        content,
        service,
        preview: true,
        fallbackTitle: 'Fallback Service Title',
      }),
    );
  } catch (err) {
    renderError = err.message;
  }

  check(`${service}: renders to HTML via clientTemplateFor("${service}") without error`,
    !renderError && renderedHtml.length > 500,
    renderError ? `Error: ${renderError}` : `${renderedHtml.length} bytes rendered`);

  check(`${service}: rendered output contains single h1 and section headings`,
    renderedHtml.includes('<h1') && (renderedHtml.match(/<h1/g) || []).length === 1 && renderedHtml.includes('<h2'),
    `h1 count: ${(renderedHtml.match(/<h1/g) || []).length}`);
}

/* ── 3. Summary and Exit ─────────────────────────────────────────────────── */

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : `: ${detail}`}`);
  if (!ok) failed += 1;
}

console.log(`\n${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
