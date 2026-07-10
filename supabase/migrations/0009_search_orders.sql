-- ============================================================================
-- 0009_search_orders.sql
--
-- Fixes the gap flagged in the Orders admin page: search previously only
-- matched order_number because PostgREST can't OR-filter across a joined
-- table (customers) in a single .from('orders').select(...) call. This RPC
-- does the join + OR search server-side instead, and — since it's
-- SECURITY DEFINER and therefore bypasses RLS — re-implements the same
-- staff-sees-only-their-assignment scoping from 0008 explicitly inside the
-- function body rather than relying on table policies.
-- ============================================================================

create or replace function search_orders(
  p_search text default null,
  p_status order_status default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  order_number text,
  status order_status,
  total_amount numeric,
  created_at timestamptz,
  assigned_staff_id uuid,
  assigned_staff_name text,
  customer_name text,
  customer_phone text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := is_admin();
begin
  if not is_staff_or_admin() then
    raise exception 'Access denied.' using errcode = '42501';
  end if;

  return query
  select
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.created_at,
    o.assigned_staff_id,
    sp.full_name as assigned_staff_name,
    c.full_name as customer_name,
    c.phone as customer_phone,
    count(*) over() as total_count
  from orders o
  join customers c on c.id = o.customer_id
  left join profiles sp on sp.id = o.assigned_staff_id
  where (v_is_admin or o.assigned_staff_id = auth.uid())
    and (p_status is null or o.status = p_status)
    and (
      p_search is null
      or btrim(p_search) = ''
      or o.order_number ilike '%' || p_search || '%'
      or c.full_name ilike '%' || p_search || '%'
      or c.phone ilike '%' || p_search || '%'
    )
  order by o.created_at desc
  limit p_limit offset p_offset;
end;
$$;

grant execute on function search_orders(text, order_status, integer, integer) to authenticated;
