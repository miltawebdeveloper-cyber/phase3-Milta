// The Data Entry section contract — the shape an uploaded document is poured
// into.
//
// SINGLE SOURCE OF TRUTH is db/templates/data-entry.json. The server reads
// that file directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference page.
// This module only re-exports it so the whole template — the fixed layout in
// ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the order ./index.jsx renders them:
//   intro (3) ·
//   cardGroups × 2  [ "Our Efficient Accounting Data Entry Process" 6 cards / 3 cols,
//                     "Our Data Entry Services in {state}"          9 cards / 3 cols ] ·
//   faqs (8) ·
//   closing (1, "Ready to transform your financial data…", ALWAYS after faqs)
export { default } from "../../../../db/templates/data-entry.json";
