// The CPA section contract — the shape an uploaded document is poured into.
//
// SINGLE SOURCE OF TRUTH is db/templates/cpa.json. The server reads that file
// directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference page.
// This module only re-exports it so the whole template — the fixed layout in
// ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, each its own key (fixed, like ../Bookkeeping — no two sections
// share a key), in the order ./index.jsx renders them:
//   intro (2) ·
//   prose (2, "How Can We Support Your Business?") ·
//   whyOutsource (prose, 2, "Why Outsource Your CPA Services?") ·
//   smallBusinessServices (cards, 5, 3 cols, "Our CPA Services for Small Business") ·
//   coreServices (cards, 6, 2 cols, "Our Core CPA Services in {state}") ·
//   whyChooseMilta (cards, 6, 3 cols, "Why Choose Milta for CPA Services") ·
//   specializedServices (cards, 3, 3 cols, "Specialized CPA Services") ·
//   howMiltaSupports (cards, 5, 3 cols, "How Milta Supports CPA Firms near me") ·
//   faqs (5)
export { default } from "../../../../db/templates/cpa.json";
