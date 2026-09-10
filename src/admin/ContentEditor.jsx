// Editor for a page's `content` object.
//
// The shape is heterogeneous by design — ServiceLayout takes 13 optional
// sections, `cardGroups` is an ordered list whose entries render differently
// depending on whether they carry `rows`, `paragraphs` or `items`, and city pages
// will add more. A hand-built form per section would have to be revised every
// time the contract grows, so this walks the data instead and renders a control
// per value type.
//
// Icons are the one field that is deliberately NOT free text: `content` stores a
// MUI export name, and a typo there silently renders no icon. It gets a picker
// limited to the names the registry actually knows.
import React, { useState } from "react";
import {
  Box, Stack, TextField, Typography, IconButton, Button, Paper,
  Autocomplete, Switch, FormControlLabel, Collapse,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ICONS } from "../states/_iconRegistry";
import ReuseSectionDialog from "./content/ReuseSectionDialog";
import sectionLabel from "./sectionLabels";
import {
  SECTION_KEYS, blankFor, helpForKey, rankOf,
} from "../states/_templates/sections/manifest";

const ICON_NAMES = Object.keys(ICONS).sort();

// Long-form copy needs room; a headline does not.
const isLongText = (key, value) =>
  value.length > 90 || ["a", "desc", "answer", "text", "subtitle"].includes(key);

const label = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bQ\b/, "Question")
    .replace(/\bA\b/, "Answer");

// Empty slot matching the shape of the entries already in a list, so "Add" on a
// list of {title, desc} does not produce an untyped blank the renderer chokes on.
const blankLike = (sample) => {
  if (typeof sample === "string") return "";
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.keys(sample).map((k) => [k, blankLike(sample[k])]));
  }
  return "";
};

// The field names the renderers in _ServiceLayout.jsx actually read, with a
// blank of the right TYPE for each. Offering a fixed vocabulary rather than a
// free-text key matters: `content` is read by the template, so an invented name
// is stored, saved, and then silently ignored at render time.
const FIELD_TEMPLATES = {
  overline: "", titleLead: "", highlight: "", subtitle: "", breadcrumb: "",
  ctaLabel: "", title: "", desc: "", icon: "", footnote: "", num: "", label: "",
  image: "", imageAlt: "", bg: "", placement: "", q: "", a: "", columns: 3,
  paragraphs: [""], items: [""], bullets: [""],
  headers: ["", "", ""],
  rows: [{ label: "", marks: [false, false] }],
  stats: [{ num: "", label: "" }],
  panelStats: [{ num: "", label: "" }],
};

// Add a field the renderer supports but this particular object does not carry —
// an extracted section with no `subtitle`, say. Without this the editor can only
// change values that already exist.
function AddField({ value, onChange }) {
  const [key, setKey] = useState("");
  const missing = Object.keys(FIELD_TEMPLATES).filter((k) => !(k in value));
  if (!missing.length) return null;

  const add = () => {
    if (!key) return;
    const blank = FIELD_TEMPLATES[key];
    onChange({ ...value, [key]: Array.isArray(blank) ? JSON.parse(JSON.stringify(blank)) : blank });
    setKey("");
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        select size="small" label="Add field" value={key}
        onChange={(e) => setKey(e.target.value)}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        sx={{ minWidth: 180 }}
      >
        <option value="">Choose a field…</option>
        {missing.map((k) => <option key={k} value={k}>{label(k)}</option>)}
      </TextField>
      <Button size="small" startIcon={<AddIcon />} disabled={!key} onClick={add}>Add</Button>
    </Stack>
  );
}

