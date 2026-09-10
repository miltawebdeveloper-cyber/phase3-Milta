// Browse and search pages.
//
// The flow the plan calls for: pick a type, narrow by state, search for a city,
// open one record. 800K rows never means 800K rows in the browser — the server
// paginates and this only ever holds one page of results.
import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Stack, TextField, MenuItem, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Paper, Chip, Pagination, Typography, Alert,
  CircularProgress, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { listPages, getFacets } from "./api";

const PAGE_SIZE = 25;

export default function PageList({ onOpen }) {
  const [filters, setFilters] = useState({ q: "", state: "", service: "", kind: "", status: "" });
  const [facets, setFacets] = useState({ states: [], services: [], kinds: [] });
  const [data, setData] = useState({ rows: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFacets().then(setFacets).catch((e) => setError(e.message));
  }, []);

  const fetchPage = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await listPages({ ...filters, page, pageSize: PAGE_SIZE });
      if (!signal.aborted) { setData(res); setError(null); }
    } catch (e) {
      if (!signal.aborted) setError(e.message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [filters, page]);

  // Debounced: the search box fires on every keystroke and each one is a query
  // against a table that will eventually hold hundreds of thousands of rows.
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => fetchPage(ctrl.signal), 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [fetchPage]);

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };

  const select = (key, label, options) => (
    <TextField
      select size="small" label={label} value={filters[key]} onChange={setFilter(key)}
      sx={{ minWidth: 150 }}
    >
      <MenuItem value="">All</MenuItem>
      {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
    </TextField>
  );

  return (
    <Box>
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search city, state, title or URL"
          value={filters.q}
          onChange={setFilter("q")}
          sx={{ minWidth: 280, flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
            },
          }}
        />
        {select("kind", "Type", facets.kinds)}
        {select("state", "State", facets.states)}
        {select("service", "Service", facets.services)}
        {select("status", "Status", ["published", "draft", "archived"])}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" sx={{ alignItems: "center", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {data.total} page{data.total === 1 ? "" : "s"}
        </Typography>
        {loading && <CircularProgress size={16} sx={{ ml: 1.5 }} />}
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>State</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((r) => (
              <TableRow
                key={r.id}
                hover
                onClick={() => onOpen(r.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                    {r.meta_title || <em>Untitled</em>}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {r.url}
                  </Typography>
                </TableCell>
                <TableCell>{r.state || <Typography variant="caption" color="warning.main">not set</Typography>}</TableCell>
                <TableCell>{r.city || "—"}</TableCell>
                <TableCell>{r.service || "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.status}
                    color={r.status === "published" ? "success" : "default"}
                    variant={r.status === "published" ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !data.rows.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No pages match those filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {data.totalPages > 1 && (
        <Stack sx={{ alignItems: "center", mt: 2 }}>
          <Pagination
            count={data.totalPages} page={page} onChange={(_, p) => setPage(p)}
            size="small" showFirstButton showLastButton
          />
        </Stack>
      )}
    </Box>
  );
}
