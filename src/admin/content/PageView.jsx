// One page: what it is, and the editor that changes it.
//
// Two ways in, one editor: drop a document to fill the form, or type into it
// directly. Neither touches the database — Save does, and only Save. That is
// what makes an upload safe to inspect before it lands on a live page.
//
// Save itself is two steps: it opens SavePreviewDialog, which reads the page
// back as it will be stored, and the write happens only when that is confirmed.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Stack, Typography, Chip, Link, Paper, Divider, Button, CircularProgress,
  Alert, Collapse, List, ListItem, ListItemText, Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DocumentDropzone from "./DocumentDropzone";
import ContentForm, { FIELDS } from "./ContentForm";
import SavePreviewDialog from "./SavePreviewDialog";
import DeletePageDialog from "./DeletePageDialog";
import {
  getPage, getHistory, revertPage, updatePage, publishPage, unpublishPage, deletePage,
} from "./contentApi";

const Fact = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>{children}</Typography>
  </Box>
);

// Content is carried through EXACTLY as stored — a ServiceLayout section object
// stays an object, a legacy string stays a string.
//
// This used to coerce a structured body to "" on the way in, back when the only
// editor was a textarea. Once the section editor existed that became a data-loss
// bug rather than a display one: the form never saw the sections, reported the
// page as empty, and Save posted the empty string straight over them.
const draftFrom = (page) => ({
  service: page.service ?? "",
  meta_title: page.meta_title ?? "",
  meta_description: page.meta_description ?? "",
  meta_keywords: page.meta_keywords ?? "",
  canonical: page.canonical ?? "",
  content: page.content ?? "",
  // The format has to describe the content it is stored beside; an object is
  // always servicelayout/v1, and only a string can be plain or html.
  content_format: page.content && typeof page.content === "object"
    ? "servicelayout/v1"
    : (page.content_format === "plain" ? "plain" : "html"),
});