function Field({ path, name, value, onChange }) {
  const id = path.join(".");

  if (typeof value === "boolean") {
    return (
      <FormControlLabel
        control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} />}
        label={label(name)}
      />
    );
  }

  if (typeof value === "number") {
    return (
      <TextField
        size="small" type="number" label={label(name)} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        sx={{ maxWidth: 160 }}
      />
    );
  }

  if (typeof value === "string") {
    if (name === "icon") {
      return (
        <Autocomplete
          size="small"
          options={ICON_NAMES}
          value={value || null}
          onChange={(_, v) => onChange(v || "")}
          renderInput={(params) => (
            <TextField {...params} label="Icon" helperText="Blank renders a numbered badge instead" />
          )}
          sx={{ maxWidth: 380 }}
        />
      );
    }
    const long = isLongText(name, value);
    return (
      <TextField
        id={id}
        size="small"
        fullWidth
        multiline={long}
        minRows={long ? 3 : undefined}
        label={label(name)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (Array.isArray(value)) {
    const sample = value[0];
    return (
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {label(name)}{" "}
            <Typography component="span" variant="caption" color="text.secondary">
              ({value.length})
            </Typography>
          </Typography>
          <Button
            size="small" startIcon={<AddIcon />}
            onClick={() => onChange([...value, blankLike(sample)])}
          >
            Add
          </Button>
        </Stack>

        <Stack spacing={1.5}>
          {value.map((item, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, position: "relative" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Field
                    path={[...path, String(i)]}
                    name={typeof item === "string" ? `${label(name)} ${i + 1}` : ""}
                    value={item}
                    onChange={(v) => {
                      const next = [...value];
                      next[i] = v;
                      onChange(next);
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
          {!value.length && (
            <Typography variant="body2" color="text.secondary">Empty.</Typography>
          )}
        </Stack>
      </Box>
    );
  }

  if (value && typeof value === "object") {
    return (
      <Stack spacing={2}>
        {name && (
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label(name)}</Typography>
        )}
        {Object.entries(value).map(([k, v]) => (
          <Stack key={k} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Field
                path={[...path, k]}
                name={k}
                value={v}
                onChange={(nv) => onChange({ ...value, [k]: nv })}
              />
            </Box>
            <IconButton
              size="small"
              aria-label={`Remove ${label(k)}`}
              onClick={() => {
                const next = { ...value };
                delete next[k];
                onChange(next);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
        <AddField value={value} onChange={onChange} />
      </Stack>
    );
  }

  // null / undefined: show it rather than dropping it silently, so a section with
  // a missing value is visible instead of quietly disappearing on save.
  return (
    <TextField
      size="small" fullWidth label={`${label(name)} (empty)`} value=""
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Section({ name, value, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const count = Array.isArray(value) ? value.length : null;

  return (
    <Paper variant="outlined" sx={{ mb: 1.5 }}>
      <Stack
        direction="row" spacing={1}
        sx={{ alignItems: "center", p: 1.5, cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        <Typography sx={{ fontWeight: 700, flex: 1 }}>{sectionLabel(name)}</Typography>
        {count !== null && (
          <Typography variant="caption" color="text.secondary">{count} item(s)</Typography>
        )}
        {/* Removing a section deletes copy, so it asks once. Nothing is written
            to the database until Save either way. */}
        {confirming ? (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            <Button size="small" color="error" onClick={onRemove}>Remove</Button>
            <Button size="small" onClick={() => setConfirming(false)}>Keep</Button>
          </Stack>
        ) : (
          <IconButton
            size="small"
            aria-label={`Remove ${sectionLabel(name)} section`}
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ p: 2, pt: 0 }}>
          {name === "cardGroups" && (
            <AddCardGroup onAdd={(entry) => onChange([...(value || []), entry])} />
          )}
          <Field path={[name]} name="" value={value} onChange={onChange} />
        </Box>
      </Collapse>
    </Paper>
  );
}

// cardGroups holds four different kinds of block, so the generic array "Add"
// cannot know what to create — especially when the list is empty and there is no
// existing entry to copy the shape from.
function AddCardGroup({ onAdd }) {
  const [kind, setKind] = useState("prose");
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        select size="small" label="Block type" value={kind}
        onChange={(e) => setKind(e.target.value)}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        sx={{ minWidth: 170 }}
      >
        {Object.entries(CARD_GROUP_KINDS).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </TextField>
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => onAdd(CARD_GROUP_KINDS[kind].make())}
      >
        Add block
      </Button>
    </Stack>
  );
}

// The order ServiceLayout renders sections in. Object key order comes from
// however the extractor happened to write the JSON, which puts Faqs above Hero
// on some pages — confusing when you are editing a page top to bottom. Anything
// not listed keeps its natural position at the end.
// The order, the blanks "Add section" inserts, and the help text beside them all
// come from the section manifest — the same file the render planner and the
// section registry read. They used to be written out here as three separate
// maps, and they drifted: the editor offered a `solutions` card a `bullets`
// field that no renderer drew, so the copy typed into it never reached the page.
// Adding a section is now one entry in the manifest rather than an edit in six
// files.

// cardGroups is one ordered list holding four different kinds of block, and
// ServiceLayout picks the renderer from the SHAPE of each entry. Adding a blank
// object would render as an empty card group, so the kind is chosen up front and
// the entry is created with the fields that select that renderer.
const CARD_GROUP_KINDS = {
  prose: { label: "Prose", make: () => ({ titleLead: "", highlight: "", paragraphs: [""] }) },
  checklist: { label: "Checklist", make: () => ({ titleLead: "", highlight: "", items: [""] }) },
  cards: {
    label: "Cards",
    make: () => ({ titleLead: "", highlight: "", items: [{ icon: "", title: "", desc: "", bullets: [""] }] }),
  },
  table: {
    label: "Comparison table",
    make: () => ({ titleLead: "", highlight: "", headers: ["", "", ""], rows: [{ label: "", marks: [false, false] }] }),
  },
};

export default function ContentEditor({ content, onChange }) {
  const [adding, setAdding] = useState("");
  const [reusing, setReusing] = useState(false);
  const rank = rankOf;
  // `order` is the page.s render plan, not a section: it holds section NAMES, so
  // walking it here would draw an editable list of strings that an editor could
  // break the page order by retyping. It is preserved on save because unknown
  // keys are spread through untouched.
  const entries = Object.entries(content || {})
    .filter(([k]) => k !== "order")
    .sort((a, b) => rank(a[0]) - rank(b[0]));

  // Only sections the page does not already have. Re-adding one would replace
  // the copy that is in it.
  const available = SECTION_KEYS.filter((k) => !(k in (content || {})));

  const addSection = (key) => {
    if (!key) return;
    const blank = blankFor(key);
    if (blank === null) return;
    onChange({ ...content, [key]: blank });
    setAdding("");
  };

  // Drop a design from the library in. A section the page does not have yet
  // takes its own slot; one it already has is appended to cardGroups, because
  // ServiceLayout renders a single `industries` but any number of card groups.
  const reuseSection = (design) => {
    if (!design?.blank) return;
    const node = JSON.parse(JSON.stringify(design.blank));
    const key = design.section;

    if (key === "cardGroups" || key in (content || {})) {
      onChange({ ...content, cardGroups: [...(content?.cardGroups || []), node] });
      return;
    }
    onChange({ ...content, [key]: Array.isArray(blankFor(key)) ? [node] : node });
  };

  const removeSection = (key) => {
    const next = { ...content };
    delete next[key];
    onChange(next);
  };

  return (
    <Box>
      {entries.length === 0 && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          This page has no body content yet. Add a section below, or upload a
          document to fill it in.
        </Typography>
      )}

      {entries.map(([key, value]) => (
        <Section
          key={key}
          name={key}
          value={value}
          onChange={(v) => onChange({ ...content, [key]: v })}
          onRemove={() => removeSection(key)}
        />
      ))}

      {/* Every section ServiceLayout renders, addable by hand. A page built from
          a document gets hero, body blocks and FAQs; anything else it needs —
          an intro, a comparison table, a closing block — is added here. */}
      {/* Reuse is offered first and always, because starting from a design the
          site already uses is nearly always better than building one from an
          empty object — and it is available even when every section key is
          taken, since a card group can be added any number of times. */}
      <Paper variant="outlined" sx={{ p: 2, mt: 1, borderStyle: "dashed" }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Reuse a section
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Copy the layout of a section already used on the site — its eyebrow,
              icons and slots. The text is not copied.
            </Typography>
          </Box>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setReusing(true)}>
            Browse designs
          </Button>
        </Stack>
      </Paper>

      <ReuseSectionDialog
        open={reusing}
        onClose={() => setReusing(false)}
        onInsert={reuseSection}
      />

      {available.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 1, borderStyle: "dashed" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Add a section
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              select size="small" label="Section" value={adding}
              onChange={(e) => setAdding(e.target.value)}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              sx={{ minWidth: 220 }}
            >
              <option value="">Choose a section…</option>
              {available.map((k) => (
                <option key={k} value={k}>{sectionLabel(k)}</option>
              ))}
            </TextField>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              disabled={!adding}
              onClick={() => addSection(adding)}
            >
              Add
            </Button>
            {adding && (
              <Typography variant="caption" color="text.secondary">
                {helpForKey(adding)}
              </Typography>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
