-- Add 'pastries' to the menu_category enum
alter type menu_category add value if not exists 'pastries' after 'drinks';
