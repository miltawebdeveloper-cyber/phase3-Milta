// The banner — the page opener, and the only section guaranteed to render.
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
import { Hero } from "../../../_ServiceLayout";

// "Banner" is what the people who write these pages call it: Milta's source
// documents label this block "Banner Section:", and layoutService has a rule for
// exactly that string. The stored content key is still `hero` — 228 rows, the
// extractor and _ServiceLayout all read that name — so this renames what an
// editor sees, not what the database holds.
export default function Banner({ data }) {
  return <Hero hero={data && typeof data === "object" ? data : {}} />;
}
