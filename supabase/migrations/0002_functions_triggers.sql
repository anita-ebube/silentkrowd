-- ============================================================================
-- 0002_functions_triggers.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger customers_set_updated_at before update on customers
  for each row execute function set_updated_at();

create trigger coupons_set_updated_at before update on coupons
  for each row execute function set_updated_at();

create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();

create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Order number generator: SK-YYYYMMDD-XXXX (XXXX = daily sequence)
-- ----------------------------------------------------------------------------

create sequence if not exists order_number_seq;

create or replace function generate_order_number()
returns text
language plpgsql
as $$
declare
  today_part text := to_char(now(), 'YYYYMMDD');
  seq_part text;
begin
  seq_part := lpad((nextval('order_number_seq') % 10000)::text, 4, '0');
  return 'SK-' || today_part || '-' || seq_part;
end;
$$;

-- ----------------------------------------------------------------------------
-- Upsert a guest customer by phone number.
-- Called from the create-order Edge Function (service role) during checkout.
-- ----------------------------------------------------------------------------

create or replace function upsert_customer(
  p_full_name text,
  p_phone text,
  p_email text
)
returns customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer customers;
begin
  insert into customers (full_name, phone, email)
  values (p_full_name, p_phone, p_email)
  on conflict (phone) do update
    set full_name = excluded.full_name,
        email = coalesce(excluded.email, customers.email),
        updated_at = now()
  returning * into v_customer;

  return v_customer;
end;
$$;

-- ----------------------------------------------------------------------------
-- Recalculate a customer's aggregate stats (total_orders, total_spent, last_order_at)
-- Called whenever an order's status flips to/away from a "counted" state.
-- Only orders that have actually been paid for count toward spend.
-- ----------------------------------------------------------------------------

create or replace function refresh_customer_stats(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update customers c
  set
    total_orders = (
      select count(*) from orders o
      where o.customer_id = p_customer_id
        and o.status not in ('pending_payment', 'cancelled')
    ),
    total_spent = (
      select coalesce(sum(o.total_amount), 0) from orders o
      where o.customer_id = p_customer_id
        and o.status not in ('pending_payment', 'cancelled', 'refunded')
    ),
    last_order_at = (
      select max(o.created_at) from orders o
      where o.customer_id = p_customer_id
    )
  where c.id = p_customer_id;
end;
$$;

create or replace function orders_after_status_change()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    perform refresh_customer_stats(new.customer_id);
  end if;

  if new.status = 'confirmed' and (old.confirmed_at is null) then
    new.confirmed_at = now();
  elsif new.status = 'delivered' and (old.delivered_at is null) then
    new.delivered_at = now();
  elsif new.status = 'cancelled' and (old.cancelled_at is null) then
    new.cancelled_at = now();
  end if;

  return new;
end;
$$;

create trigger orders_after_insert_stats after insert on orders
  for each row execute function orders_after_status_change();

-- Note: the UPDATE-time version below fires BEFORE so it can set the *_at columns,
-- while still calling refresh_customer_stats via the shared function above.
create trigger orders_before_update_stats before update on orders
  for each row execute function orders_after_status_change();

-- ----------------------------------------------------------------------------
-- Log staff/admin actions (called explicitly from Edge Functions / RPC calls,
-- not a blanket trigger, since not every row change is a "staff activity")
-- ----------------------------------------------------------------------------

create or replace function log_staff_activity(
  p_actor_id uuid,
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into staff_activity_logs (actor_id, action, target_table, target_id, metadata)
  values (p_actor_id, p_action, p_target_table, p_target_id, p_metadata);
end;
$$;

-- ----------------------------------------------------------------------------
-- Helper used throughout RLS policies: is the current auth user an admin?
-- ----------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and status = 'active' and role in ('admin', 'staff')
  );
$$;
