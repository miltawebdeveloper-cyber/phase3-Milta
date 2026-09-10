// Content Verification — did the update land, and is any of it missing?
//
// Separate from Content Update on purpose. Updating is "make the change";
// verifying is "prove the change is right", and the same person doing both in
// one screen tends to do neither. They meet at the page record: this panel reads
// the same rows, and hands back to the editor when something needs fixing.
//
// The list opens on what still needs attention rather than making someone click
// every page to discover it.
import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Stack, Typography, Chip, Button, Paper, Alert, LinearProgress, Divider,
  List, ListItemButton, ListItemText, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, CircularProgress, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import sectionLabel, { SECTION_LABELS } from "../sectionLabels";
import {
  listVerification, getVerification, completeVerification, reopenVerification,
  listStates,
} from "./contentApi";

const STATUS_COLOR = {
  verified: "success",
  updated: "info",
  needs_review: "warning",
  pending: "default",
};

const LABEL = {
  verified: "Completed",
  updated: "Updated",
  needs_review: "Needs review",
  pending: "Pending",
};

const StatusChip = ({ status, size = "small" }) => (
  <Chip size={size} color={STATUS_COLOR[status] || "default"} label={LABEL[status] || status} />
);

/* ── The report for one page ──────────────────────────────────────────────── */

