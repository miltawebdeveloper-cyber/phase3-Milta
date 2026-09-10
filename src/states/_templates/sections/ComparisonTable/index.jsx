// A tick table.
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
import { ComparisonTable } from "../../../_ServiceLayout";

export default function Section({ data, band = "default" }) {
  const d = data && typeof data === "object" ? data : {};
  return <ComparisonTable data={{ ...d, bg: band }} />;
}
