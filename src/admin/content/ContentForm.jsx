// The five fields, editable in the browser.
//
// One form serves both paths: a document upload fills it in, and it can equally
// be typed into from scratch. Either way nothing reaches the database until Save
// is pressed — this component holds a local draft and reports changes upward.
import React from "react";
import {
  Box, Stack, TextField, Typography, ToggleButton, ToggleButtonGroup,
  Paper, Chip,
} from "@mui/material";

import ContentEditor from "../ContentEditor";

export const FIELDS = [
  { key: "meta_title", label: "Meta Title", rows: 1, limit: 60 },
  { key: "meta_description", label: "Meta Description", rows: 3, limit: 155 },
  { key: "meta_keywords", label: "Keywords", rows: 2 },
  { key: "canonical", label: "Canonical URL", rows: 1 },
];

// Structured content is the ServiceLayout section object — what uploads now
// produce and what all 224 extracted pages carry. It routes to the section
// editor; only a legacy plain/HTML string falls through to the textarea.
export const isStructured = (content) =>
  !!content && typeof content === "object" && !Array.isArray(content);

const Counter = ({ value, limit }) => {
  if (!limit) return null;
  const n = (value || "").length;
  return (
    <Typography
      variant="caption"
      sx={{ color: n > limit ? "warning.main" : "text.secondary", fontVariantNumeric: "tabular-nums" }}
    >
      {n}/{limit}{n > limit ? " — will be truncated in search results" : ""}
    </Typography>
  );
};

export default function ContentForm({ draft, onChange, missing = [] }) {
  const set = (key) => (value) => onChange({ ...draft, [key]: value });
  const structured = isStructured(draft.content);

  return (
    <Box>
      <Stack spacing={2.5}>
        {FIELDS.map(({ key, label, rows, limit }) => {
          const empty = !String(draft[key] ?? "").trim();
          return (
            <Box key={key}>
              <TextField
                size="small"
                fullWidth
                label={label}
                multiline={rows > 1}
                minRows={rows > 1 ? rows : undefined}
                value={draft[key] ?? ""}
                onChange={(e) => set(key)(e.target.value)}
                error={empty}
                helperText={empty ? `${label} is empty — fill it in before saving.` : " "}
              />
              <Counter value={draft[key]} limit={limit} />
            </Box>
          );
        })}

        <Box>
          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Content</Typography>
            {!structured && <ToggleButtonGroup
              size="small"
              exclusive
              value={draft.content_format === "html" ? "html" : "plain"}
              onChange={(_, v) => v && set("content_format")(v)}
            >
              <ToggleButton value="plain">Plain</ToggleButton>
              <ToggleButton value="html">HTML</ToggleButton>
            </ToggleButtonGroup>}
            <Typography variant="caption" color="text.secondary">
              {structured
                ? "Sections render through the same template as every other page."
                : "Stored exactly as written — nothing is converted between the two."}
            </Typography>
          </Stack>

          {structured ? (
            // Structured content gets the section editor, not a textarea. Uploads
            // now produce hero/sections/FAQs, so this is the ordinary case rather
            // than the exception — and editing it as text would flatten a page
            // back into one undifferentiated block.
            <ContentEditor content={draft.content} onChange={set("content")} />
          ) : (
            <TextField
              fullWidth
              multiline
              minRows={12}
              value={draft.content ?? ""}
              onChange={(e) => set("content")(e.target.value)}
              helperText={
                !String(draft.content ?? "").trim()
                  ? "Empty. A page can be saved empty and filled in later; publishing is what requires content."
                  : " "
              }
              slotProps={{
                input: {
                  sx: { fontFamily: draft.content_format === "html" ? "ui-monospace, monospace" : undefined, fontSize: 14 },
                },
              }}
            />
          )}
        </Box>
      </Stack>

      {missing.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderColor: "warning.main" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The document did not contain these — they were left as they were, so
            check them before saving:
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {missing.map((m) => <Chip key={m} size="small" color="warning" variant="outlined" label={m} />)}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
