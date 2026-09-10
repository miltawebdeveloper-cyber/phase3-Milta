// Confirm before a page is gone for good.
//
// Every other write in this dashboard leaves a revision behind — restorable
// from Update history. Delete does not: page_revisions cascades with the row
// (db/001_pages.sql), so this is the one action here with no undo.
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert,
} from "@mui/material";

export default function DeletePageDialog({ open, page, busy, onConfirm, onCancel }) {
  if (!page) return null;

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete this page?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>{page.url}</strong> and its full edit history will be permanently
          removed. This cannot be undone.
        </Typography>
        {page.status === "published" && (
          <Alert severity="warning">
            This page is currently published — deleting it takes it off the live
            site on the next deploy.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={busy}>
          {busy ? "Deleting…" : "Delete permanently"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
