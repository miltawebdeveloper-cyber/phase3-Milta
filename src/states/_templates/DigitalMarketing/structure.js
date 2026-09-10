// The Digital Marketing section contract — the shape an uploaded document is
// poured into.
//
// SINGLE SOURCE OF TRUTH is db/templates/digital-marketing.json. The server
// reads that file directly on upload (server/services/serviceTemplates.js),
// and scripts/check-service-templates.mjs verifies it against the reference
// page. This module only re-exports it so the whole template — the fixed
// layout in ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the order ./index.jsx renders them:
//   intro (2) · prose (2) · whyEssential (3, checklist) ·
//   cardGroups × 3  [ "Milta Digital Marketing Services in {state}" 8 cards,
//                     "Why Choose Milta as Your Digital Marketing Service"  6 cards,
//                     "Why Select Milta as Your Partner in Digital Marketing" 5 cards ] ·
//   faqs (5)
export { default } from "../../../../db/templates/digital-marketing.json";
