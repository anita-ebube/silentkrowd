-- ============================================================================
-- 0016_security_hardening.sql
--
-- Fixes from the security audit:
--   C1  Privilege escalation (staff -> admin) via profiles self-update policy
--   C2  Reservations / contact_messages readable & writable by ANY authenticated user
--   C3  SECURITY DEFINER functions left PUBLIC-executable via PostgREST RPC
--   H1  Staff can tamper with order money fields / fabricate refunded status
--   H3  Order tracking moved behind a rate-limited Edge Function (track-order);
--       revoke the direct RPC from anon/authenticated
--   M2  Suspended accounts lose data access (covered by C2 policy fix)
--   M4  Reservation input validation + double-confirmed-booking guard
--   M5  Complete receipts storage bucket policies (staff/admin read/write)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- C1: Stop non-admin users from promoting themselves / unsuspending themselves.
-- RLS cannot restrict which COLUMNS a user may update, so we enforce it with a
-- BEFORE UPDATE trigger: role / status / created_by may only change when the
-- caller is an active admin or the service role.
-- ----------------------------------------------------------------------------

create or replace function protect_profile_role_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.created_by is distinct from old.created_by then
    if auth.role() <> 'service_role' and not is_admin() then
      raise exception 'Only an admin may change role, status, or created_by.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role_fields before update on profiles
  for each row execute function protect_profile_role_fields();

revoke all on function protect_profile_role_fields() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- C2: Reservations — public insert (guest form), staff/admin select,
-- staff/admin update (status management), admin-only delete.
-- ----------------------------------------------------------------------------

drop policy if exists "Anyone can insert a reservation" on reservations;
drop policy if exists "Authenticated users can view reservations" on reservations;
drop policy if exists "Authenticated users can update reservations" on reservations;
drop policy if exists "Authenticated users can delete reservations" on reservations;

create policy "reservations_public_insert"
  on reservations for insert
  to anon
  with check (true);

create policy "reservations_select_staff_admin"
  on reservations for select
  using (is_staff_or_admin());

create policy "reservations_update_staff_admin"
  on reservations for update
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

create policy "reservations_delete_admin"
  on reservations for delete
  using (is_admin());

-- ----------------------------------------------------------------------------
-- C2: Contact messages — public insert (guest form), staff/admin select,
-- staff/admin update (read flag), admin-only delete.
-- ----------------------------------------------------------------------------

drop policy if exists "Anyone can insert a message" on contact_messages;
drop policy if exists "Authenticated users can view messages" on contact_messages;
drop policy if exists "Authenticated users can update messages" on contact_messages;
drop policy if exists "Authenticated users can delete messages" on contact_messages;

create policy "contact_messages_public_insert"
  on contact_messages for insert
  to anon
  with check (true);

create policy "contact_messages_select_staff_admin"
  on contact_messages for select
  using (is_staff_or_admin());

create policy "contact_messages_update_staff_admin"
  on contact_messages for update
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

create policy "contact_messages_delete_admin"
  on contact_messages for delete
  using (is_admin());

-- ----------------------------------------------------------------------------
-- C3: Revoke PUBLIC/anon/authenticated EXECUTE on privileged functions.
-- Edge Functions (service role) and triggers are unaffected.
-- NOTE: is_admin() / is_staff_or_admin() are intentionally left executable by
-- anon/authenticated — they are referenced inside RLS policy expressions on
-- public tables and revoking them would break those policies.
-- ----------------------------------------------------------------------------

