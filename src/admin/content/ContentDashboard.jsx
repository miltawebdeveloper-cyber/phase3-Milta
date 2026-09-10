// CONTENT UPDATE — the dashboard.
//
//   State:  type → state → page → upload
//   City:   type → state → city → page → upload
//
// State and city are never mixed: the type chosen at step one filters every
// query after it, so a city page can never be reached from the state flow.
//
// Nothing here loads a full list of cities. The state comes from a short list of
// states that actually have pages, and cities are searched on the server with a
// capped result set — the browser never holds more than one page of rows.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Paper, Stack, Typography, TextField, MenuItem, List, ListItemButton,
  ListItemText, ListItemIcon, Checkbox, Button, IconButton, Tooltip, Chip,
  CircularProgress, Alert, Breadcrumbs, Link, InputAdornment, Pagination,
  Divider, Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import MapIcon from "@mui/icons-material/Map";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import PageView from "./PageView";
import NewPageDialog from "./NewPageDialog";
import DeletePagesDialog from "./DeletePagesDialog";
import DeleteStateDialog from "./DeleteStateDialog";
import { listStates, listCities, listPages, deletePages, deleteState } from "./contentApi";

const slugOf = (name) => String(name || "").trim().replace(/\s+/g, "").toLowerCase();

const PAGE_SIZE = 25;

/* ── Step 1: State or City ────────────────────────────────────────────────── */

function TypeChooser({ onChoose }) {
  const card = (type, label, Icon, help) => (
    <Paper
      variant="outlined"
      onClick={() => onChoose(type)}
      sx={{
        flex: 1, minWidth: 220, p: 5, textAlign: "center", cursor: "pointer",
        transition: "border-color .2s, background-color .2s",
        "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
      }}
    >
      <Icon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{help}</Typography>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">Select page type</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
        {card("state", "STATE", MapIcon, "Update a state page")}
        {card("city", "CITY", LocationCityIcon, "Update a city page")}
      </Stack>
    </Box>
  );
}

/* ── Step 2/3: pick a location ────────────────────────────────────────────── */

function StatePicker({ pageType, value, onChange, onAddNew, onRemove, reloadKey }) {
  const [states, setStates] = useState(null);
  const [details, setDetails] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStates(null);
    listStates(pageType)
      .then((r) => { if (!cancelled) { setStates(r.states); setDetails(r.details || []); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [pageType, reloadKey]);

  // The "add" button sits above the list rather than inside the loading branch,
  // so a first page can be created even when no states exist yet.
  const addButton = (
    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAddNew}>
      Add a new {pageType} page
    </Button>
  );

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap" }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {pageType === "city" ? "Select the state the city is in" : "Select a state"}
        </Typography>
        {addButton}
      </Stack>

      {!states ? <CircularProgress size={20} /> : states.length === 0 ? (
        <Alert severity="info">
          No {pageType} pages have a state set yet. Use “Add a new {pageType} page”
          above to create the first one from a document.
        </Alert>
      ) : (
        <StateList
          states={states}
          details={details}
          q={q}
          setQ={setQ}
          value={value}
          onChange={onChange}
          onRemove={onRemove}
        />
      )}
    </Box>
  );
}

function StateList({ states, details = [], q, setQ, value, onChange, onRemove }) {
  const shown = states.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));
  const info = new Map(details.map((d) => [d.name, d]));

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Search state"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ mb: 1.5 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          },
        }}
      />
      <Paper variant="outlined" sx={{ maxHeight: 340, overflowY: "auto" }}>
        <List dense disablePadding>
          {shown.map((s) => (
            <ListItemButton key={s} selected={s === value} onClick={() => onChange(s)}>
              <ListItemText
                primary={s}
                secondary={info.get(s)?.description || null}
                secondaryTypographyProps={{ noWrap: true, variant: "caption" }}
              />
              {/* A state that exists in State Data but has no pages yet is the
                  reason this list is no longer derived from pages alone. */}
              {info.get(s) && !info.get(s).hasPages && (
                <Chip size="small" color="warning" variant="outlined" label="no pages yet" />
              )}
              {info.get(s)?.pages > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {info.get(s).pages}
                </Typography>
              )}
              {/* Whole-state removal. Stops the click so the row's own select
                  never fires — this opens its own confirmation instead. */}
              {onRemove && (
                <Tooltip title={`Remove ${s} entirely`}>
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    sx={{ ml: 1 }}
                    aria-label={`Remove ${s} entirely`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove({ slug: info.get(s)?.slug || slugOf(s), name: s });
                    }}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </ListItemButton>
          ))}
          {!shown.length && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">No state matches that.</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
}

