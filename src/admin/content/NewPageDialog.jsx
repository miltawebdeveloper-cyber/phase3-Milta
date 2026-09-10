// Create a new page from a document.
//
// The document supplies the content; the admin supplies the identity. Those are
// deliberately separate: a document can be uploaded to the wrong place, so the
// state and the URL — the two things that decide where the page lives — are
// always typed and shown, never taken silently from the file.
//
// The URL is pre-filled from the document's Canonical URL because that is almost
// always right, but it stays editable and visible before anything is created.
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField,
  Typography, Alert, Chip, Box, LinearProgress, Divider, Paper, Autocomplete,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { previewDocument, previewDocumentFromUrl, createPage, listStates, listServiceTemplates } from "./contentApi";
import { getFacets } from "../api";
import ContentEditor from "../ContentEditor";
import LinkImportField from "./LinkImportField";

const ACCEPT = ".pdf,.docx,.xlsx,.csv,.txt,.html,.htm";

const pathFromCanonical = (canonical) => {
  if (!canonical) return "";
  try { return new URL(canonical).pathname; } catch { return canonical.startsWith("/") ? canonical : ""; }
};

const EMPTY = {
  state: "", service: "", url: "",
  meta_title: "", meta_description: "", meta_keywords: "", canonical: "",
  content: {}, content_format: "servicelayout/v1",
};

