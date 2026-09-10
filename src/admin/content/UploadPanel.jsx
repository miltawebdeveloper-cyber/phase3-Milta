// Upload a document against ONE page, and report what happened.
//
// The page id comes from the selection above, never from the file. Drag and drop
// or click. No field is required — whatever the document carries is applied and
// the page keeps the rest.
import React, { useCallback, useRef, useState } from "react";
import {
  Box, Paper, Stack, Typography, Alert, AlertTitle, LinearProgress, List,
  ListItem, ListItemIcon, ListItemText, Chip, Divider,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { uploadDocument } from "./contentApi";

const ACCEPT = ".pdf,.docx,.xlsx,.csv,.txt,.html,.htm";
const MAX_MB = 10;

export default function UploadPanel({ page, onUpdated }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const send = useCallback(async (file) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is ${(file.size / 1048576).toFixed(1)} MB; the limit is ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadDocument(page.id, file);
      setResult({ ...res, file });
      if (res.updated) onUpdated?.(res.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [page.id, onUpdated]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    send(e.dataTransfer.files?.[0]);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Upload document</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        PDF, DOCX, XLSX, CSV, TXT or HTML, up to {MAX_MB} MB. Nothing is required:
        the document updates whatever it contains and the page keeps the rest. Its
        headings, lists and tables become page sections.
      </Typography>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; send(f); }}
      />

      <Paper
        variant="outlined"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        sx={{
          p: 4, textAlign: "center", cursor: busy ? "default" : "pointer",
          borderStyle: "dashed", borderWidth: 2,
          borderColor: dragging ? "primary.main" : "divider",
          bgcolor: dragging ? "action.hover" : "transparent",
          transition: "border-color .2s, background-color .2s",
        }}
      >
        <UploadFileIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
        <Typography sx={{ fontWeight: 600 }}>
          {busy ? "Processing…" : "Drag a document here, or click to choose"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Updating: {page.state || "—"}{page.city ? ` → ${page.city}` : ""}
          {page.service ? ` · ${page.service}` : ""}
        </Typography>
        {busy && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Completed */}
      {result?.updated && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setResult(null)}>
          <AlertTitle>Update completed</AlertTitle>
          <Typography variant="body2">
            {page.state}{page.city ? ` → ${page.city}` : ""} updated from <strong>{result.document}</strong>.
          </Typography>
          <List dense disablePadding sx={{ mt: 1 }}>
            {result.updatedFields.map((f) => (
              <ListItem key={f} disableGutters sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary={f} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip size="small" label={`Content format: ${result.contentFormat}`} />
            {result.updatedAt && (
              <Chip size="small" label={`Updated ${new Date(result.updatedAt).toLocaleString()}`} />
            )}
          </Stack>
        </Alert>
      )}

      {/* The only remaining refusal: the file was read but held nothing usable.
          A document that carries *some* fields is applied, so there is no
          "incomplete" state left to report. */}
      {result && result.updated === false && (
        <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setResult(null)}>
          <AlertTitle>Nothing to apply — the page was not changed</AlertTitle>
          <Typography variant="body2">
            <strong>{result.document}</strong> was read, but no title, description,
            keywords, canonical URL or body copy could be found in it. Check that the
            file is not a scanned image, then upload it again.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
