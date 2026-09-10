// The CPA section contract — the shape an uploaded document is poured into.
//
// SINGLE SOURCE OF TRUTH is db/templates/cpa.json. The server reads that file
// directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference page.
// This module only re-exports it so the whole template — the fixed layout in
// ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the fixed order ./index.jsx renders them:
//   intro (2) · prose (2) ·
//   cardGroups × 6  [ "Why Outsource Your CPA Services?" prose,
//                     "Our CPA Services for Small Business" 5 cards / 3 cols,
//                     "Our Core CPA Services in {state}"    6 cards / 2 cols,
//                     "Why Choose Milta for CPA Services"   6 cards / 3 cols,
//                     "Specialized CPA Services"            3 cards / 3 cols,
//                     "How Milta Supports CPA Firms near me" 5 cards / 3 cols ] ·
//   faqs (5)
export { default } from "../../../../db/templates/cpa.json";
