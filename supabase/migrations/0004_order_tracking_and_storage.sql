-- ============================================================================
-- 0004_order_tracking_and_storage.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Guest order tracking: callable by the anon key. Requires knowing BOTH the
-- order number and the phone number used on the order, so it can't be used
-- to enumerate other people's orders. Returns a simplified shape (no internal
-- staff notes, no raw payment payloads).
-- ----------------------------------------------------------------------------

create or replace function track_order(p_order_number text, p_phone text)
returns table (
  order_number text,
  status order_status,
  subtotal numeric,
  delivery_fee numeric,
  discount_amount numeric,
  total_amount numeric,
  delivery_address text,
  created_at timestamptz,
  confirmed_at timestamptz,
  delivered_at timestamptz,
  items jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    o.order_number,
    o.status,
    o.subtotal,
    o.delivery_fee,
    o.discount_amount,
    o.total_amount,
    o.delivery_address,
    o.created_at,
    o.confirmed_at,
    o.delivered_at,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', oi.name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'line_total', oi.line_total
      )), '[]'::jsonb)
      from order_items oi
      where oi.order_id = o.id
    ) as items
  from orders o
  join customers c on c.id = o.customer_id
  where o.order_number = p_order_number
    and c.phone = p_phone;
end;
$$;

grant execute on function track_order(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Simplified customer-facing status, so the frontend never has to hardcode
-- the mapping from the 9 internal statuses to the 4 stages a guest sees.
-- ----------------------------------------------------------------------------

create or replace function simplified_order_progress(p_status order_status)
returns text
language sql
immutable
as $$
  select case p_status
    when 'pending_payment' then 'awaiting_payment'
    when 'paid' then 'order_received'
    when 'confirmed' then 'order_received'
    when 'preparing' then 'preparing'
    when 'ready' then 'preparing'
    when 'out_for_delivery' then 'on_the_way'
    when 'delivered' then 'delivered'
    when 'cancelled' then 'cancelled'
    when 'refunded' then 'cancelled'
  end;
$$;

-- ----------------------------------------------------------------------------
-- STORAGE BUCKETS
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('menu-images', 'menu-images', true),
  ('staff-avatars', 'staff-avatars', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- menu-images: public read (used directly as <img src>), admin-only write
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "menu_images_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'menu-images' and is_admin());

create policy "menu_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'menu-images' and is_admin());

create policy "menu_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'menu-images' and is_admin());

-- staff-avatars: staff can manage their own avatar, admin can manage all
create policy "staff_avatars_read"
  on storage.objects for select
  using (bucket_id = 'staff-avatars' and is_staff_or_admin());

create policy "staff_avatars_own_write"
  on storage.objects for insert
  with check (
    bucket_id = 'staff-avatars'
    and (owner = auth.uid() or is_admin())
  );

create policy "staff_avatars_own_update"
  on storage.objects for update
  using (
    bucket_id = 'staff-avatars'
    and (owner = auth.uid() or is_admin())
  );

-- receipts: staff/admin read, system (service role) write only
create policy "receipts_read_staff_admin"
  on storage.objects for select
  using (bucket_id = 'receipts' and is_staff_or_admin());
