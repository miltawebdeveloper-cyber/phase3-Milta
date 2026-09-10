// Reuse a section design that already exists on the site.
//
// "Add a section" starts from an empty object, which means rebuilding a design
// the site already has — the main card layout appears on 397 pages, and getting
// its eyebrow, background, column count and icons right by hand is fiddly and
// easy to get subtly wrong. This lists the designs actually in use and drops one
// in, ready to type into.
//
// The words are NOT copied. Lifting Texas's paragraphs into Colorado would put
// identical copy on two indexed URLs, and on a site whose whole purpose is
// per-state search visibility that is the one thing worth protecting against. So
// this hands over the shape: the right number of empty slots, with the icons and
// the eyebrow already set.
import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField,
  Typography, Chip, Box, List, ListItemButton, ListItemText, CircularProgress,
  Alert, Divider,
} from "@mui/material";
import { listSectionLibrary } from "./contentApi";
import sectionLabel from "../sectionLabels";

const KIND_LABEL = {
  cards: "Cards — icon, title, description",
  prose: "Prose — heading and paragraphs",
  checklist: "Checklist — short labelled points",
  table: "Comparison table — ticks and dashes",
};

export default function ReuseSectionDialog({ open, onClose, onInsert }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);

  const load = useCallback(() => {
    setError(null);
    listSectionLibrary({ limit: 80 }).then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);
  useEffect(() => { if (!open) { setPicked(null); setQ(""); } }, [open]);

  const shown = (data?.designs || []).filter((d) =>
    [d.section, d.kind, d.overline, d.example].join(" ").toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: 700 }}>Reuse a section</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Designs already in use across the site. Picking one adds its
          <strong> layout </strong>— the eyebrow, background, column count, icons
          and the right number of empty slots. The text is not copied, so the same
          words never end up on two pages.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          size="small" fullWidth placeholder="Search by section, style or heading"
          value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 2 }}
        />

        {!data && !error && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        )}

        {data && (
          <>
            <Typography variant="caption" color="text.secondary">
              {data.total} designs in use across {data.scanned} pages
            </Typography>
            <List disablePadding sx={{ mt: 1, maxHeight: 380, overflowY: "auto" }}>
              {shown.map((d) => (
                <ListItemButton
                  key={d.id}
                  divider
                  selected={picked?.id === d.id}
                  onClick={() => setPicked(d)}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                        <Typography sx={{ fontWeight: 600 }}>{sectionLabel(d.section)}</Typography>
                        {d.overline && <Chip size="small" label={d.overline} />}
                        <Chip size="small" variant="outlined" label={`${d.size} slot(s)`} />
                      </Stack>
                    }
                    secondary={`${KIND_LABEL[d.kind] || d.kind} · used on ${d.count} page(s) · e.g. “${d.example || "—"}”`}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              ))}
              {!shown.length && (
                <Box sx={{ p: 3 }}>
                  <Typography color="text.secondary">Nothing matches that.</Typography>
                </Box>
              )}
            </List>
          </>
        )}

        {picked && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              What will be added
            </Typography>
            <Alert severity="info">
              A <strong>{sectionLabel(picked.section)}</strong> section
              {picked.overline ? ` with the “${picked.overline}” eyebrow` : ""}, laid out as{" "}
              {KIND_LABEL[picked.kind] || picked.kind}, with {picked.size} empty slot(s) to fill in.
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Nothing is saved until you save the page.
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!picked}
          onClick={() => { onInsert(picked); onClose(); }}
        >
          Add this section
        </Button>
      </DialogActions>
    </Dialog>
  );
}
