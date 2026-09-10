-- ============================================================================
-- Phase 1 — the `pages` table
--
-- One table for every editable page on the site, discriminated by page_type.
-- Not three tables: a city page, a state service page and a blog differ only in
-- which identity columns are filled, and every one of them needs the same meta
-- fields and the same editor.
--
-- The `content` column mirrors the prop contract of src/states/_ServiceLayout.jsx
-- as it stands today:
--
--   ServiceLayout({ seo, hero, intro, prose, whyEssential, solutions,
--                   cardGroups, checklists, comparisonTable, advantages,
--                   industries, closing, faqs })
--
-- `seo` is lifted out into real columns (below) because those are the fields the
-- CMS filters, sorts and bulk-edits on. Everything else stays as JSONB in
-- `content`, in the same shape the layout already accepts — so Phase 2's template
-- is `<ServiceLayout {...row.content} />` and nothing has to be re-modelled.
--
-- Apply by pasting this file into the Supabase SQL editor (Dashboard -> SQL
-- Editor -> New query -> Run). It creates two new tables and touches nothing
-- that already exists; `npm run verify:blogs` checks that afterwards.
-- ============================================================================

create extension if not exists pg_trgm;

-- ── Enums ────────────────────────────────────────────────────────────────────

-- Deliberately distinctive names. `page_type` / `page_status` are generic enough
-- that another object could already own them, and because the block below
-- swallows duplicate_object, a pre-existing type of the same name would be reused
-- silently — with whatever values it happened to have.
do $$ begin
  create type cms_page_kind as enum ('service_state', 'service_city', 'service', 'state', 'city', 'blog');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cms_page_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;


-- ── pages ────────────────────────────────────────────────────────────────────

create table if not exists public.pages (
  id               uuid primary key default gen_random_uuid(),

  -- Identity. Which of these are non-null depends on kind.
  kind             cms_page_kind   not null,
  country          text        not null default 'us',   -- 'us' | 'uk'
  state            text,                                -- 'Texas'
  city             text,                                -- 'Dallas' (null for state pages)
  service          text,                                -- 'Bookkeeping' | 'Tax' | ...

  -- Addressing. `url` is the full site path and is the join key back to the
  -- router and the sitemap; `slug` is its last segment, kept for search.
  url              text        not null,
  slug             text        not null,

  -- SEO. Real columns, not JSON: these are what the admin screen edits, what
  -- check-seo.mjs validates, and what a bulk edit touches.
  meta_title       text,
  meta_description text,
  meta_keywords    text,
  canonical        text,
  author           text        not null default 'Milta Accounting',
  robots           text        not null default 'index, follow',
  og_title         text,
  og_description   text,
  og_image         text,

  -- Body. Section object matching the ServiceLayout prop contract.
  content          jsonb       not null default '{}'::jsonb,
  content_format   text        not null default 'servicelayout/v1',

  status           cms_page_status not null default 'draft',

  -- Provenance, so a re-run of the extractor can tell what it wrote from what a
  -- human has since edited. Cleared on the first manual save.
  source_file      text,
  extracted_at     timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint pages_url_key unique (url),
  constraint pages_url_leading_slash check (url like '/%'),

  -- Identity rules gate PUBLISHING, not drafting. A draft is work in progress and
  -- is allowed to be incomplete — the extractor deliberately writes rows it could
  -- not fully resolve (src/states/Salem/*, whose copy never names a state) as
  -- drafts rather than guessing. Nothing incomplete can reach the live site.
  constraint pages_service_state_identity check (
    status <> 'published' or kind <> 'service_state'
    or (state is not null and service is not null)
  ),
  constraint pages_service_city_identity check (
    status <> 'published' or kind <> 'service_city'
    or (state is not null and city is not null and service is not null)
  )
);

comment on table  public.pages          is 'Every editable page. One row per URL.';
comment on column public.pages.content  is 'Section object; shape is given by content_format.';
comment on column public.pages.url      is 'Full site path with leading slash, e.g. /us/services/best-bookkeeping-services-in-texas/';


-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Without these the admin search degrades badly somewhere in the low tens of
-- thousands of rows, which is well inside the target for city pages.

create index if not exists pages_kind_status_idx on public.pages (kind, status);
create index if not exists pages_state_service_idx on public.pages (state, service);
create index if not exists pages_city_idx on public.pages (city) where city is not null;
create index if not exists pages_slug_idx on public.pages (slug);
create index if not exists pages_updated_idx on public.pages (updated_at desc);

-- Trigram indexes back the "search Dallas" box: ILIKE '%dallas%' cannot use a
-- btree index, and at 800K rows a sequential scan on every keystroke is the
-- difference between a usable admin screen and an unusable one.
create index if not exists pages_city_trgm_idx  on public.pages using gin (city gin_trgm_ops);
create index if not exists pages_title_trgm_idx on public.pages using gin (meta_title gin_trgm_ops);


-- ── Revisions ────────────────────────────────────────────────────────────────
-- Your undo when a bad bulk edit lands on live pages. Written by the API on
-- every save, before the update is applied.

create table if not exists public.page_revisions (
  id          bigserial primary key,
  page_id     uuid not null references public.pages(id) on delete cascade,
  snapshot    jsonb not null,           -- the whole row as it was, pre-edit
  edited_by   text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists page_revisions_page_idx on public.page_revisions (page_id, created_at desc);


-- ── updated_at ───────────────────────────────────────────────────────────────

-- Named for this table specifically, NOT a generic touch_updated_at(). This is
-- the one statement in the file that is not scoped to the new tables: CREATE OR
-- REPLACE FUNCTION overwrites a same-named function wherever it lives, so a
-- generic name would silently redefine a helper that another table's trigger
-- already depends on. With this name there is nothing to collide with.
create or replace function public.pages_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists pages_touch_updated_at on public.pages;
create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute function public.pages_set_updated_at();


-- ── Row level security ───────────────────────────────────────────────────────
-- The browser reads with the anon key and must only ever see published rows.
-- All writes go through the Express API using the service key, which bypasses
-- RLS — so there is deliberately no insert/update policy for anon here.

-- Supabase's default privileges usually cover new public tables, but spelling the
-- grants out means this migration does not depend on how the project was set up.
grant select on public.pages to anon, authenticated;
grant all on public.pages to service_role;
grant all on public.page_revisions to service_role;
grant usage, select on sequence public.page_revisions_id_seq to service_role;

alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;

drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages
  for select using (status = 'published');

-- Revisions are never public.
drop policy if exists page_revisions_no_public on public.page_revisions;
create policy page_revisions_no_public on public.page_revisions
  for select using (false);
