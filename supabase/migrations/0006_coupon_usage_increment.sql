-- ============================================================================
-- 0006_coupon_usage_increment.sql
-- ============================================================================

create or replace function increment_coupon_usage(p_coupon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update coupons set times_used = times_used + 1 where id = p_coupon_id;
$$;
