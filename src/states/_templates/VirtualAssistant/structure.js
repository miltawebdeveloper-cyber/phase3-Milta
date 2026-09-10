// The Virtual Assistant section contract — the shape an uploaded document is
// poured into.
//
// SINGLE SOURCE OF TRUTH is db/templates/virtual-assistant.json. The server
// reads that file directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference page.
// This module only re-exports it so the whole template — the fixed layout in
// ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the fixed order ./index.jsx renders them:
//   intro (3) ·
//   cardGroups × 6  [ "Benefits of Virtual Assistant Services" 4 cards / 2 cols,
//                     "Focus on Growth, Leave the Rest to Us!"  prose + CTA,
//                     "Our Virtual Assistant Services"          12 cards / 3 cols,
//                     "Why Choose Milta for VA Services?"        5 cards / 3 cols,
//                     "How to Get Started"                       4 cards / 2 cols,
//                     "Transform Your Business with Milta…"      prose + CTA ] ·
//   faqs (5)
export { default } from "../../../../db/templates/virtual-assistant.json";
