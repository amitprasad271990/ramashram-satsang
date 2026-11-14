-- Sadasya Shapath Patra: pledges submitted from the website form.
--
-- Security model (personal data: names, addresses, phone numbers):
--   * Visitors cannot read, change or delete anything here, and cannot insert
--     directly either: the website's server saves each form after checking it
--     (with the server-only secret key, which bypasses these rules).
--   * Only the admin can read and delete pledges.

create table if not exists public.pledges (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 200),
  address    text check (char_length(address) <= 1000),
  phone      text not null check (phone ~ '^[0-9+\- ]{7,20}$'),
  ip_hash    text,                      -- one-way hash, only used to stop repeated spam
  created_at timestamptz not null default now()
);
create index if not exists pledges_created_idx on public.pledges (created_at desc);
create index if not exists pledges_ip_idx on public.pledges (ip_hash, created_at);

alter table public.pledges enable row level security;

drop policy if exists "admin read" on public.pledges;
create policy "admin read" on public.pledges for select to authenticated using (public.is_admin());

drop policy if exists "admin delete" on public.pledges;
create policy "admin delete" on public.pledges for delete to authenticated using (public.is_admin());
