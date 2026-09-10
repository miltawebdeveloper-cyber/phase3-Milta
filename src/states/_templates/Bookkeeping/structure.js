// The Bookkeeping section contract — the shape an uploaded document is poured
// into, section by section.
//
// SINGLE SOURCE OF TRUTH is db/templates/bookkeeping.json. The server reads that
// file directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference Delaware
// page. This module only re-exports it, so the whole template — the fixed
// layout in ./index.jsx and the structure it fills — lives in one folder without
// a second copy of the data to keep in step.
//
// Sections, in the fixed order ./index.jsx renders them:
//   intro (2)  ·  prose (3)  ·  whyEssential (4)  ·  solutions (4)  ·
//   cardGroups (8, 2 cols)  ·  industries (13)  ·  faqs (10)
export { default } from "../../../../db/templates/bookkeeping.json";
