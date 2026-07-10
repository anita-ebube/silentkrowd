-- ============================================================================
-- 0007_dashboard_stats.sql
--
-- Aggregate reads for the Admin Dashboard, done as SQL functions rather than
-- pulling every order row to the client and reducing in JS. All are
-- SECURITY DEFINER + staff/admin gated inside the function body (not just
-- relying on the calling role having table SELECT via RLS), so they're safe
-- to expose to any authenticated staff/admin session.
-- ============================================================================

create or replace function assert_staff_or_admin()
returns void
language plpgsql
as $$
begin
  if not is_staff_or_admin() then
    raise exception 'Access denied.' using errcode = '42501';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Headline dashboard numbers: today/week/month sales + order status counts.
-- "Sales" = total_amount of orders that have actually been paid for
-- (excludes pending_payment and cancelled, matching refresh_customer_stats).
-- ----------------------------------------------------------------------------

create or replace function get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform assert_staff_or_admin();

  select jsonb_build_object(
    'today_sales', coalesce((
      select sum(total_amount) from orders
      where status not in ('pending_payment', 'cancelled')
        and created_at >= date_trunc('day', now())
    ), 0),
    'week_sales', coalesce((
      select sum(total_amount) from orders
      where status not in ('pending_payment', 'cancelled')
        and created_at >= date_trunc('week', now())
    ), 0),
    'month_sales', coalesce((
      select sum(total_amount) from orders
      where status not in ('pending_payment', 'cancelled')
        and created_at >= date_trunc('month', now())
    ), 0),
    'pending_orders', (
      select count(*) from orders where status in ('pending_payment', 'paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery')
    ),
    'completed_orders', (
      select count(*) from orders where status = 'delivered'
    ),
    'cancelled_orders', (
      select count(*) from orders where status in ('cancelled', 'refunded')
    )
  ) into result;

  return result;
end;
$$;

-- ----------------------------------------------------------------------------
-- Popular foods: top order_items by quantity sold, last 30 days.
-- ----------------------------------------------------------------------------

create or replace function get_popular_foods(p_limit integer default 5)
returns table (name text, category menu_category, total_quantity bigint, total_revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_staff_or_admin();

  return query
  select
    oi.name,
    oi.category,
    sum(oi.quantity) as total_quantity,
    sum(oi.line_total) as total_revenue
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.status not in ('pending_payment', 'cancelled')
    and o.created_at >= now() - interval '30 days'
  group by oi.name, oi.category
  order by total_quantity desc
  limit p_limit;
end;
$$;

-- ----------------------------------------------------------------------------
-- Revenue series for the dashboard chart: daily totals for the last N days.
-- ----------------------------------------------------------------------------

create or replace function get_revenue_series(p_days integer default 14)
returns table (day date, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_staff_or_admin();

  return query
  select
    d::date as day,
    coalesce(sum(o.total_amount), 0) as revenue
  from generate_series(
    date_trunc('day', now()) - ((p_days - 1) || ' days')::interval,
    date_trunc('day', now()),
    '1 day'
  ) d
  left join orders o
    on date_trunc('day', o.created_at) = d
    and o.status not in ('pending_payment', 'cancelled')
  group by d
  order by d;
end;
$$;

-- ----------------------------------------------------------------------------
-- Latest orders for the dashboard feed (small, denormalized read).
-- ----------------------------------------------------------------------------

create or replace function get_latest_orders(p_limit integer default 8)
returns table (
  order_number text,
  status order_status,
  total_amount numeric,
  customer_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_staff_or_admin();

  return query
  select o.order_number, o.status, o.total_amount, c.full_name, o.created_at
  from orders o
  join customers c on c.id = o.customer_id
  order by o.created_at desc
  limit p_limit;
end;
$$;
