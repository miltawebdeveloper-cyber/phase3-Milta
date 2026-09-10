// State Data — the editorial record behind /areas-we-serve.
//
// A state is not a page. It has copy of its own (the description that sits beside
// its service links on the areas-we-serve listing) and it owns a set of pages,
// one per service. That listing was driven by a hand-written file, so a state
// created in the CMS appeared there with a generated description and no way to
// change it. This is where that copy lives.
//
// Separate from Content Update and Content Verification, and connected to them
// by the state itself: the pages listed here are the same rows those panels edit
// and check.
import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Stack, Typography, Chip, Button, Paper, Alert, TextField, List,
  ListItemButton, ListItemText, CircularProgress, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import { listStateData, getStateData, saveStateData, createPage } from "./contentApi";

const slugOf = (name) => String(name || "").trim().replace(/\s+/g, "").toLowerCase();

/* ── Add a state ──────────────────────────────────────────────────────────── */

// Adding a state creates the State Data record AND, optionally, its first page —
// so a new state arrives in the same shape as the existing ones rather than as an
// empty name that later has to be wired up by hand.
function AddStateDialog({ open, existing, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [service, setService] = useState("Bookkeeping");
  const [url, setUrl] = useState("");
  const [withPage, setWithPage] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const taken = existing.some((s) => slugOf(s.name) === slugOf(name));
  const canAdd = name.trim() && !taken && (!withPage || url.trim());

  const suggest = (n, svc) => {
    const s = slugOf(n);
    if (!s) return "";
    const kind = String(svc || "").toLowerCase().replace(/\s+/g, "-") || "services";
    return `/us/services/${kind}-in-${s}/`;
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { state } = await saveStateData(slugOf(name), { name: name.trim(), description });
      if (withPage) {
        await createPage({
          state: name.trim(),
          service: service.trim() || null,
          url: url.trim(),
          meta_title: `${service} in ${name.trim()}`.trim(),
          canonical: `https://www.miltafs.com${url.trim()}`,
          content: {},
          content_format: "servicelayout/v1",
        });
      }
      onAdded?.(state || { name: name.trim(), slug: slugOf(name) });
      setName(""); setDescription(""); setUrl("");
      onClose();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add a state</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Creates the state's record and, if you want, its first page. The page is
          created as a draft with the same structure as every other state page, so
          it can be filled in from a document straight away.
        </Typography>

        <Stack spacing={2}>
          <TextField
            size="small" fullWidth required label="State name" value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (withPage) setUrl(suggest(e.target.value, service));
            }}
            error={!!name && taken}
            helperText={name && taken ? "That state already exists." : "As it should read — e.g. New York."}
          />
          <TextField
            size="small" fullWidth multiline minRows={3} label="Description"
            value={description} onChange={(e) => setDescription(e.target.value)}
            helperText="The copy shown beside this state's links on the areas-we-serve page."
          />

          <Divider><Typography variant="caption" color="text.secondary">first page</Typography></Divider>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={withPage ? "contained" : "outlined"}
              onClick={() => { setWithPage(true); setUrl(suggest(name, service)); }}
            >
              Create a page too
            </Button>
            <Button
              size="small"
              variant={!withPage ? "contained" : "outlined"}
              onClick={() => setWithPage(false)}
            >
              State record only
            </Button>
          </Stack>

          {withPage && (
            <>
              <TextField
                size="small" fullWidth label="Service" value={service}
                onChange={(e) => { setService(e.target.value); setUrl(suggest(name, e.target.value)); }}
              />
              <TextField
                size="small" fullWidth required label="Page URL" value={url}
                onChange={(e) => setUrl(e.target.value)}
                helperText="Suggested from the name; edit it before creating — it cannot be changed later."
              />
            </>
          )}
        </Stack>

        {busy && <LinearProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={busy || !canAdd}>
          {busy ? "Adding…" : "Add state"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── One state ────────────────────────────────────────────────────────────── */

function StateDetail({ slug, onBack, onSaved }) {
  const [data, setData] = useState(null);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    getStateData(slug)
      .then((d) => {
        setData(d);
        setName(d.state?.name || d.pages?.[0]?.state || slug);
        setDescription(d.state?.description || "");
        setNotes(d.state?.notes || "");
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveStateData(slug, { name, description, notes });
      setSaved(true);
      onSaved?.();
      load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (error && !data) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Box>
    );
  }
  if (!data) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{name}</Typography>
        {!data.state && <Chip size="small" color="warning" label="No state record yet" />}
      </Stack>

      {!data.state && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This state is known from its pages but has no record of its own yet.
          Saving a description below creates one, and the areas-we-serve page will
          use it instead of a generated line.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>State data saved.</Alert>}

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Areas we serve — this state's entry
        </Typography>
        <Stack spacing={2}>
          <TextField size="small" fullWidth label="State name" value={name}
            onChange={(e) => setName(e.target.value)} />
          <TextField
            size="small" fullWidth multiline minRows={3} label="Description"
            value={description} onChange={(e) => setDescription(e.target.value)}
            helperText="Shown beside this state's service links on /areas-we-serve."
          />
          <TextField
            size="small" fullWidth multiline minRows={2} label="Internal notes"
            value={notes} onChange={(e) => setNotes(e.target.value)}
            helperText="Never published. For the team."
          />
          <Box>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save state data"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Pages in this state ({data.pages.length})
      </Typography>
      <Paper variant="outlined">
        <List disablePadding>
          {data.pages.map((p) => (
            <ListItemButton key={p.id} divider component="a" href={p.url} target="_blank" rel="noopener noreferrer">
              <ListItemText
                primary={p.service || p.url}
                secondary={p.url}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Stack direction="row" spacing={1}>
                {p.import_source && <Chip size="small" variant="outlined" label="imported" />}
                {p.verified_at && <Chip size="small" color="success" label="verified" />}
                <Chip size="small" color={p.status === "published" ? "success" : "default"} label={p.status} />
              </Stack>
            </ListItemButton>
          ))}
          {!data.pages.length && (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No pages yet. Add one from Content update.
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
}

/* ── The list ─────────────────────────────────────────────────────────────── */

export default function StateDataSection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openSlug, setOpenSlug] = useState(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setError(null);
    listStateData().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (openSlug) {
    return <StateDetail slug={openSlug} onBack={() => { setOpenSlug(null); load(); }} onSaved={load} />;
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  const shown = data.states.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }} useFlexGap>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>State data</Typography>
          <Typography variant="body2" color="text.secondary">
            The states shown on areas-we-serve, and the copy that appears with them.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
          Add state
        </Button>
      </Stack>

      {data.tableMissing && (
        <Alert severity="warning" sx={{ my: 2 }}>
          The <code>states</code> table does not exist yet, so descriptions cannot be
          saved. Run <code>db/002_states_and_verification.sql</code> in the Supabase
          SQL editor. States are still listed below, from their pages.
        </Alert>
      )}

      <TextField
        size="small" fullWidth placeholder="Search state" value={q}
        onChange={(e) => setQ(e.target.value)} sx={{ my: 2 }}
      />

      <Paper variant="outlined">
        <List disablePadding>
          {shown.map((s) => (
            <ListItemButton key={s.slug} divider onClick={() => setOpenSlug(s.slug)}>
              <ListItemText
                primary={s.name}
                secondary={s.description || (s.unregistered ? "No description yet" : "—")}
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{ noWrap: true }}
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {s.counts.pages} page(s)
                </Typography>
                {s.counts.verified > 0 && (
                  <Chip size="small" color="success" label={`${s.counts.verified} verified`} />
                )}
                {s.unregistered && <Chip size="small" color="warning" variant="outlined" label="no record" />}
              </Stack>
            </ListItemButton>
          ))}
          {!shown.length && (
            <Box sx={{ p: 3 }}><Typography color="text.secondary">No states match.</Typography></Box>
          )}
        </List>
      </Paper>

      <AddStateDialog
        open={adding}
        existing={data.states}
        onClose={() => setAdding(false)}
        onAdded={load}
      />
    </Box>
  );
}
