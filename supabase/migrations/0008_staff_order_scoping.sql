-- ============================================================================
-- 0008_staff_order_scoping.sql
--
-- Per spec, staff can "view assigned orders" — not every order in the
-- system. Admins still see everything. The original 0003 policies granted
-- staff and admin identical blanket SELECT access via is_staff_or_admin();
-- this migration splits that into an admin-sees-all policy and a
-- staff-sees-only-their-assignment policy, for orders, order_items, and
-- payments. UPDATE access for staff (status changes on their own orders)
-- is scoped the same way — staff can no longer update an order that isn't
-- assigned to them.
-- ============================================================================

-- ---- orders -----------------------------------------------------------

drop policy if exists "orders_select_staff_admin" on orders;
drop policy if exists "orders_update_staff_admin" on orders;

create policy "orders_select_admin_all"
  on orders for select
  using (is_admin());

create policy "orders_select_staff_assigned"
  on orders for select
  using (
    is_staff_or_admin()
    and assigned_staff_id = auth.uid()
  );

create policy "orders_update_admin_all"
  on orders for update
  using (is_admin())
  with check (is_admin());

create policy "orders_update_staff_assigned"
  on orders for update
  using (is_staff_or_admin() and assigned_staff_id = auth.uid())
  with check (is_staff_or_admin() and assigned_staff_id = auth.uid());

-- ---- order_items --------------------------------------------------------

drop policy if exists "order_items_select_staff_admin" on order_items;

create policy "order_items_select_scoped"
  on order_items for select
  using (
    is_admin()
    or exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.assigned_staff_id = auth.uid()
    )
  );

-- ---- payments -------------------------------------------------------------

drop policy if exists "payments_select_staff_admin" on payments;

create policy "payments_select_scoped"
  on payments for select
  using (
    is_admin()
    or exists (
      select 1 from orders o
      where o.id = payments.order_id
        and o.assigned_staff_id = auth.uid()
    )
  );

-- Note: dashboard/reporting RPCs (get_dashboard_stats, get_popular_foods, etc.
-- from 0007) are SECURITY DEFINER and only gated by assert_staff_or_admin(),
-- so they intentionally still return lounge-wide totals to staff, not just
-- their own assigned orders — that's a judgment call (staff seeing the
-- dashboard's aggregate sales figures isn't a privacy issue the way seeing
-- another customer's address would be). Tighten assert_staff_or_admin() to
-- assert_admin() there instead if you'd rather staff not see dashboard
-- totals at all.
