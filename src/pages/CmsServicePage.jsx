// One route that renders any CMS page row through the existing template.
//
// This is the whole of Phase 2's rendering story: `content` is stored in exactly
// the shape ServiceLayout already accepts, so there is no mapping layer and no
// second template to keep in sync with the first.
//
// Nothing here replaces a route yet. It is mounted alongside the 216 hard-coded
// state routes so both paths can be compared against the same URLs before any
// source file is removed.
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import ServiceLayout from "../states/_ServiceLayout";
import { templateFor } from "../states/_templates";
import { getPageByUrl, seoFromRow } from "../api/pages";

// Resolves the component for the page's service from src/states/_templates.
function ByService(props) {
  const Template = templateFor(props?.service);
  return <Template {...props} />;
}

// `stripPrefix` lets one component serve a row at its real URL and at a preview
// URL. The preview route is mounted at /cms-preview/* so a database row can be
// compared against the hard-coded component rendering the same path; the row is
// looked up by the path with that prefix removed.
//
// `Layout` is the template the row is drawn with. It defaults to ByService,
// which selects the template from src/states/_templates corresponding to the
// row's service.
export default function CmsServicePage({ stripPrefix = "", Layout = ByService }) {
  const { pathname } = useLocation();
  const target =
    stripPrefix && pathname.startsWith(stripPrefix)
      ? pathname.slice(stripPrefix.length) || "/"
      : pathname;
  const [state, setState] = useState({ status: "loading", row: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", row: null });

    getPageByUrl(target).then((row) => {
      if (cancelled) return;
      setState(row ? { status: "ready", row } : { status: "missing", row: null });
    });

    return () => { cancelled = true; };
  }, [target]);

  // The prerenderer treats a visible MuiCircularProgress as "not ready yet" and
  // keeps waiting, so this spinner is also what makes the build wait for the row
  // instead of snapshotting an empty shell.
  if (state.status === "loading") {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // A published row is missing. Render nothing rather than an empty chrome-only
  // page: the prerenderer's h1 check then fails loudly and the build reports it,
  // which is what should happen if a URL is routed here but has no content.
  if (state.status === "missing") return null;

  const { row } = state;

  // A page's content has one of two shapes, and both have to render:
  //
  //   servicelayout/v1 — the structured section object the 224 extracted pages
  //                      carry. Spread straight into the template.
  //   html | plain     — a single block, which is what a document upload writes.
  //                      ServiceLayout has no section for that, so it becomes one
  //                      prose section instead.
  //
  // Without this, saving a document to a page would render nothing at all.
  if (typeof row.content === "string") {
    const body = row.content;
    const paragraphs = row.content_format === "html"
      ? null
      : body.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);

    return (
      <Layout
        service={row.service}
        seo={seoFromRow(row)}
        hero={{ titleLead: row.meta_title || "", highlight: "", breadcrumb: row.meta_title || "" }}
        cardGroups={paragraphs ? [{ paragraphs }] : undefined}
        html={paragraphs ? undefined : body}
      />
    );
  }

  // A row with no hero still has to produce an <h1>. The template no longer
  // crashes without one, but it would render a heading with no words in it —
  // and a page with an empty h1 is worse than one with a plain title, both for
  // a reader and for the prerenderer, which treats a missing h1 as a failure.
  const heroText = [row.content?.hero?.titleLead, row.content?.hero?.highlight]
    .some((t) => String(t || "").trim());
  const content = heroText
    ? row.content
    : {
      ...row.content,
      hero: {
        titleLead: row.meta_title || "",
        highlight: "",
        subtitle: row.meta_description || "",
        breadcrumb: (row.meta_title || "").slice(0, 60),
      },
    };

  // `service` is the row's, not the content's: it is what picks the per-service
  // template. Layouts that do not care about it list it in their own props and
  // drop it, so it never reaches the content object.
  return <Layout {...content} service={row.service} seo={seoFromRow(row)} />;
}
