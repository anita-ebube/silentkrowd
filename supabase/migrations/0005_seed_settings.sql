-- ============================================================================
-- 0005_seed_settings.sql
-- ============================================================================

insert into settings (key, value) values
  ('delivery_fee', '7000'),
  ('restaurant_name', '"SilentKrowd Lounge"'),
  ('order_number_prefix', '"SK"')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- First admin account: create this manually after deploy —
--
--   1. In Supabase Dashboard → Authentication → Users → "Add user"
--      (or supabase.auth.admin.createUser via the service role key).
--   2. Then run, substituting the new user's UUID:
--
--      insert into profiles (id, full_name, role, status)
--      values ('<auth-user-uuid>', 'Your Name', 'admin', 'active');
--
-- This is intentionally not scripted here since it needs a real auth.users
-- row to reference, and creating auth users requires the service role key
-- (never something to embed in a migration file that might be committed).
-- ----------------------------------------------------------------------------
