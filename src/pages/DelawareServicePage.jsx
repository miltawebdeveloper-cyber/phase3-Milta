// A state service page, drawn with the section layout.
//
// The row, the fetch, the loading state and the missing-row behaviour are
// CmsServicePage's — only the template differs. That is deliberate: the two
// layouts have to be compared against the SAME database row, and any difference
// in how the row is loaded would show up as a difference in the page.
//
// The layout is picked from the row's SERVICE, so a Bookkeeping page draws
// through src/states/_templates/Bookkeeping.jsx and a Tax page through Tax.jsx.
// Every one of them currently renders the same sections — what differs per
// service is which sections a page has and in what order, which is data — but
// the indirection is what lets one service diverge without touching the rest.
//
// Mounted at /delaware-preview/* while the layout is reviewed, so the live URLs
// keep rendering through _ServiceLayout until someone decides to switch them.
// Cutover is one line in App.jsx — see the note on that route.
import React from "react";
import CmsServicePage from "./CmsServicePage";
import { templateFor } from "../states/_templates";

// The row is not in hand when this renders — CmsServicePage fetches it — so the
// service is read from the row it hands back, and the layout chosen per render.
function ByService(props) {
  const Template = templateFor(props?.service);
  return <Template {...props} />;
}

export default function StateServicePage({ stripPrefix = "" }) {
  return <CmsServicePage stripPrefix={stripPrefix} Layout={ByService} />;
}
