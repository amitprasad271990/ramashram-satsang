-- Ramashram Satsang website — database tables and security rules.
-- Applied by `npm run db:migrate`. Safe to run more than once.
--
-- Security model:
--   * Visitors (not logged in) can only READ.
--   * Only addresses listed in `admins` can add, change or delete anything.
--   * Sign-ups are switched off in Supabase, so nobody can create an account.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- (no policies: nobody can read or change this table through the website API)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- Shivir announcement lines (shown at the top of pages)
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  key        text primary key,           -- 'dehradun' / 'haridwar' (the two old texts)
  text       text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audio: collections (Bhajanmala, each Pravachan shivir, Amrit Vani) and tracks
-- ---------------------------------------------------------------------------
create table if not exists public.audio_collections (
  slug       text primary key,           -- 'bhajan', 'amrit-vani', 'kolkata-2016', …
  kind       text not null check (kind in ('bhajan', 'pravachan', 'amrit_vani')),
  heading    text not null,
  intro      text,
  sort_order int  not null default 0
);

create table if not exists public.audio_tracks (
  id               uuid primary key default gen_random_uuid(),
  collection_slug  text not null references public.audio_collections (slug) on update cascade,
  title            text not null,
  storage_key      text not null unique,  -- path of the MP3 in the R2 bucket
  sort_order       int  not null,
  duration_seconds int,
  size_bytes       bigint,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists audio_tracks_collection_idx on public.audio_tracks (collection_slug, sort_order);

-- ---------------------------------------------------------------------------
-- Photo albums (filled in Phase 4)
-- ---------------------------------------------------------------------------
create table if not exists public.photo_albums (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  album_id    uuid not null references public.photo_albums (id) on delete cascade,
  storage_key text not null unique,      -- path of the image in the R2 bucket
  width       int  not null,
  height      int  not null,
  caption     text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists photos_album_idx on public.photos (album_id, sort_order);

-- ---------------------------------------------------------------------------
-- Row-level security: public read, admin write
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['announcements', 'audio_collections', 'audio_tracks', 'photo_albums', 'photos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format(
      'create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Keep updated_at current.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists touch_announcements on public.announcements;
create trigger touch_announcements before update on public.announcements
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_audio_tracks on public.audio_tracks;
create trigger touch_audio_tracks before update on public.audio_tracks
  for each row execute function public.touch_updated_at();
