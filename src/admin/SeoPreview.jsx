// What the page looks like in a search result.
//
// The point is the truncation: Google cuts titles near 60 characters and
// descriptions near 155, and an editor writing a 90-character title has no way to
// know it will be clipped unless something shows them. The counters turn amber
// past the limit rather than blocking — these are guidelines, not rules.
import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

const TITLE_LIMIT = 60;
const DESC_LIMIT = 155;

const Counter = ({ value = "", limit }) => {
  const n = (value || "").length;
  const over = n > limit;
  return (
    <Typography
      variant="caption"
      sx={{ color: over ? "warning.main" : "text.secondary", fontVariantNumeric: "tabular-nums" }}
    >
      {n}/{limit}{over ? " — will be truncated" : ""}
    </Typography>
  );
};

const clip = (s, n) => ((s || "").length > n ? `${s.slice(0, n - 1)}…` : s || "");

export default function SeoPreview({ title, description, canonical }) {
  let display = canonical || "";
  try {
    const u = new URL(canonical);
    display = `${u.hostname.replace(/^www\./, "")} › ${u.pathname.replace(/^\/|\/$/g, "").split("/").join(" › ")}`;
  } catch { /* not a full URL yet while typing */ }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Search result preview</Typography>

      <Box sx={{ mt: 1.5, maxWidth: 600 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} noWrap>
          {display || "No canonical URL set"}
        </Typography>
        <Typography
          sx={{ color: "#1a0dab", fontSize: "1.15rem", lineHeight: 1.3, mt: 0.25 }}
        >
          {clip(title, TITLE_LIMIT) || "Untitled page"}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.55, mt: 0.5 }}>
          {clip(description, DESC_LIMIT) || "No meta description set."}
        </Typography>
      </Box>

      <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
        <Counter value={title} limit={TITLE_LIMIT} />
        <Counter value={description} limit={DESC_LIMIT} />
      </Stack>
    </Paper>
  );
}
