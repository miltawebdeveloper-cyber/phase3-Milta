// The Tax section contract — the shape an uploaded document is poured into.
//
// SINGLE SOURCE OF TRUTH is db/templates/tax.json. The server reads that file
// directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference Delaware
// page. This module only re-exports it so the whole template — the fixed layout
// in ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the fixed order ./index.jsx renders them:
//   intro (2) · prose (2) · solutions (4) ·
//   cardGroups × 12  [ "1. Tax Preparation" + Federal 4 / State 3 / Local 2,
//                      "2. Tax Review"      + Review 3 / Finalization 3,
//                      "3. Tax E-Filing"    + Benefits 4 / We E-File 2,
//                      "4. Tax Forms" 4 + "Understanding Key" 7 ] ·
//   checklists (4, "Why Partner") · closing (1, "Ready to Simplify") · faqs (4)
export { default } from "../../../../db/templates/tax.json";