export default function NewPageDialog({ open, pageType, presetState, onClose, onCreated }) {
  const [form, setForm] = useState({ ...EMPTY, state: presetState || "" });
  const [source, setSource] = useState(null);
  // The document itself is kept, not just what was read from it, so a change of
  // service can re-shape the preview without asking for the file again.
  const [file, setFile] = useState(null);
  // The other way to have read a document — a pasted link rather than a chosen
  // file. Mutually exclusive with `file`: only whichever was used last is kept,
  // so onService knows which one to replay.
  const [linkUrl, setLinkUrl] = useState(null);
  // Every service's template, so the structure a page will get can be named as
  // soon as a service is chosen — not only after a document has been read.
  const [templates, setTemplates] = useState([]);
  // States and services already in use, so the two pickers offer real values
  // instead of inviting a typo that splits a state across two spellings.
  const [facets, setFacets] = useState({ states: [], services: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    // States come from the same merged list every other picker uses, so a state
    // created in State Data can have its first page made here. Services still
    // come from the facets, which is the only place they exist.
    Promise.all([listStates(pageType), getFacets()])
      .then(([list, f]) => {
        if (cancelled) return;
        setFacets({ states: list.states || f.states || [], services: f.services || [] });
      })
      // A picker with no options still accepts typing, so a failed lookup
      // costs autocomplete, not the ability to create a page.
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, pageType]);

  const reset = () => {
    setForm({ ...EMPTY, state: presetState || "" });
    setSource(null);
    setFile(null);
    setLinkUrl(null);
    setError(null);
  };

  useEffect(() => {
    if (!open) return;
    // A failure here costs the banner, not the dialog — a page can still be
    // created without knowing which template it will get.
    listServiceTemplates()
      .then((r) => setTemplates(r.templates || []))
      .catch(() => setTemplates([]));
  }, [open]);

  // The chosen service shapes the preview, so changing it after a document has
  // been read has to re-read that document — otherwise the form keeps a
  // structure built for the previous service and nothing on screen says so.
  const onService = (service) => {
    setForm((f) => ({ ...f, service }));
    if (file) read(file, service);
    else if (linkUrl) readFromUrl(linkUrl, service);
  };

  // Applies whatever a preview response found, regardless of whether it came
  // from a chosen file or a pasted link.
  const applyPreview = (res) => {
    setSource(res);
    const { content, ...meta } = res.fields || {};
    setForm((f) => ({
      ...f,
      ...Object.fromEntries(
        Object.entries(meta).filter(([, v]) => String(v ?? "").trim()),
      ),
      // A structured body is kept as the object it is. Flattening it into the
      // textarea would store "[object Object]" as the page content.
      ...(content ? { content } : {}),
      content_format: res.contentFormat || f.content_format,
      // Only fill the URL if the admin has not already typed one.
      url: f.url || pathFromCanonical(res.fields?.canonical),
    }));
  };

  const read = async (chosen, serviceOverride) => {
    const file = chosen;
    if (!file) return;
    setFile(file);
    setLinkUrl(null);
    setBusy(true);
    setError(null);
    try {
      // So the preview's breadcrumb already reads "<Service> Services in
      // <State>" — createPage recomposes it from `form.state` regardless, but
      // showing the wrong thing here and the right thing after Create is its
      // own kind of confusing.
      const res = await previewDocument(file, serviceOverride ?? form.service, { state: form.state });
      applyPreview(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Same as `read`, fed by a pasted link instead — a Google Docs share link, or
  // a URL that points straight at a file.
  const readFromUrl = async (url, serviceOverride) => {
    if (!url) return;
    setLinkUrl(url);
    setFile(null);
    setBusy(true);
    setError(null);
    try {
      const res = await previewDocumentFromUrl(url, serviceOverride ?? form.service, { state: form.state });
      applyPreview(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { page } = await createPage({ ...form, source_file: source?.document || null });
      onCreated?.(page);
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // The template the chosen service will apply, if it has one.
  const template = templates.find((t) => t.service === form.service.trim()) || null;

  // What the Service picker offers: every service that has a template, plus any
  // service already in use on a page. Without the template names this list is
  // empty on a database with no service pages yet — nothing to choose, even
  // though eight templates exist.
  const serviceOptions = [...new Set([
    ...templates.map((t) => t.service),
    ...facets.services,
  ])].filter(Boolean).sort();

  const label = pageType === "city" ? "city" : "state";
  // Only what the server actually requires. A page can be created as an empty
  // draft and filled in afterwards — the database gates PUBLISHING, not drafting.
  const structured = form.content && typeof form.content === "object";
  const canCreate = !!(form.state.trim() && form.url.trim());

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add a new {label} page</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Say where the page lives, then upload the document. The page is created
          as a <strong>draft</strong> — it goes live only when you publish it.
        </Typography>

        {/* Identity on the left, the document on the right.
            
            The two are side by side on purpose. The SERVICE decides which
            template shapes the page, so it has to be visible — and settable —
            next to the upload rather than below it. Choosing the service after
            uploading used to leave the preview shaped like the document instead
            of like the service, with no sign that anything was wrong. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              1 · Where the page lives
            </Typography>

            {/* Both are pickers over what the database already uses, and both
                still accept free text: a genuinely new state or service has to
                be typeable or the CMS could only ever repeat itself. Choosing
                from the list is what keeps "New York" from arriving as
                "new york" or "NY" and splitting a state's pages across two
                names in the listing. */}
            <Stack spacing={2}>
              <Autocomplete
                freeSolo
                options={facets.states}
                value={form.state}
                onInputChange={(_, v) => setForm((f) => ({ ...f, state: v ?? "" }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small" fullWidth required label="State"
                    error={!form.state.trim()}
                    helperText={!form.state.trim() ? "Required" : "Pick one, or type a new state."}
                  />
                )}
              />
              <Autocomplete
                freeSolo
                options={serviceOptions}
                value={form.service}
                onInputChange={(_, v) => onService(v ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small" fullWidth label="Service (optional)"
                    helperText="Pick a templated service, or type a new one. Blank = a general state page."
                  />
                )}
              />
              <TextField
                size="small" fullWidth required label="Page URL"
                value={form.url} onChange={set("url")}
                error={!form.url.trim()}
                helperText={
                  form.url.trim()
                    ? "The live path for this page. It cannot be changed after creation."
                    : "Required — e.g. /us/services/best-bookkeeping-services-in-ohio/"
                }
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              2 · Upload the document
            </Typography>

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={busy}
              fullWidth
            >
              {source ? "Choose a different document" : "Choose document"}
              <input
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; read(f); }}
              />
            </Button>
            {busy && <LinearProgress sx={{ mt: 2 }} />}

            <LinkImportField onFetch={readFromUrl} busy={busy} />

            {/* Which template will shape this page. Stated before the page
                exists, because after it exists the structure is already
                decided. */}
            <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderStyle: "dashed" }}>
              {form.service.trim() ? (
                template ? (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {template.service} template
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.sections} section(s) — the document's copy is placed
                      into them, in the document's order.
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No template for “{form.service.trim()}”. The page will take the
                    document's own structure.
                  </Typography>
                )
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Choose a service to shape this page like the other pages of that
                  service.
                </Typography>
              )}
            </Paper>

            {source && (
              <Paper variant="outlined" sx={{ mt: 2, p: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Read <strong>{source.document}</strong> — nothing has been created yet.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {source.found?.map((f) => (
                    <Chip key={f} size="small" color="success" variant="outlined" label={`${f} ✓`} />
                  ))}
                  {source.missing?.map((f) => (
                    <Chip key={f} size="small" color="warning" label={`${f} — not in document`} />
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Divider sx={{ my: 2.5 }}>
          <Typography variant="caption" color="text.secondary">page content</Typography>
        </Divider>

        <Stack spacing={2}>
          <TextField
            size="small" fullWidth label="Meta Title"
            value={form.meta_title} onChange={set("meta_title")}
          />
          <TextField
            size="small" fullWidth multiline minRows={2} label="Meta Description"
            value={form.meta_description} onChange={set("meta_description")}
          />
          <TextField
            size="small" fullWidth multiline minRows={2} label="Keywords"
            value={form.meta_keywords} onChange={set("meta_keywords")}
          />
          <TextField
            size="small" fullWidth label="Canonical URL"
            value={form.canonical} onChange={set("canonical")}
          />
          {/* The same section editor the page itself uses, so a page is built
              the same way whether it is created here or edited later — and a
              new page can be given sections by hand without a document. */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Sections
            </Typography>
            {structured ? (
              <ContentEditor
                content={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
              />
            ) : (
              <TextField
                fullWidth multiline minRows={6} label={`Content (${form.content_format})`}
                value={form.content} onChange={set("content")}
                helperText="Legacy plain/HTML body. New pages normally use sections above."
                slotProps={{ input: { sx: { fontFamily: "ui-monospace, monospace", fontSize: 14 } } }}
              />
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {canCreate ? "Will be created as a draft." : "A state and a page URL are required."}
        </Typography>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={busy || !canCreate}>
          {busy ? "Creating…" : "Create page"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