function CityPicker({ state, value, onChange }) {
  const [cities, setCities] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  // Debounced and server-side. This is the query that must never turn into
  // "fetch every city" — the API caps what it returns.
  useEffect(() => {
    let cancelled = false;
    setCities(null);
    const t = setTimeout(() => {
      listCities(state, q)
        .then((r) => { if (!cancelled) setCities(r.cities); })
        .catch((e) => { if (!cancelled) setError(e.message); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [state, q]);

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        placeholder={`Search city in ${state}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ mb: 1.5 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          },
        }}
      />
      {!cities ? <CircularProgress size={20} /> : (
        <Paper variant="outlined" sx={{ maxHeight: 340, overflowY: "auto" }}>
          <List dense disablePadding>
            {cities.map((c) => (
              <ListItemButton key={c} selected={c === value} onClick={() => onChange(c)}>
                <ListItemText primary={c} />
              </ListItemButton>
            ))}
            {!cities.length && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {q ? "No city matches that search." : `No city pages exist for ${state} yet.`}
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
}

/* ── Step 4: pick the page ────────────────────────────────────────────────── */

// A location has one page per service, so the exact page still has to be chosen.
// That choice is what §13 calls the source of truth for the update.
//
// "Select" turns the list into a multi-select for bulk delete: every row becomes
// a checkbox instead of a link, a selection can span pages (the chosen rows are
// held by object, not just id, so the confirm dialog can show them all), and
// deleting refetches the list — dropping to the previous page if the current one
// emptied out.
//
// Two ways to select many at once: the header checkbox takes the whole result
// set (fetching the other pages when the list is paginated), and pressing on a
// row and dragging down the list paints a run of rows in or out — the first row
// decides which.
function PagePicker({ pageType, state, city, onOpen }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(null);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Map()); // id -> row summary
  const [selectingAll, setSelectingAll] = useState(false);   // fetching other pages
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  // Drag-to-select. `paint.current` is set on pointer-down over a row and holds
  // the direction ("add" | "remove") every row the pointer then crosses gets.
  const paint = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    listPages({ pageType, state, city, page, pageSize: PAGE_SIZE })
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [pageType, state, city, page, reloadKey]);

  // A new location is a new list — never carry a half-made selection into it.
  useEffect(() => { setSelecting(false); setSelected(new Map()); }, [pageType, state, city]);

  // A drag can end anywhere — off the last row, outside the list, off-window.
  // The run stops painting on release; the object lingers so the click that
  // fires next can tell a drag from a plain click and not toggle twice.
  useEffect(() => {
    const end = () => { if (paint.current) paint.current.active = false; };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const apply = (row, mode) => setSelected((prev) => {
    const next = new Map(prev);
    if (mode === "add") next.set(row.id, row); else next.delete(row.id);
    return next;
  });

  const toggle = (row) => apply(row, selected.has(row.id) ? "remove" : "add");

  // Press to arm a run; the direction is decided by the row pressed. Nothing is
  // toggled yet — a press with no drag is handled by the click that follows.
  const startPaint = (row) => {
    paint.current = { mode: selected.has(row.id) ? "remove" : "add", startId: row.id, active: true, moved: false };
  };
  const extendPaint = (row) => {
    const p = paint.current;
    if (!p || !p.active) return;
    if (!p.moved) {
      p.moved = true;
      const start = rows.find((r) => r.id === p.startId);
      if (start) apply(start, p.mode);
    }
    apply(row, p.mode);
  };
  // The pressed row. A plain press/tap/keyboard-activate toggles it here; a press
  // that turned into a drag has already been handled by extendPaint.
  const rowClick = (row) => {
    if (!selecting) { onOpen(row.id); return; }
    const dragged = paint.current?.moved;
    paint.current = null;
    if (!dragged) toggle(row);
  };

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const allSelected = total > 0 && selected.size >= total;
  const someSelected = selected.size > 0 && !allSelected;

  // Every row across every page, not just the visible one. The list is small
  // (one row per service), so paging through it to gather ids is cheap.
  const fetchAllRows = async () => {
    if (!data || data.totalPages <= 1) return rows;
    const all = [];
    for (let p = 1; p <= data.totalPages; p += 1) {
      // eslint-disable-next-line no-await-in-loop
      const r = await listPages({ pageType, state, city, page: p, pageSize: PAGE_SIZE });
      all.push(...r.rows);
    }
    return all;
  };

  const toggleAll = async () => {
    if (allSelected) { setSelected(new Map()); return; }
    setSelectingAll(true);
    setError(null);
    try {
      const all = await fetchAllRows();
      setSelected(new Map(all.map((r) => [r.id, r])));
    } catch (e) {
      setError(e.message);
    } finally {
      setSelectingAll(false);
    }
  };

  const stopSelecting = () => { setSelecting(false); setSelected(new Map()); };

  const doDelete = async () => {
    const chosen = [...selected.values()];
    setBusy(true);
    setError(null);
    try {
      const res = await deletePages(chosen.map((r) => r.id));
      setConfirming(false);
      setSelecting(false);
      setSelected(new Map());
      setToast(`Deleted ${res.deleted} page${res.deleted === 1 ? "" : "s"}.`);
      // Step back a page if this one has just emptied, otherwise refetch in place.
      const remaining = Math.max(0, (data?.total || chosen.length) - res.deleted);
      const lastPage = Math.max(1, Math.ceil(remaining / PAGE_SIZE));
      if (page > lastPage) setPage(lastPage);
      else setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e.message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress size={20} />;

  if (!data.rows.length) {
    return (
      <Alert severity="info">
        No {pageType} pages found for {city ? `${city}, ${state}` : state}.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}
      >
        {selecting && (
          <Tooltip title={allSelected ? "Clear selection" : `Select all ${total}`}>
            <Checkbox
              size="small"
              sx={{ p: 0.5 }}
              checked={allSelected}
              indeterminate={someSelected}
              disabled={busy || selectingAll}
              onChange={toggleAll}
              inputProps={{ "aria-label": `Select all ${total} pages` }}
            />
          </Tooltip>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 140 }}>
          {selectingAll
            ? "Selecting all…"
            : selecting
              ? `${selected.size} of ${total} selected`
              : `${data.total} page${data.total === 1 ? "" : "s"} — choose the one to update`}
        </Typography>

        {selecting ? (
          <>
            {selected.size > 0 && (
              <Button size="small" onClick={() => setSelected(new Map())} disabled={busy}>
                Clear
              </Button>
            )}
            <Button
              size="small"
              color="error"
              variant="contained"
              startIcon={<DeleteOutlineIcon />}
              disabled={busy || selected.size === 0}
              onClick={() => setConfirming(true)}
            >
              Delete{selected.size ? ` (${selected.size})` : ""}
            </Button>
            <Button size="small" onClick={stopSelecting} disabled={busy}>Cancel</Button>
          </>
        ) : (
          <Button
            size="small"
            startIcon={<PlaylistAddCheckIcon />}
            onClick={() => setSelecting(true)}
          >
            Select
          </Button>
        )}
      </Stack>

      {selecting && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Tip: press a row and drag down the list to select a run of pages.
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper variant="outlined">
        <List
          dense
          disablePadding
          sx={selecting ? { userSelect: "none", touchAction: "pan-y" } : undefined}
        >
          {data.rows.map((r) => (
            <ListItemButton
              key={r.id}
              divider
              selected={selecting && selected.has(r.id)}
              onClick={() => rowClick(r)}
              onPointerDown={selecting ? () => startPaint(r) : undefined}
              onPointerEnter={selecting ? () => extendPaint(r) : undefined}
            >
              {selecting && (
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox
                    edge="start"
                    tabIndex={-1}
                    disableRipple
                    readOnly
                    checked={selected.has(r.id)}
                  />
                </ListItemIcon>
              )}
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {r.service || r.meta_title || r.slug}
                    </Typography>
                    <Chip
                      size="small"
                      label={r.status}
                      color={r.status === "published" ? "success" : "default"}
                      variant={r.status === "published" ? "filled" : "outlined"}
                    />
                  </Stack>
                }
                secondary={r.url}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
      {data.totalPages > 1 && (
        <Stack sx={{ alignItems: "center", mt: 2 }}>
          <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
        </Stack>
      )}

      <DeletePagesDialog
        open={confirming}
        pages={[...selected.values()]}
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirming(false)}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </Box>
  );
}

/* ── The flow ─────────────────────────────────────────────────────────────── */

export default function ContentDashboard() {
  const [pageType, setPageType] = useState(null);
  const [state, setState] = useState(null);
  const [city, setCity] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [adding, setAdding] = useState(false);
  // Bumped after a create so the state list refetches and shows a brand-new state.
  const [reloadKey, setReloadKey] = useState(0);
  // { slug, name } of the state a removal is being confirmed for, plus its status.
  const [removingState, setRemovingState] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  const [toast, setToast] = useState("");

  const reset = useCallback((level) => {
    if (level <= 0) { setPageType(null); setState(null); setCity(null); setPageId(null); }
    else if (level === 1) { setState(null); setCity(null); setPageId(null); }
    else if (level === 2) { setCity(null); setPageId(null); }
    else setPageId(null);
  }, []);

  const removeState = async ({ includeCities }) => {
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      const res = await deleteState(removingState.slug, { includeCities });
      const parts = [`${res.statePages} state page${res.statePages === 1 ? "" : "s"}`];
      if (res.cityPages) parts.push(`${res.cityPages} city page${res.cityPages === 1 ? "" : "s"}`);
      if (res.deletedStateRow) parts.push("State Data");
      setToast(`Removed ${removingState.name} — deleted ${parts.join(", ")}.`);
      // Walk out of the state if the flow was standing inside the one just removed.
      if (state && slugOf(state) === removingState.slug) {
        setState(null); setCity(null); setPageId(null);
      }
      setRemovingState(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setRemoveError(e.message);
    } finally {
      setRemoveBusy(false);
    }
  };

  const crumb = (label, onClick) => (
    <Link component="button" type="button" underline="hover" onClick={onClick} sx={{ font: "inherit" }}>
      {label}
    </Link>
  );

  return (
    <Box>
      <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800 }}>
        Content update
      </Typography>

      <Breadcrumbs sx={{ mb: 3, mt: 0.5 }}>
        {crumb("Type", () => reset(0))}
        {pageType && crumb(pageType.toUpperCase(), () => reset(1))}
        {state && crumb(state, () => reset(2))}
        {city && crumb(city, () => reset(3))}
        {pageId && <Typography variant="body2" color="text.primary">Page</Typography>}
      </Breadcrumbs>

      {!pageType && <TypeChooser onChoose={setPageType} />}

      {pageType && !state && (
        <Box>
          <StatePicker
            pageType={pageType}
            value={state}
            onChange={setState}
            onAddNew={() => setAdding(true)}
            onRemove={setRemovingState}
            reloadKey={reloadKey}
          />
        </Box>
      )}

      {pageType === "city" && state && !city && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Select a city</Typography>
          <CityPicker state={state} value={city} onChange={setCity} />
        </Box>
      )}

      {state && !pageId && (pageType === "state" || city) && (
        <Box sx={{ mt: pageType === "city" ? 0 : 0 }}>
          <Divider sx={{ my: 3 }} />
          <PagePicker pageType={pageType} state={state} city={city} onOpen={setPageId} />
        </Box>
      )}

      {pageId && <PageView pageId={pageId} onBack={() => setPageId(null)} />}

      <NewPageDialog
        open={adding}
        pageType={pageType || "state"}
        presetState={state}
        onClose={() => setAdding(false)}
        onCreated={(created) => {
          setAdding(false);
          // Refetch the state list so a brand-new state appears in it, then walk
          // straight into the page that was just made.
          setReloadKey((k) => k + 1);
          setState(created.state);
          if (created.city) setCity(created.city);
          setPageId(created.id);
        }}
      />

      <DeleteStateDialog
        open={!!removingState}
        target={removingState}
        busy={removeBusy}
        error={removeError}
        onConfirm={removeState}
        onCancel={() => { setRemovingState(null); setRemoveError(null); }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </Box>
  );
}
