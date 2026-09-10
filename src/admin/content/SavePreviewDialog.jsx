// Read the page back before it is written.
//
// Save used to go straight to the database: press it and the page changed, with
// the only way to see the result being to open the live URL afterwards. That is
// the wrong order for a document upload, where the whole point is that a
// heuristic decided how a Word file becomes sections — it is worth a look before
// it lands, not after.
//
// Two things are shown, because "is this right?" has two halves:
//
//   1. WHAT CHANGES — the fields that actually differ from what is stored, so a
//      one-word fix is not hidden inside a wall of unchanged copy.
//   2. HOW IT WILL LOOK — the real ServiceLayout, in preview mode, scaled to fit.
//      Same renderers, same fonts, spacing, cards and bands as the live page, so
//      this is the styling rather than an imitation of it.
//   3. THE OUTLINE — the same body as a list of sections, which answers "is
//      everything here, in order" without scrolling a whole page.
//
// ServiceLayout's `preview` prop suppresses the navbar, footer and — importantly
// — useFullSEO, which rewrites document.title and the meta tags of whatever page
// it runs on. Inside the admin screen that would be a side effect, not a preview.
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack,
  Typography, Chip, Divider, Paper, Alert, Table, TableBody, TableCell,
  TableHead, TableRow,
} from "@mui/material";
import SeoPreview from "../SeoPreview";
import { rankOf } from "../../states/_templates/sections/manifest";
import { templateFor } from "../../states/_templates";

// ServiceLayout's own render order.
// Section order comes from the manifest, so the outline in this dialog lists
// sections in the order the page will actually render them rather than in a
// second copy of the list that has to be kept in step by hand.

const META = [
  ["meta_title", "Meta Title"],
  ["meta_description", "Meta Description"],
  ["meta_keywords", "Keywords"],
  ["canonical", "Canonical URL"],
];

const rank = rankOf;

const heading = (data) => [data?.titleLead, data?.highlight].filter(Boolean).join(" ").trim();

const isSame = (a, b) => JSON.stringify(a ?? "") === JSON.stringify(b ?? "");

/* ── One block of body copy ───────────────────────────────────────────────── */

