// Read a .docx or .pdf and offer what it found.
//
// Nothing here writes. Every suggestion has to be applied by hand, one at a time,
// and even then it only lands in the unsaved draft — the editor still has to hit
// Save. That is deliberate: a heuristic that guesses a page's title from its
// first heading will sometimes be wrong, and being wrong must cost a click to
// undo rather than a revision to recover.
import React, { useRef, useState } from "react";
import {
  Box, Button, Paper, Stack, Typography, Alert, Chip, CircularProgress, Divider,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckIcon from "@mui/icons-material/Check";
import { ingestDocument } from "./api";

const SECTION_LABEL = {
  intro: "Intro",
  whyEssential: "Bullet list",
  faqs: "FAQs",
};

const describe = (key, value) => {
  if (key === "faqs") return `${value.length} question(s)`;
  if (value?.paragraphs) return `${value.paragraphs.length} paragraph(s)`;
  if (value?.items) return `${value.items.length} item(s)`;
  return "";
};

function Suggestion({ label, preview, onApply, applied }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{preview}</Typography>
        </Box>
        <Button
          size="small"
          variant={applied ? "text" : "outlined"}
          startIcon={applied ? <CheckIcon /> : null}
          disabled={applied}
          onClick={onApply}
        >
          {applied ? "Applied" : "Use this"}
        </Button>
      </Stack>
    </Paper>
  );
}

export default function DocumentImport({ onApplyField, onApplySection }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(new Set());

  const markApplied = (key) => setApplied((s) => new Set(s).add(key));

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    setResult(null);
    setApplied(new Set());
    try {
      setResult(await ingestDocument(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const stats = result?.stats;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Import from a document</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Word (.docx) or PDF, up to 10 MB. The file is read and then deleted — nothing
        is saved until you apply a suggestion and save the page.
      </Typography>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onPick}
        style={{ display: "none" }}
      />
      <Button
        variant="outlined"
        startIcon={busy ? <CircularProgress size={16} /> : <UploadFileIcon />}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Reading…" : "Choose file"}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 1.5 }}>
            <Chip size="small" label={`${stats.headings} heading(s)`} />
            <Chip size="small" label={`${stats.paragraphs} paragraph(s)`} />
            {stats.bullets > 0 && <Chip size="small" label={`${stats.bullets} bullet(s)`} />}
            {stats.faqs > 0 && <Chip size="small" label={`${stats.faqs} FAQ(s)`} />}
          </Stack>

          {stats.warnings?.length > 0 && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              {stats.warnings.length} formatting note(s) from the document — headings may
              not have been detected exactly as written.
            </Alert>
          )}

          <Stack spacing={1}>
            {Object.entries(result.fields || {})
              .filter(([, v]) => v)
              .map(([key, value]) => (
                <Suggestion
                  key={key}
                  label={key === "meta_title" ? "Meta title" : "Meta description"}
                  preview={value}
                  applied={applied.has(key)}
                  onApply={() => { onApplyField(key, value); markApplied(key); }}
                />
              ))}
          </Stack>

          {Object.keys(result.content || {}).length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Applying a section replaces that section entirely.
              </Typography>
              <Stack spacing={1}>
                {Object.entries(result.content).map(([key, value]) => (
                  <Suggestion
                    key={key}
                    label={SECTION_LABEL[key] || key}
                    preview={describe(key, value)}
                    applied={applied.has(`content.${key}`)}
                    onApply={() => { onApplySection(key, value); markApplied(`content.${key}`); }}
                  />
                ))}
              </Stack>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
}
