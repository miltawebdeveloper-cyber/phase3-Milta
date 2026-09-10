// Read a document into the form. Writes nothing.
//
// This calls the preview endpoint, not the apply endpoint: the extracted fields
// go into the editor above the Save button so they can be checked and corrected
// first. The database is only touched when Save is pressed.
import React, { useCallback, useRef, useState } from "react";
import {
  Box, Paper, Typography, LinearProgress, Alert, Stack, Chip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { previewDocument, previewDocumentFromUrl } from "./contentApi";
import LinkImportField from "./LinkImportField";

const ACCEPT = ".pdf,.docx,.xlsx,.csv,.txt,.html,.htm";
const MAX_MB = 10;

export default function DocumentDropzone({ page, onExtracted }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const read = useCallback(async (file) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is ${(file.size / 1048576).toFixed(1)} MB; the limit is ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await previewDocument(file, page?.service || "", { state: page?.state, city: page?.city });
      setResult(res);
      onExtracted?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [page?.service, page?.state, page?.city, onExtracted]);

  // Same destination as `read`, just fed by a pasted link instead of a chosen
  // file — the server fetches it and returns the identical response shape.
  const readFromUrl = useCallback(async (url) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await previewDocumentFromUrl(url, page?.service || "", { state: page?.state, city: page?.city });
      setResult(res);
      onExtracted?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [page?.service, page?.state, page?.city, onExtracted]);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Upload document</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        PDF, DOCX, XLSX, CSV, TXT or HTML, up to {MAX_MB} MB. The document is read
        into the form below — nothing is saved until you press Save.
      </Typography>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; read(f); }}
      />

      <Paper
        variant="outlined"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); read(e.dataTransfer.files?.[0]); }}
        onClick={() => !busy && inputRef.current?.click()}
        sx={{
          p: 3.5, textAlign: "center", cursor: busy ? "default" : "pointer",
          borderStyle: "dashed", borderWidth: 2,
          borderColor: dragging ? "primary.main" : "divider",
          bgcolor: dragging ? "action.hover" : "transparent",
          transition: "border-color .2s, background-color .2s",
        }}
      >
        <UploadFileIcon sx={{ fontSize: 36, color: "text.disabled", mb: 0.5 }} />
        <Typography sx={{ fontWeight: 600 }}>
          {busy ? "Reading…" : "Drag a document here, or click to choose"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Fills the form for {page.state || "—"}{page.city ? ` → ${page.city}` : ""}
          {page.service ? ` · ${page.service}` : ""}
        </Typography>
        {busy && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      <LinkImportField onFetch={readFromUrl} busy={busy} />

      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {result && (
        <Alert
          severity={result.complete ? "success" : "warning"}
          sx={{ mt: 2 }}
          onClose={() => setResult(null)}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Read <strong>{result.document}</strong> — nothing has been saved yet.
            Check the fields below, then press Save.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {result.found?.map((f) => (
              <Chip key={f} size="small" color="success" variant="outlined" label={`${f} ✓`} />
            ))}
            {result.missing?.map((f) => (
              <Chip key={f} size="small" color="warning" label={`${f} — not in document`} />
            ))}
          </Stack>
        </Alert>
      )}
    </Box>
  );
}
