// A second way to bring a document in: paste a link instead of choosing a
// file. Shared by DocumentDropzone (update an existing page) and NewPageDialog
// (create one), so both read a Google Doc or a direct file URL the same way.
//
// This component only collects the link and hands it to the caller — it has no
// idea how to fetch one. The caller already owns busy/error/result state for
// the file path, and a pasted link produces the exact same response shape, so
// it is simplest for the caller to run it through that same state rather than
// this component keeping a second copy.
import React, { useState } from "react";
import { Box, Stack, TextField, Button, Link } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";

export default function LinkImportField({ onFetch, busy, disabled, sx }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const url = value.trim();
    if (!url || busy || disabled) return;
    onFetch(url);
  };

  if (!open) {
    return (
      <Box sx={{ mt: 1.5, textAlign: "center", ...sx }}>
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="hover"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
          <LinkIcon sx={{ fontSize: 16 }} /> or paste a document link
        </Link>
      </Box>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      onClick={(e) => e.stopPropagation()}
      sx={{ mt: 1.5, alignItems: "flex-start", ...sx }}
    >
      <TextField
        size="small"
        fullWidth
        autoFocus
        placeholder="Google Docs share link, or a direct file URL"
        value={value}
        disabled={busy || disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
        helperText='A Google Doc must be shared as "Anyone with the link can view."'
      />
      <Button
        variant="outlined"
        size="small"
        onClick={submit}
        disabled={busy || disabled || !value.trim()}
        sx={{ flexShrink: 0, mt: 0.25 }}
      >
        {busy ? "Fetching…" : "Fetch"}
      </Button>
    </Stack>
  );
}
