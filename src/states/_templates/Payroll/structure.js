// The Payroll section contract — the shape an uploaded document is poured
// into.
//
// SINGLE SOURCE OF TRUTH is db/templates/payroll.json. The server reads that
// file directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference page.
// This module only re-exports it so the whole template — the fixed layout in
// ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, each its own key (fixed, like ../Bookkeeping — no two sections
// share a key, so ./index.jsx reads every one of them by name, in this order:
//   intro (2) ·
//   prose (1, "End-to-End Payroll Management You Can Rely On") ·
//   whatWeHandle (checklist, 5, "What We Handle for Your Business") ·
//   howItWorks (cards, 4, "How Our Payroll Management System Works") ·
//   whyEssential (cards, 5, "Why Payroll Management Is Essential for US Businesses") ·
//   whyChoose (cards, 4, "Why Choose Outsourced Payroll Management Services?") ·
//   rightFit (checklist, 5, "Is Payroll Outsourcing the Right Fit for Your Business?") ·
//   keyAdvantages (cards, 4, "Key Advantages of Outsourced Payroll Management") ·
//   bestPractices (checklist, 8, "Best Practices for Accurate Payroll Management") ·
//   dataSecurity (checklist, 5, "Trusted Payroll Data Security & Compliance") ·
//   servicesByMilta (cards, 8, "Payroll Management Services by Milta Accounting") ·
//   closing (3, "Partner with a Trusted Payroll Management Company") ·
//   faqs (4)
export { default } from "../../../../db/templates/payroll.json";