revoke all on function upsert_customer(text, text, text) from public, anon, authenticated;
revoke all on function generate_order_number() from public, anon, authenticated;
revoke all on function refresh_customer_stats(uuid) from public, anon, authenticated;
-- log_staff_activity has one signature only: the 5-arg form with the defaulted
-- p_metadata jsonb param (defaults do NOT create separate overloads).
revoke all on function log_staff_activity(uuid, text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function increment_coupon_usage(uuid) from public, anon, authenticated;
revoke all on function set_updated_at() from public, anon, authenticated;
revoke all on function simplified_order_progress(order_status) from public, anon, authenticated;
revoke all on function assert_staff_or_admin() from public, anon, authenticated;

-- track_order now lives behind the rate-limited track-order Edge Function;
-- revoke direct RPC access entirely (only the service role may call it now).
revoke all on function track_order(text, text) from public, anon, authenticated;

-- Dashboard / search RPCs: self-gating inside the function body, so they are
-- safe to expose to authenticated sessions — but not to the anon key.
revoke all on function search_orders(text, order_status, integer, integer) from public, anon;
revoke all on function get_dashboard_stats() from public, anon;
revoke all on function get_popular_foods(integer) from public, anon;
revoke all on function get_revenue_series(integer) from public, anon;
revoke all on function get_latest_orders(integer) from public, anon;

grant execute on function search_orders(text, order_status, integer, integer) to authenticated;
grant execute on function get_dashboard_stats() to authenticated;
grant execute on function get_popular_foods(integer) to authenticated;
grant execute on function get_revenue_series(integer) to authenticated;
grant execute on function get_latest_orders(integer) to authenticated;

-- ----------------------------------------------------------------------------
-- H1: Staff may only change status / cancellation fields on their assigned
-- orders — never money fields, the customer, the order number, or the
-- assignment. Staff also cannot set statuses that imply money movement
-- (pending_payment / paid / refunded).
-- ----------------------------------------------------------------------------

create or replace function orders_restrict_staff_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or is_admin() then
    return new;
  end if;

  if new.order_number is distinct from old.order_number
     or new.customer_id is distinct from old.customer_id
     or new.assigned_staff_id is distinct from old.assigned_staff_id
     or new.delivery_address is distinct from old.delivery_address
     or new.delivery_instructions is distinct from old.delivery_instructions
     or new.subtotal is distinct from old.subtotal
     or new.delivery_fee is distinct from old.delivery_fee
     or new.coupon_id is distinct from old.coupon_id
     or new.discount_amount is distinct from old.discount_amount
     or new.total_amount is distinct from old.total_amount
     or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'Staff may only change order status and cancellation fields.' using errcode = '42501';
  end if;

  if new.status is distinct from old.status
     and new.status not in ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') then
    raise exception 'Staff cannot set this order status.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger orders_restrict_staff_update before update on orders
  for each row execute function orders_restrict_staff_update();

revoke all on function orders_restrict_staff_update() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- H3: Rate-limit attempts table for the track-order Edge Function.
-- No RLS policies on purpose -> deny everything except the service role.
-- ----------------------------------------------------------------------------

create table if not exists rate_limit_attempts (
  id bigint generated always as identity primary key,
  bucket text not null,
  key text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists rate_limit_attempts_bucket_key_time_idx
  on rate_limit_attempts (bucket, key, attempted_at desc);

alter table rate_limit_attempts enable row level security;

-- ----------------------------------------------------------------------------
-- M4: Reservation validation.
-- A trigger (CHECK constraints cannot use stable functions like current_date)
-- plus a unique partial index preventing two CONFIRMED bookings for the same
-- date + time slot (the venue seats a single party per slot).
-- ----------------------------------------------------------------------------

create or replace function validate_reservation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.reservation_date < current_date then
    raise exception 'Reservation date must be today or in the future.';
  end if;
  if new.preferred_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Preferred time must be in HH:MM format.';
  end if;
  if new.full_name is null or length(btrim(new.full_name)) = 0 or length(new.full_name) > 120 then
    raise exception 'Full name must be between 1 and 120 characters.';
  end if;
  if new.phone is null or length(new.phone) > 20 then
    raise exception 'Phone must be between 1 and 20 characters.';
  end if;
  if new.email is null or new.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email address is required.';
  end if;
  if new.party_size is null or new.party_size !~ '^[1-9][0-9]*$' or new.party_size::int not between 1 and 50 then
    raise exception 'Party size must be a number between 1 and 50.';
  end if;
  if new.special_requests is not null and length(new.special_requests) > 1000 then
    raise exception 'Special requests must be under 1000 characters.';
  end if;
  return new;
end;
$$;

create trigger reservations_validate before insert on reservations
  for each row execute function validate_reservation();

revoke all on function validate_reservation() from public, anon, authenticated;

create unique index if not exists reservations_confirmed_slot_unique
  on reservations (reservation_date, preferred_time)
  where status = 'confirmed';

-- ----------------------------------------------------------------------------
-- M5: receipts bucket — complete the missing write policies so the bucket can
-- actually be used (staff/admin read + write, no public access).
-- ----------------------------------------------------------------------------

create policy "receipts_write_staff_admin"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and is_staff_or_admin());

create policy "receipts_update_staff_admin"
  on storage.objects for update
  using (bucket_id = 'receipts' and is_staff_or_admin());

create policy "receipts_delete_staff_admin"
  on storage.objects for delete
  using (bucket_id = 'receipts' and is_staff_or_admin());