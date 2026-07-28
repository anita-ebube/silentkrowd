-- ============================================================================
-- 0014_menu_items_image.sql
-- ============================================================================

alter table menu_items add column if not exists image text;

-- Allow admins to view inactive items (the existing RLS only allows active)
drop policy if exists "Anyone can view active menu items" on menu_items;
create policy "Anyone can view active menu items"
  on menu_items for select
  using (active = true or is_admin());
