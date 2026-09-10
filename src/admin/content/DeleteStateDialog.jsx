// Remove a whole state from the CMS — the most destructive action in the
// dashboard, so it opens with a warning and stays disabled until the state's
// name is typed back.
//
// Every state page and its edit history goes (page_revisions cascades with the
// row, db/001_pages.sql); the State Data editorial record goes with it. City
// pages are kept unless the box is ticked.
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert,
  Stack, TextField, CircularProgress, FormControlLabel, Checkbox, Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getStateSummary } from "./contentApi";

export default function DeleteStateDialog({ open, target, busy, error, onConfirm, onCancel }) {
  const slug = target?.slug;
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [typed, setTyped] = useState("");
  const [alsoCities, setAlsoCities] = useState(false);

  useEffect(() => {
    if (!open || !slug) return undefined;
    let cancelled = false;
    setSummary(null); setLoadError(null); setTyped(""); setAlsoCities(false);
    getStateSummary(slug)
      .then((r) => { if (!cancelled) setSummary(r); })
      .catch((e) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, [open, slug]);

  if (!target) return null;

  const label = summary?.name || target.name || slug;
  const confirmed = typed.trim().toLowerCase() === String(label).trim().toLowerCase();
  const nothing = summary && summary.statePages === 0 && !summary.hasData
    && (summary.cityPages === 0 || !alsoCities);

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="error" /> Remove {label} entirely?
      </DialogTitle>

      <DialogContent>
        {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

        {!summary && !loadError && (
          <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={24} /></Stack>
        )}

        {summary && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              This permanently deletes the whole <strong>{label}</strong> state from the
              CMS. It cannot be undone — deleted pages leave no revision to restore from.
            </Alert>

            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
              This will remove:
            </Typography>
            <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3 }}>
              <li>
                <strong>{summary.statePages}</strong> state page
                {summary.statePages === 1 ? "" : "s"}
                {summary.statePagesPublished > 0 && (
                  <> — <strong>{summary.statePagesPublished}</strong> published, which drop
                  off the live site on the next deploy</>
                )}
              </li>
              <li>
                {summary.hasData
                  ? "the State Data record (description, notes)"
                  : "no State Data record — none exists for this state"}
              </li>
              {summary.cityPages > 0 && (
                <li>
                  <strong>{summary.cityPages}</strong> city page
                  {summary.cityPages === 1 ? "" : "s"} in this state —
                  {alsoCities ? " included below" : " kept unless you tick the box below"}
                </li>
              )}
            </Box>

            {summary.cityPages > 0 && (
              <FormControlLabel
                sx={{ display: "block", mb: 1 }}
                control={(
                  <Checkbox
                    checked={alsoCities}
                    disabled={busy}
                    onChange={(e) => setAlsoCities(e.target.checked)}
                  />
                )}
                label={`Also delete all ${summary.cityPages} city page${summary.cityPages === 1 ? "" : "s"} in ${label}`}
              />
            )}

            {nothing ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Nothing to remove for this state.
              </Alert>
            ) : (
              <TextField
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                label={`Type “${label}” to confirm`}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={busy}
                autoComplete="off"
                autoFocus
              />
            )}

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => onConfirm({ includeCities: alsoCities })}
          disabled={busy || !summary || !confirmed || nothing}
        >
          {busy ? "Removing…" : `Remove ${label}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
