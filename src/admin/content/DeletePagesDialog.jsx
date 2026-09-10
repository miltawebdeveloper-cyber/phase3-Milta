// Confirm before a whole selection of pages is gone for good.
//
// The multi-select counterpart to DeletePageDialog. Same rule holds: delete
// leaves no revision behind (page_revisions cascades with each row, per
// db/001_pages.sql), so every page in the list is shown before the button is
// armed — nothing is removed on a count alone.
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert,
  List, ListItem, ListItemText, Box,
} from "@mui/material";

export default function DeletePagesDialog({ open, pages, busy, onConfirm, onCancel }) {
  if (!pages?.length) return null;

  const n = pages.length;
  const published = pages.filter((p) => p.status === "published").length;

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Delete {n} page{n === 1 ? "" : "s"}?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {n === 1 ? "This page" : "These pages"} and {n === 1 ? "its" : "their"} full
          edit history will be permanently removed. This cannot be undone.
        </Typography>

        <Box
          sx={{
            maxHeight: 240, overflowY: "auto", mb: published ? 2 : 0,
            border: 1, borderColor: "divider", borderRadius: 1,
          }}
        >
          <List dense disablePadding>
            {pages.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText
                  primary={p.service || p.meta_title || p.slug || p.url}
                  secondary={p.url}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {published > 0 && (
          <Alert severity="warning">
            {published === n ? (n === 1 ? "This page is" : "All of these are")
              : `${published} of ${n} are`} currently published — deleting{" "}
            {published === 1 ? "it takes it" : "them takes them"} off the live site
            on the next deploy.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={busy}>
          {busy ? "Deleting…" : `Delete ${n} page${n === 1 ? "" : "s"} permanently`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
