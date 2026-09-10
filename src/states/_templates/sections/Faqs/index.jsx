// The questions.
//
// The DESIGN is _ServiceLayout's, imported rather than reimplemented. That is
// deliberate: these pages must look exactly like the service pages already on
// the site, and a second copy of a 60-line sx block is a copy that drifts. What
// this folder owns is the section's IDENTITY in the CMS — its name, its place in
// the manifest, and the props the render plan hands it. The pixels stay in one
// place.
//
// `band` comes from the plan, which decides it by POSITION so a reordered page
// never lands two identical grounds together. It is passed down as `bg`, which
// is the field the renderer already reads.
import React from "react";
import { FAQSection } from "../../../_ServiceLayout";

// `heading` is the row's `faqsHeading`. Several pages title their FAQ block in
// their own words — "Payroll Management FAQs" — and those are keyword-bearing
// H2s, not chrome, so the generic default only applies when a row supplies none.
export default function Faqs({ data, heading }) {
  const faqs = Array.isArray(data) ? data : [];
  if (!faqs.length) return null;
  return <FAQSection faqs={faqs} heading={heading} />;
}
