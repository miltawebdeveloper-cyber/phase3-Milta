// The Payroll section contract — the shape an uploaded document is poured
// into.
//
// SINGLE SOURCE OF TRUTH is db/templates/payroll.json. The server reads that
// file directly on upload (server/services/serviceTemplates.js), and
// scripts/check-service-templates.mjs verifies it against the reference page.
// This module only re-exports it so the whole template — the fixed layout in
// ./index.jsx and the structure it fills — lives in one folder.
//
// Sections, in the order ./index.jsx renders them:
//   intro (2) ·
//   prose (1, "End-to-End Payroll Management You Can Rely On") ·
//   cardGroups × 9 [ "What We Handle for Your Business" (checklist, 5) ·
//                    "How Our Payroll Management System Works" (cards, 4) ·
//                    "Why Payroll Management Is Essential for US Businesses" (cards, 5) ·
//                    "Why Choose Outsourced Payroll Management Services?" (cards, 4) ·
//                    "Is Payroll Outsourcing the Right Fit for Your Business?" (checklist, 5) ·
//                    "Key Advantages of Outsourced Payroll Management" (cards, 4) ·
//                    "Best Practices for Accurate Payroll Management" (checklist, 8) ·
//                    "Trusted Payroll Data Security & Compliance" (checklist, 5) ·
//                    "Payroll Management Services by Milta Accounting" (cards, 8) ] ·
//   closing (3, "Partner with a Trusted Payroll Management Company") ·
//   faqs (4)
export { default } from "../../../../db/templates/payroll.json";
