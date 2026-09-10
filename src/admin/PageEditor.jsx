// One page's edit form.
//
// Draft and published are separate states on purpose: typing in this form never
// changes the live site. You save (which writes a revision), then publish
// deliberately. The publish button reports the server's refusal verbatim when a
// row is not publishable — a Salem page has no state, and the database rejects
// publishing it rather than putting a wrong page live.
import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Stack, TextField, Button, Typography, Chip, Alert, Divider,
  CircularProgress, Snackbar, Paper, Link, List, ListItem, ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import ContentEditor from "./ContentEditor";
import SeoPreview from "./SeoPreview";
import DocumentImport from "./DocumentImport";
import {
  getPage, savePage, publishPage, unpublishPage, getRevisions, revertPage,
} from "./api";

const META_FIELDS = [
  ["meta_title", "Meta title"],
  ["meta_description", "Meta description"],
  ["meta_keywords", "Keywords"],
  ["canonical", "Canonical URL"],
];

export default function PageEditor({ id, onBack }) {
  const [page, setPage] = useState(null);
  const [draft, setDraft] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const { page: row } = await getPage(id);
      setPage(row);
      setDraft(row);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const dirty =
    draft && page && JSON.stringify(draft) !== JSON.stringify(page);

  // Warn on navigating away mid-edit. Losing a rewritten page description to a
  // stray back-button is a genuinely costly mistake.
  useEffect(() => {
    if (!dirty) return undefined;
    const onLeave = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  const run = async (fn, okMessage) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res?.page) { setPage(res.page); setDraft(res.page); }
      setToast(okMessage);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () =>
    run(() => savePage(id, {
      meta_title: draft.meta_title,
      meta_description: draft.meta_description,
      meta_keywords: draft.meta_keywords,
      canonical: draft.canonical,
      state: draft.state,
      city: draft.city,
      service: draft.service,
      content: draft.content,
    }), "Saved.");

  const openHistory = async () => {
    setShowHistory((v) => !v);
    if (!showHistory) {
      try { setRevisions((await getRevisions(id)).revisions); }
      catch (e) { setError(e.message); }
    }
  };

  if (error && !page) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back to pages</Button>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Box>
    );
  }
  if (!draft) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  const published = page.status === "published";

  return (
    <Box>
      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back to pages</Button>
        <Chip
          size="small"
          label={page.status}
          color={published ? "success" : "default"}
          variant={published ? "filled" : "outlined"}
        />
        {dirty && <Chip size="small" color="warning" label="Unsaved changes" />}
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<HistoryIcon />} onClick={openHistory}>
          History
        </Button>
      </Stack>

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {page.state || page.city || "—"} · {page.service || page.kind}
      </Typography>
      <Link
        href={page.url} target="_blank" rel="noopener noreferrer"
        variant="body2" sx={{ wordBreak: "break-all" }}
      >
        {page.url}
      </Link>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        The URL is not editable here — changing it is a routing change, not a content edit.
      </Typography>

      {error && <Alert severity="error" sx={{ my: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {showHistory && (
        <Paper variant="outlined" sx={{ mt: 2, p: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Revision history</Typography>
          {revisions.length === 0 && <Typography variant="body2" color="text.secondary">No revisions yet.</Typography>}
          <List dense disablePadding>
            {revisions.map((r) => (
              <ListItem
                key={r.id}
                secondaryAction={
                  <Button
                    size="small" disabled={busy}
                    onClick={() => run(() => revertPage(id, r.id), "Reverted.")}
                  >
                    Restore
                  </Button>
                }
              >
                <ListItemText
                  primary={r.note || "edit"}
                  secondary={`${r.edited_by || "unknown"} · ${new Date(r.created_at).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Search appearance</Typography>
          {META_FIELDS.map(([key, lbl]) => (
            <TextField
              key={key}
              size="small"
              fullWidth
              label={lbl}
              multiline={key === "meta_description" || key === "meta_keywords"}
              minRows={key === "meta_description" ? 3 : key === "meta_keywords" ? 2 : undefined}
              value={draft[key] || ""}
              onChange={(e) => set(key)(e.target.value)}
            />
          ))}

          <Typography variant="subtitle1" sx={{ fontWeight: 700, pt: 1 }}>Location</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small" label="State" value={draft.state || ""}
              onChange={(e) => set("state")(e.target.value || null)}
              helperText={!draft.state ? "Required before this page can be published" : " "}
              error={!draft.state && published}
              fullWidth
            />
            <TextField
              size="small" label="City" value={draft.city || ""}
              onChange={(e) => set("city")(e.target.value || null)}
              fullWidth
            />
            <TextField
              size="small" label="Service" value={draft.service || ""}
              onChange={(e) => set("service")(e.target.value || null)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, pt: 1 }}>Page content</Typography>
          <ContentEditor content={draft.content} onChange={set("content")} />
        </Stack>

        <Box sx={{ width: { xs: "100%", lg: 420 }, flexShrink: 0, position: { lg: "sticky" }, top: { lg: 16 } }}>
          <DocumentImport
            onApplyField={(key, value) => set(key)(value)}
            onApplySection={(key, value) =>
              setDraft((d) => ({ ...d, content: { ...d.content, [key]: value } }))}
          />

          <Box sx={{ mt: 2 }} />

          <SeoPreview
            title={draft.meta_title}
            description={draft.meta_description}
            canonical={draft.canonical}
          />

          <Stack spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="contained" disabled={!dirty || busy} onClick={handleSave}
            >
              {busy ? "Working…" : "Save draft"}
            </Button>

            {published ? (
              <Button
                variant="outlined" color="inherit" disabled={busy}
                onClick={() => run(() => unpublishPage(id), "Unpublished.")}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="outlined" color="success" disabled={busy || dirty}
                onClick={() => run(() => publishPage(id), "Published.")}
              >
                Publish
              </Button>
            )}
            {!published && dirty && (
              <Typography variant="caption" color="text.secondary">
                Save your changes before publishing.
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Publishing does not rebuild the site — the page goes live on the next
              deploy.
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Snackbar
        open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </Box>
  );
}