export default function PageView({ pageId, onBack }) {
  const [page, setPage] = useState(null);
  const [draft, setDraft] = useState(null);
  const [source, setSource] = useState(null);      // last document read, if any
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");
  // Save opens this first. Writing on the button press left no moment to read
  // what a document upload had actually produced.
  const [confirming, setConfirming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const { page: row } = await getPage(pageId);
      setPage(row);
      setDraft(draftFrom(row));
      setSource(null);
    } catch (e) { setError(e.message); }
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(
    () => !!page && !!draft && JSON.stringify(draft) !== JSON.stringify(draftFrom(page)),
    [page, draft],
  );

  // Losing a rewritten page to a stray back-button is an expensive mistake.
  useEffect(() => {
    if (!dirty) return undefined;
    const onLeave = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const applyExtracted = useCallback((res) => {
    setSource(res);
    // `content` is a section object, so it cannot go through the string
    // truthiness filter the meta fields use — String({}) is "[object Object]",
    // which is truthy and would store that literal text as the page body.
    const { content, ...meta } = res.fields || {};
    setDraft((d) => ({
      ...d,
      // Only overwrite what the document actually carried. A field it did not
      // contain keeps whatever is already on the page — never blanked.
      ...Object.fromEntries(
        Object.entries(meta).filter(([, v]) => String(v ?? "").trim()),
      ),
      ...(content && (typeof content !== "object" || Object.keys(content).length)
        ? { content }
        : {}),
      content_format: res.contentFormat || d.content_format,
    }));
    // Straight to the preview. Reading a document and then hunting for Save is
    // two steps for one intention; the check still happens, it just happens now
    // rather than after another click.
    setConfirming(true);
  }, []);

  // Which fields are still empty. This is shown, not enforced: a draft may be
  // saved half-finished, the same way a document may be uploaded half-finished.
  // Publishing is where completeness is actually required, and the database
  // CHECK constraints are what enforce it — see db/001_pages.sql.
  const isBlank = (v) => (v && typeof v === "object" ? !Object.keys(v).length : !String(v ?? "").trim());
  const blank = draft
    ? [...FIELDS.map((f) => f.key), "content"].filter((k) => isBlank(draft[k]))
    : [];

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const { page: saved } = await updatePage(pageId, {
        ...draft,
        note: source ? `document: ${source.document}` : "edited in the dashboard",
      });
      setPage(saved);
      setDraft(draftFrom(saved));
      setSource(null);
      if (history) setHistory((await getHistory(pageId)).revisions);
      setToast("Page updated.");
      setConfirming(false);
    } catch (e) { setError(e.message); setConfirming(false); } finally { setBusy(false); }
  };

  // Publish/unpublish share one path so the error handling and refresh match.
  const setStatus = async (fn, message) => {
    setBusy(true);
    setError(null);
    try {
      const { page: next } = await fn(pageId);
      setPage(next);
      setDraft(draftFrom(next));
      setToast(message);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const showHistory = async () => {
    if (history) { setHistory(null); return; }
    try { setHistory((await getHistory(pageId)).revisions); }
    catch (e) { setError(e.message); }
  };

  const restore = async (revisionId) => {
    setBusy(true);
    try {
      const { page: restored } = await revertPage(pageId, revisionId);
      setPage(restored);
      setDraft(draftFrom(restored));
      setHistory((await getHistory(pageId)).revisions);
      setToast("Page restored.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  // Back to the picker on success — its list refetches on mount, so the
  // deleted page is simply gone from it rather than needing to be spliced out.
  const doDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deletePage(pageId);
      onBack();
    } catch (e) { setError(e.message); setConfirmingDelete(false); } finally { setBusy(false); }
  };

  if (error && !page) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Box>
    );
  }
  if (!page || !draft) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  const isCity = Boolean(page.city);

  return (
    <Box>
      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
        {dirty && <Chip size="small" color="warning" label="Unsaved changes" />}
        <Box sx={{ flex: 1 }} />
        <Button
          color="error"
          startIcon={<DeleteOutlineIcon />}
          disabled={busy}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete page
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isCity ? `${page.state || "—"} → ${page.city}` : (page.state || "—")}
          </Typography>
          {page.service && <Chip size="small" label={page.service} />}
          <Chip
            size="small"
            label={page.status}
            color={page.status === "published" ? "success" : "default"}
            variant={page.status === "published" ? "filled" : "outlined"}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Fact label="Page Type">{isCity ? "City" : "State"}</Fact>
          <Fact label="Page URL">
            <Link href={page.url} target="_blank" rel="noopener noreferrer">{page.url}</Link>
          </Fact>
          <Fact label="Last Updated">
            {page.updated_at ? new Date(page.updated_at).toLocaleString() : "—"}
          </Fact>
          <Fact label="Content Format">{page.content_format || "—"}</Fact>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <DocumentDropzone page={page} onExtracted={applyExtracted} />

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary">
          edit below, then save
        </Typography>
      </Divider>

      <ContentForm
        draft={draft}
        onChange={setDraft}
        missing={source?.missing || []}
      />

      <Paper
        variant="outlined"
        sx={{
          position: "sticky", bottom: 0, mt: 3, p: 2, zIndex: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={busy || !dirty}
            onClick={() => setConfirming(true)}
          >
            {busy ? "Saving…" : "Save to database"}
          </Button>
          <Button
            startIcon={<RestartAltIcon />}
            disabled={busy || !dirty}
            onClick={() => { setDraft(draftFrom(page)); setSource(null); }}
          >
            Discard changes
          </Button>

          {/* Publishing is separate from saving. A page created from a document
              starts as a draft, so this is the one action that puts it live. */}
          {page.status === "published" ? (
            <Button
              color="inherit"
              disabled={busy}
              onClick={() => setStatus(unpublishPage, "Unpublished.")}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              color="success"
              variant="outlined"
              disabled={busy || dirty}
              onClick={() => setStatus(publishPage, "Published.")}
            >
              Publish
            </Button>
          )}

          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {dirty ? "Not saved yet."
              : blank.length > 0 ? `Saved. ${blank.length} field(s) still empty — needed before publishing.`
              : "Up to date."}
          </Typography>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 3 }}>
        <Button size="small" startIcon={<HistoryIcon />} onClick={showHistory}>
          {history ? "Hide history" : "Update history"}
        </Button>
      </Stack>

      <Collapse in={!!history} unmountOnExit>
        <Paper variant="outlined" sx={{ mt: 2, p: 1.5 }}>
          {history?.length === 0 && (
            <Typography variant="body2" color="text.secondary">No updates recorded yet.</Typography>
          )}
          <List dense disablePadding>
            {(history || []).map((r) => (
              <ListItem
                key={r.id}
                secondaryAction={
                  <Button size="small" disabled={busy} onClick={() => restore(r.id)}>Restore</Button>
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
      </Collapse>

      <SavePreviewDialog
        open={confirming}
        draft={draft}
        page={page}
        busy={busy}
        onConfirm={save}
        onCancel={() => setConfirming(false)}
      />

      <DeletePageDialog
        open={confirmingDelete}
        page={page}
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      <Snackbar
        open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </Box>
  );
}
