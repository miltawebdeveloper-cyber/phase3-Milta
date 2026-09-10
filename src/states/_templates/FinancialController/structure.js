// The Financial Controller section contract — the shape an uploaded document
// is poured into.
//
// SINGLE SOURCE OF TRUTH is db/templates/financial-controller.json. The
// server reads that file directly on upload (server/services/serviceTemplates.js),
// and scripts/check-service-templates.mjs verifies it against the reference
// page. This module only re-exports it so the whole template — the fixed
// layout in ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the order ./index.jsx renders them:
//   intro (2) · prose (1, "Book Your Free Consultation Today") ·
//   cardGroups × 10  [ "What is a Finance Controller Services?" (3),
//                     "Controller vs. CFO: Different Roles, Unique Value" (1),
//                     "What are Financial Controller Services?" (2),
//                     "Capabilities" comparison table (14 rows, Controller/CFO),
//                     "When to Choose a Controller" (1),
//                     "When to Choose a CFO" (1),
//                     "Miltafs Financial Controller Services" (2),
//                     "Our Financial Controller Services in {state}" (11 cards),
//                     "Who Can Benefit from Our Services?" (3 cards),
//                     "Why Choose Miltafs for Financial Controller Services?" (4 cards) ] ·
//   faqs (12)
export { default } from "../../../../db/templates/financial-controller.json";
