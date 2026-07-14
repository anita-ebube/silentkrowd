-- ============================================================================
-- 0010_reservations.sql
-- SilentKrowd Lounge — guest reservation requests
-- ============================================================================

create table reservations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  reservation_date date not null,
  party_size text not null,
  preferred_time text not null,
  special_requests text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reservations_date_idx on reservations (reservation_date);
create index reservations_status_idx on reservations (status);
create index reservations_created_at_idx on reservations (created_at desc);

-- Allow anon inserts (guest form) and admin full access
alter table reservations enable row level security;

create policy "Anyone can insert a reservation"
  on reservations for insert
  to anon
  with check (true);

create policy "Authenticated users can view reservations"
  on reservations for select
  to authenticated
  using (true);

create policy "Authenticated users can update reservations"
  on reservations for update
  to authenticated
  using (true);

create policy "Authenticated users can delete reservations"
  on reservations for delete
  to authenticated
  using (true);