function Report({ id, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    setError(null);
    getVerification(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const complete = async (force) => {
    setBusy(true);
    setError(null);
    try {
      await completeVerification(id, { note: note || null, force });
      await load();
      onChanged?.();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const reopen = async () => {
    setBusy(true);
    try { await reopenVerification(id); await load(); onChanged?.(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
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

  const { page, report } = data;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }} useFlexGap>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
        <StatusChip status={report.status} />
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<RefreshIcon />} onClick={load}>Re-check</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {page.state}{page.service ? ` · ${page.service}` : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary">{page.url}</Typography>

        <Stack direction="row" spacing={3} useFlexGap sx={{ mt: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Source document</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{report.source || "— none recorded —"}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Sections</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{report.totals.sections}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Points</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{report.totals.points}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Words on page</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{report.totals.contentWords}</Typography>
          </Box>
          {report.verifiedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Completed</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(report.verifiedAt).toLocaleString()} · {report.verifiedBy}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Completeness — the automatic half. */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Cross-check against the source
      </Typography>

      {!report.hasSource ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No source document is recorded for this page, so completeness cannot be
          checked automatically. Upload the document through Content Update and it
          will be cross-checked from then on. The outline below is still accurate.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {report.coverage}% of the document's words are on the page
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {report.totals.sourceWords} words in {report.source}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(report.coverage ?? 0, 100)}
            color={report.missingCount ? "warning" : "success"}
            sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
          />

          {report.missingCount === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
              Every word in the document appears on the page. Nothing is missing.
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 1 }}>
                {report.missingCount} word(s) from the document do not appear on the
                page. That usually means a section was not applied, or was edited
                away afterwards.
              </Alert>
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                {report.missing.map((m) => (
                  <Tooltip key={m.word} title={`in document ${m.inSource}× · on page ${m.onPage}×`}>
                    <Chip size="small" variant="outlined" color="warning" label={m.word} />
                  </Tooltip>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      )}

      {/* Structure — sections, headings, points, order. */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Sections, headings and order
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3, overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Renders as</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Heading</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.outline.map((s, i) => (
              <TableRow key={s.section} sx={{ bgcolor: s.points === 0 && s.kind !== "hero" ? "warning.50" : undefined }}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{sectionLabel(s.section)}</TableCell>
                {/* `kind` is the renderer the outline says will draw this block.
                    It uses the stored key for the opening section, so it reads
                    "hero" where the rest of the screen now says "Banner". */}
                <TableCell>{SECTION_LABELS[s.kind] ? SECTION_LABELS[s.kind].toLowerCase() : s.kind}</TableCell>
                <TableCell>{s.heading || <em>(none)</em>}</TableCell>
                <TableCell align="right">{s.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {report.emptySections.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {report.emptySections.length} section(s) have a heading but no content
          beneath them: {report.emptySections.map((s) => s.heading || sectionLabel(s.section)).join(", ")}.
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* The human half. */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Sign off</Typography>
      {report.status === "verified" ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Marked complete on {new Date(report.verifiedAt).toLocaleString()}.
            {report.note ? ` Note: ${report.note}` : ""}
          </Alert>
          <Button size="small" onClick={reopen} disabled={busy}>Reopen for review</Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The checks above cover completeness and structure. Whether the copy
            reads correctly is a judgement, so it ends here. Signing off records
            the content as it stands — a later edit returns this page to “Updated”
            on its own.
          </Typography>
          <TextField
            size="small" fullWidth label="Note (optional)" value={note}
            onChange={(e) => setNote(e.target.value)} sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained" disabled={busy}
              onClick={() => complete(report.missingCount > 0)}
            >
              {busy ? "Saving…" : "Mark as completed"}
            </Button>
          </Stack>
          {report.missingCount > 0 && (
            <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1 }}>
              This page still has missing content. Signing off will record that you
              accepted it anyway.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}

/* ── The list ─────────────────────────────────────────────────────────────── */

export default function VerificationSection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState("all");
  // The same state list every other picker uses, so verification is scoped by
  // the same names State Data defines rather than a second set derived here.
  const [stateNames, setStateNames] = useState([]);
  const [state, setState] = useState("");

  const load = useCallback(() => {
    setError(null);
    listVerification().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    listStates("state").then((r) => setStateNames(r.states || [])).catch(() => {});
  }, []);

  if (openId) {
    return <Report id={openId} onBack={() => { setOpenId(null); load(); }} onChanged={load} />;
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  const counts = data.pages.reduce((m, p) => {
    m[p.verification.status] = (m[p.verification.status] || 0) + 1;
    return m;
  }, {});

  const shown = data.pages
    .filter((p) => (filter === "all" ? true : p.verification.status === filter))
    .filter((p) => (state ? p.state === state : true));

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Content verification</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Every state page, checked against the document it was built from. Open one
        to see what is missing, review its sections, and mark it complete.
      </Typography>

      <TextField
        select size="small" label="State" value={state}
        onChange={(e) => setState(e.target.value)}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        sx={{ minWidth: 220, mb: 2 }}
      >
        <option value="">All states</option>
        {stateNames.map((n) => <option key={n} value={n}>{n}</option>)}
      </TextField>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 2 }}>
        {["all", "needs_review", "updated", "pending", "verified"].map((k) => (
          <Chip
            key={k}
            label={`${k === "all" ? "All" : LABEL[k]} ${k === "all" ? data.pages.length : counts[k] || 0}`}
            color={k === filter ? "primary" : "default"}
            variant={k === filter ? "filled" : "outlined"}
            onClick={() => setFilter(k)}
            size="small"
          />
        ))}
      </Stack>

      <Paper variant="outlined">
        <List disablePadding>
          {shown.map((p) => (
            <ListItemButton key={p.id} divider onClick={() => setOpenId(p.id)}>
              <ListItemText
                primary={`${p.state || "—"}${p.service ? ` · ${p.service}` : ""}`}
                secondary={p.url}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {p.verification.hasSource
                  ? (
                    <Typography variant="caption" color="text.secondary">
                      {p.verification.coverage}% covered
                    </Typography>
                  )
                  : <Typography variant="caption" color="text.secondary">no source</Typography>}
                <Typography variant="caption" color="text.secondary">
                  {p.verification.sections} sections
                </Typography>
                <StatusChip status={p.verification.status} />
              </Stack>
            </ListItemButton>
          ))}
          {!shown.length && (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">Nothing in this state.</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
}
