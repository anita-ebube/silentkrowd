-- ============================================================================
-- 0003_rls_policies.sql
--
-- Design decision: guest customers never talk to Postgres directly.
-- Order/customer/payment creation and mutation all go through Edge Functions
-- running with the service role (create-order, verify-payment). This keeps
-- the anon key permission-free for writes and avoids having to reason about
-- what an unauthenticated guest "should" be able to insert.
--
-- The anon key IS allowed to read back a specific order for order-tracking,
-- but only when it supplies the matching order_number + phone (enforced via
-- a SECURITY DEFINER RPC, not a broad SELECT policy — see 0004).
-- ============================================================================

alter table profiles enable row level security;
alter table customers enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table staff_activity_logs enable row level security;
alter table settings enable row level security;

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------

create policy "profiles_select_own_or_admin"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles_update_own_limited"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_full_access"
  on profiles for all
  using (is_admin())
  with check (is_admin());

-- Note: staff creation itself happens via the create-staff Edge Function using
-- the service role (auth.admin.createUser + profile insert), never a direct
-- client-side insert, so there is no INSERT policy for authenticated users here.

-- ----------------------------------------------------------------------------
-- CUSTOMERS — staff/admin can read; no direct client writes (Edge Functions only)
-- ----------------------------------------------------------------------------

create policy "customers_select_staff_admin"
  on customers for select
  using (is_staff_or_admin());

create policy "customers_update_admin"
  on customers for update
  using (is_admin())
  with check (is_admin());

-- ----------------------------------------------------------------------------
-- COUPONS
-- ----------------------------------------------------------------------------

create policy "coupons_select_staff_admin"
  on coupons for select
  using (is_staff_or_admin());

create policy "coupons_admin_write"
  on coupons for all
  using (is_admin())
  with check (is_admin());

-- ----------------------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------------------

create policy "orders_select_staff_admin"
  on orders for select
  using (is_staff_or_admin());

create policy "orders_update_staff_admin"
  on orders for update
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

create policy "orders_delete_admin"
  on orders for delete
  using (is_admin());

-- ----------------------------------------------------------------------------
-- ORDER ITEMS
-- ----------------------------------------------------------------------------

create policy "order_items_select_staff_admin"
  on order_items for select
  using (is_staff_or_admin());

-- ----------------------------------------------------------------------------
-- PAYMENTS
-- ----------------------------------------------------------------------------

create policy "payments_select_staff_admin"
  on payments for select
  using (is_staff_or_admin());

create policy "payments_update_admin"
  on payments for update
  using (is_admin())
  with check (is_admin());

-- ----------------------------------------------------------------------------
-- STAFF ACTIVITY LOGS — admin only
-- ----------------------------------------------------------------------------

create policy "staff_activity_logs_select_admin"
  on staff_activity_logs for select
  using (is_admin());

-- ----------------------------------------------------------------------------
-- SETTINGS
-- ----------------------------------------------------------------------------

create policy "settings_select_staff_admin"
  on settings for select
  using (is_staff_or_admin());

create policy "settings_write_admin"
  on settings for all
  using (is_admin())
  with check (is_admin());
