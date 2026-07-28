-- ============================================================================
-- 0015_menu_category_update.sql
-- ============================================================================

-- Add new enum values
alter type menu_category add value if not exists 'starters' after 'desserts';
alter type menu_category add value if not exists 'main_dishes' after 'starters';
alter type menu_category add value if not exists 'proteins' after 'main_dishes';

-- Migrate existing items to new categories
update menu_items set category = 'main_dishes' where category = 'food';
update menu_items set category = 'drinks'      where category = 'wine';
update menu_items set category = 'drinks'      where category = 'spirits';
update menu_items set category = 'drinks'      where category = 'desserts';
