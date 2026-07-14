-- ============================================================================
-- 0011_contact_messages.sql
-- SilentKrowd Lounge — contact form submissions
-- ============================================================================

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_read_idx on contact_messages (read);
create index contact_messages_created_at_idx on contact_messages (created_at desc);

-- Allow anon inserts (guest form) and authenticated full access (admin panel)
alter table contact_messages enable row level security;

create policy "Anyone can insert a message"
  on contact_messages for insert
  to anon
  with check (true);

create policy "Authenticated users can view messages"
  on contact_messages for select
  to authenticated
  using (true);

create policy "Authenticated users can update messages"
  on contact_messages for update
  to authenticated
  using (true);

create policy "Authenticated users can delete messages"
  on contact_messages for delete
  to authenticated
  using (true);
