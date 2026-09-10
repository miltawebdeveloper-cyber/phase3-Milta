-- 002 — State Data, and the record a content cross-check needs.
--
-- Two things this adds, for two of the three panels the CMS is growing into:
--
--   states          the editorial detail behind /areas-we-serve. That listing is
--                   currently driven by a hand-written file
--                   (src/components/Location/statesData.js), so a state added in
--                   the CMS could never appear there with a description of its
--                   own. This is where a state's own copy lives.
--
--   pages.import_*  what a cross-check compares against. applyDocument deletes
--                   the uploaded file once it is parsed (deliberately — see
--                   contentService), which means today there is nothing left to
--                   check the page against. Keeping the extracted TEXT, not the
--                   file, is enough: the converter is deterministic, so the
--                   sections it produced can be recomputed from the text at any
--                   time and compared with what is on the page now.
--
-- Additive only. No existing column is altered or dropped.

begin;

/* ── State Data ───────────────────────────────────────────────────────────── */

create table if not exists public.states (
  id           uuid primary key default gen_random_uuid(),

  name         text not null,                       -- 'New York', as written
  slug         text not null,                       -- 'newyork', matches statesData keys
  country      text not null default 'us',

  -- The copy that appears on /areas-we-serve beside the state's service links.
  description  text,
  -- Anything the team needs to remember about this state that is not public.
  notes        text,

  status       text not null default 'active',

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint states_status_ck check (status in ('active', 'hidden')),
  constraint states_name_ck   check (length(btrim(name)) > 0)
);

-- Plain columns, not an expression: PostgREST's upsert names its conflict target
-- as `slug,country`, and ON CONFLICT can only match a unique index over those
-- exact columns. An index on lower(slug) would compile fine here and then fail
-- every save with "no unique or exclusion constraint matching". `slug` is
-- lowercased before it is written (stateService.slugOf), so this is already
-- case-insensitive in practice.
create unique index if not exists states_slug_key on public.states (slug, country);

-- Names are matched case-insensitively so "new york" cannot be added alongside
-- "New York". Nothing upserts on this one, so an expression index is fine.
create unique index if not exists states_name_key on public.states (lower(name), country);

comment on table  public.states             is 'State Data — the editorial record behind /areas-we-serve.';
comment on column public.states.slug        is 'Spaceless key: "New York" -> "newyork". Matches statesData.js.';
comment on column public.states.description is 'Public copy shown with the state''s service links.';

/* ── What a cross-check needs ─────────────────────────────────────────────── */

alter table public.pages
  add column if not exists import_text       text,
  add column if not exists import_source     text,
  add column if not exists imported_at       timestamptz,
  add column if not exists verified_at       timestamptz,
  add column if not exists verified_by       text,
  add column if not exists verified_hash     text,
  add column if not exists verification_note text;

comment on column public.pages.import_text   is 'Plain text of the last document applied. The cross-check baseline.';
comment on column public.pages.import_source is 'Filename of that document.';
comment on column public.pages.verified_hash is 'Hash of `content` at the moment it was marked complete. A later edit no longer matches, so the page returns to "Updated" on its own.';

-- Status is NOT stored. It is derived from these facts on read (see
-- verificationService.statusOf), because a stored status silently goes stale the
-- moment someone edits the page — which is exactly the case the panel exists to
-- catch.

create index if not exists pages_verified_at_idx on public.pages (verified_at);

/* ── Row level security ───────────────────────────────────────────────────── */

alter table public.states enable row level security;

-- The public site reads state descriptions for /areas-we-serve; writes are
-- service-role only, exactly like `pages`.
drop policy if exists states_anon_read on public.states;
create policy states_anon_read on public.states
  for select using (status = 'active');

commit;