// The dispatch is deliberately identical to _ServiceLayout.jsx: `rows` is a
// table, `paragraphs` is prose, string items are a checklist, anything else is
// cards. If that rule ever changes there, this has to change with it — which is
// why it is written out rather than hidden behind a clever helper.
function Block({ data }) {
  const title = heading(data);

  const body = (() => {
    if (data?.rows) {
      const headers = data.headers || data.head || [];
      const rows = (data.rows || []).map((r) =>
        Array.isArray(r) ? { label: r[0], marks: r.slice(1) } : r);
      return (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {headers.map((h, i) => <TableCell key={i} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.label}</TableCell>
                  {(r.marks || []).map((m, j) => (
                    <TableCell key={j}>{m ? "✓" : "—"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      );
    }
    if (data?.paragraphs) {
      return data.paragraphs.map((p, i) => (
        <Typography key={i} variant="body2" sx={{ mb: 1 }}>{p}</Typography>
      ));
    }
    if (Array.isArray(data?.items)) {
      return (
        <Box component="ul" sx={{ pl: 3, m: 0 }}>
          {data.items.map((it, i) => (
            <li key={i}>
              <Typography variant="body2">
                {typeof it === "string" ? it : [it?.title, it?.desc].filter(Boolean).join(" — ")}
              </Typography>
            </li>
          ))}
        </Box>
      );
    }
    return null;
  })();

  // A section that renders no body is worth showing as such — an empty section
  // is exactly the kind of thing this dialog exists to catch.
  return (
    <Box sx={{ mb: 2.5 }}>
      {data?.overline && (
        <Typography variant="caption" sx={{ letterSpacing: 2, color: "text.secondary", display: "block" }}>
          {data.overline}
        </Typography>
      )}
      {title && <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>}
      {data?.subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{data.subtitle}</Typography>
      )}
      {body || (
        <Typography variant="caption" color="warning.main">(this section has no body copy)</Typography>
      )}
    </Box>
  );
}

/* ── A whole section of the contract ──────────────────────────────────────── */

function Section({ name, value }) {
  if (name === "hero") {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{heading(value) || "(no title)"}</Typography>
        {value?.subtitle && <Typography variant="body2" color="text.secondary">{value.subtitle}</Typography>}
        {value?.breadcrumb && (
          <Typography variant="caption" color="text.secondary">Home › {value.breadcrumb}</Typography>
        )}
      </Box>
    );
  }

  if (name === "faqs") {
    return (
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Frequently Asked Questions
        </Typography>
        {(value || []).map((f, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{f?.q}</Typography>
            <Typography variant="body2" color="text.secondary">{f?.a}</Typography>
          </Box>
        ))}
      </Box>
    );
  }

  if (name === "faqsHeading") return null;           // shown with the FAQs above
  if (Array.isArray(value)) return value.map((g, i) => <Block key={i} data={g} />);
  return <Block data={value} />;
}

/* ── The dialog ───────────────────────────────────────────────────────────── */

export default function SavePreviewDialog({ open, draft, page, busy, onConfirm, onCancel }) {
  if (!draft) return null;

  const content = draft.content && typeof draft.content === "object" ? draft.content : null;
  const sections = content
    ? Object.entries(content).filter(([k]) => k !== "order").sort((a, b) => rank(a[0]) - rank(b[0]))
    : [];

  const changed = META.filter(([k]) => !isSame(draft[k], page?.[k])).map(([, label]) => label);
  const contentChanged = !isSame(draft.content, page?.content);

  const words = JSON.stringify(content || draft.content || "")
    .replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Check this before it is saved
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Nothing has been written yet. This is {page?.url || "the page"} as it
          will read once you save.
        </Typography>

        {/* 1. What actually changes. */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>What changes</Typography>
        {changed.length === 0 && !contentChanged ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Nothing has changed. Saving will record a revision but alter no copy.
          </Alert>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 2 }}>
            {changed.map((c) => <Chip key={c} size="small" color="warning" label={c} />)}
            {contentChanged && <Chip size="small" color="warning" label="Page content" />}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 2. How it will look in search. */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>In search results</Typography>
        <SeoPreview
          title={draft.meta_title}
          description={draft.meta_description}
          canonical={draft.canonical}
        />

        <Divider sx={{ my: 2 }} />

        {/* 3. What the page will say. */}
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>What the page will say</Typography>
          <Typography variant="caption" color="text.secondary">
            {sections.length} section(s) · ~{words} words
          </Typography>
        </Stack>

        {sections.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This page has no structured sections.
            {typeof draft.content === "string" && draft.content.trim()
              ? " It will be saved as a single block of text."
              : " It will be saved with no body copy at all."}
          </Alert>
        )}

        {/* The real template, in preview mode — same renderers, same fonts,
            spacing, cards and bands the live page uses. Earlier this was a plain
            text outline, which proved the copy was right but said nothing about
            whether the page would LOOK right. Scaled down so a full page fits. */}
        {content && (
          <Paper variant="outlined" sx={{ overflow: "hidden", mb: 2 }}>
            <Box sx={{ height: 460, overflowY: "auto", overflowX: "hidden", bgcolor: "background.default" }}>
              <Box sx={{ width: "160%", transform: "scale(0.625)", transformOrigin: "top left" }}>
                {(() => {
                  const Template = templateFor(draft?.service || page?.service);
                  return <Template {...content} service={draft?.service || page?.service} preview />;
                })()}
              </Box>
            </Box>
          </Paper>
        )}

        {/* The same thing as an outline. The rendering above answers "does it
            look right"; this answers "is every section here, in order" without
            scrolling a whole page. */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Section outline
          </Typography>
          {sections.map(([name, value]) => <Section key={name} name={name} value={value} />)}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {page?.status === "published"
            ? "This page is published — saving changes what visitors read on the next deploy."
            : "This page is a draft. Saving does not publish it."}
        </Typography>
        <Button onClick={onCancel} disabled={busy}>Back to editing</Button>
        <Button variant="contained" onClick={onConfirm} disabled={busy}>
          {busy ? "Saving…" : "Save to database"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
