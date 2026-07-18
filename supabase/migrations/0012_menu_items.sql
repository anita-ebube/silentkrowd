-- ============================================================================
-- 0012_menu_items.sql
-- SilentKrowd Lounge — canonical menu items table + idempotency key for orders
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MENU ITEMS — canonical price source
-- Until now, prices lived only in src/data/menu.ts (client-side). This table
-- becomes the server-side source of truth so the create-order Edge Function
-- can validate unit_price against it instead of trusting the client.
-- ----------------------------------------------------------------------------

create table if not exists menu_items (
  id integer primary key,
  name text not null,
  category menu_category not null,
  price numeric(12, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index menu_items_category_idx on menu_items (category);
create index menu_items_active_idx on menu_items (active);

-- Seed all 160 items from the front-end catalogue
insert into menu_items (id, name, category, price) values
  (1,   'Special Omelette Served with Plantain or Sliced Butter Bread', 'food', 7875),
  (2,   'Scrambled Eggs Served with Baked Beans, Sausage, Stir Fry Vegetables & Toasted Bread', 'food', 8925),
  (3,   'Stir Fry Mixed Irish Potato with Vegetables Served with Grilled Chicken Breast', 'food', 8925),
  (4,   'Creamy Noodles Served with Grilled Mixed Vegetable and Sunrise Egg', 'food', 8400),
  (5,   'Sunrise Egg in a Sliced Bread Cut Served with Grilled Sausage and Grilled Mixed Vegetable', 'food', 8400),
  (6,   'French Fries with Grilled Spicy Chicken Breast Served with Hot Chili Sauce', 'food', 9450),
  (7,   'Spring Rolls, Deep Fried Pastry Roll Filled with Mixed Vegetable, Served with Sweet Chili', 'food', 7350),
  (8,   'Crispy Wings, Deep Fried Breaded Chicken Wings Served with Hot Chili and Mixed Vegetable', 'food', 7350),
  (9,   'Fried Dodo Served with Hot Chili Sauce', 'food', 6300),
  (10,  'Cheesy Potato Chicken Served with Hot Chili', 'food', 10500),
  (11,  'Chicken Shawarma', 'food', 8400),
  (12,  'Beef Special Shawarma', 'food', 8400),
  (13,  'Beef Burger with French Fries', 'food', 15750),
  (14,  'Chicken Burger with French Fries', 'food', 15750),
  (15,  'Pork Dumplings', 'food', 7350),
  (16,  'Prawns Dumplings', 'food', 10500),
  (17,  'Chicken Spring Rolls', 'food', 8400),
  (18,  'Beef Spring Rolls', 'food', 8400),
  (19,  'Pepperoni Pizza (Small)', 'food', 10500),
  (20,  'Pepperoni Pizza (Medium)', 'food', 12600),
  (21,  'Pepperoni Pizza (Large)', 'food', 15750),
  (22,  'Chicken Pizza (Small)', 'food', 10500),
  (23,  'Chicken Pizza (Medium)', 'food', 12600),
  (24,  'Chicken Pizza (Large)', 'food', 15750),
  (25,  'Seafood Pasta, Stir Fry Seafood and Veggies, Served with Grilled Jumbo Shrimps', 'food', 16800),
  (26,  'Vegetable Pasta Served with Deep Fried Turkey', 'food', 15750),
  (27,  'Chicken Alfredo Pasta Served with Fried Chicken', 'food', 17850),
  (28,  'Creamy Alfredo Pasta with Grilled Prawns and Stir Fried Vegetables', 'food', 18900),
  (29,  'Singapore Noodles with Prawns and Vegetables', 'food', 18375),
  (30,  'Singapore Noodles with Shredded Beef and Chicken, Served with Fried Chicken', 'food', 18900),
  (31,  'Mixed Meat Pasta with Veggies Served with Fried Chicken', 'food', 16800),
  (32,  'Pineapple Rice with Grilled Prawns', 'food', 18900),
  (33,  'Special Chinese Rice Served with Deep Fried Turkey', 'food', 20475),
  (34,  'Jambalaya Rice with Stir Fried Vegetable, Served with Grilled Boneless Chicken', 'food', 21000),
  (35,  'Stir Fried Vegetable Rice Served with Chicken Curry Sauce', 'food', 15750),
  (36,  'Special Fried Rice with Fluffy Grilled Turkey and Stir Fried Vegetable', 'food', 18900),
  (37,  'Shredded Beef Sauce Served with Stir Fried Egg Rice', 'food', 16800),
  (38,  'Sweet and Sour Chicken Sauce with Steamy White Rice', 'food', 15750),
  (39,  'Loaded Fries with Lollipop Chicken', 'food', 21000),
  (40,  'Naija Jollof Rice with Special Mixed Beef and Vegetable Sauce', 'food', 18375),
  (41,  'Signature Rice Served with Spicy Fried Chicken', 'food', 18375),
  (42,  'French Fries with Crispy Chicken and Sweet Chili Sauce', 'food', 15750),
  (43,  'Silent Krowd Special Served with Spicy Grilled Prawns', 'food', 26250),
  (44,  'Seafood Soup with Steaming White Rice', 'food', 17850),
  (45,  'Grilled Croaker Fish', 'food', 25200),
  (46,  'Grilled Tilapia Fish', 'food', 27300),
  (47,  'Grilled Turkey', 'food', 18900),
  (48,  'Grilled Whole Chicken', 'food', 36750),
  (49,  'Half Chicken', 'food', 17850),
  (50,  '4/4 Chicken', 'food', 8750),
  (51,  'Cheese Salad', 'food', 11550),
  (52,  'Chicken Special Salad', 'food', 12600),
  (53,  'Special Veggies Salad', 'food', 16800),
  (54,  'Silent Krowd Salad', 'food', 21000),
  (55,  'Healthy Fruit Salad', 'food', 19950),
  (56,  'Fresh Orange Juice', 'drinks', 6300),
  (57,  'Fresh Pineapple Juice', 'drinks', 6300),
  (58,  'Fresh Water Melon Juice', 'drinks', 6300),
  (59,  'Fresh Mixed Fruit Juice', 'drinks', 7350),
  (60,  'Chapman (Fresh)', 'drinks', 7350),
  (61,  'Bottle Water', 'drinks', 525),
  (62,  'Maltina', 'drinks', 1575),
  (63,  'Coke / Zero / Sprite / Fanta', 'drinks', 1050),
  (64,  'Pepsi / Light / 7up / Mirinda', 'drinks', 1050),
  (65,  'Power Horse', 'drinks', 5250),
  (66,  'Redbull', 'drinks', 5250),
  (67,  'Soda / Tonic Water / Bitter Lemon', 'drinks', 1575),
  (68,  'Black Coffee', 'drinks', 3150),
  (69,  'Cappuccino', 'drinks', 4200),
  (70,  'Silentkrowd Lemon Grass-Ginger Tea', 'drinks', 4725),
  (71,  'Double Espresso', 'drinks', 6300),
  (72,  'Espresso', 'drinks', 3150),
  (73,  'Hot Chocolate', 'drinks', 3150),
  (74,  'Lebanese Coffee (Pot)', 'drinks', 5250),
  (75,  'Tea', 'drinks', 3675),
  (76,  'Arabian Tea (Small)', 'drinks', 6000),
  (77,  'Arabian Tea (Big)', 'drinks', 2100),
  (78,  'Orange / Pineapple / Watermelon Juice', 'drinks', 5250),
  (79,  'Lemonade', 'drinks', 5250),
  (80,  'Strawberry Juice', 'drinks', 7875),
  (81,  'Passion Fruit Juice', 'drinks', 7875),
  (82,  'Virgin Pina / Strawberry Colada', 'drinks', 6825),
  (83,  'Silentkrowd Special Drink', 'drinks', 8400),
  (84,  'Virgin Mojito', 'drinks', 7350),
  (85,  'Virgin Strawberry Mojito', 'drinks', 7350),
  (86,  'Virgin Strawberry Daiquiri', 'drinks', 7350),
  (87,  'Virgin Jolly Rancher', 'drinks', 7350),
  (88,  'Smoothie', 'drinks', 7350),
  (89,  'Juice Pack (1L)', 'drinks', 5250),
  (90,  'Cranberry Pack (1.5L)', 'drinks', 9450),
  (91,  'Chapman', 'drinks', 4200),
  (92,  'Iced Tea', 'drinks', 5250),
  (93,  'Jumanji', 'drinks', 4725),
  (94,  'Milkshake', 'drinks', 7350),
  (95,  'Groundnut Banana Milkshake', 'drinks', 6300),
  (96,  'Coffee Ginger Milkshake', 'drinks', 630),
  (97,  'Frappuccino', 'drinks', 5775),
  (98,  'Vanilla Milkshake', 'drinks', 6825),
  (99,  'Chocolate Milkshake', 'drinks', 7350),
  (100, 'Oreo Milkshake', 'drinks', 7350),
  (101, 'Strawberry Milkshake', 'drinks', 7350),
  (102, 'Banana Honey Pop', 'drinks', 7875),
  (103, 'Big Shisha', 'drinks', 15750),
  (104, 'Small Shisha', 'drinks', 10500),
  (105, 'Black Magic', 'drinks', 8925),
  (106, 'Long Island', 'drinks', 8925),
  (107, 'White Russian', 'drinks', 8925),
  (108, 'Clover Club', 'drinks', 8925),
  (109, 'Whiskey Sour', 'drinks', 8925),
  (110, 'Negroni', 'drinks', 8925),
  (111, 'Screaming Orgasm', 'drinks', 11025),
  (112, 'Silent Krowd Special Cocktail (Ask Server for Price)', 'drinks', 0),
  (113, 'Heineken', 'drinks', 2625),
  (114, 'Star', 'drinks', 3150),
  (115, 'Small Stout', 'drinks', 3150),
  (116, 'Absolut Vodka', 'spirits', 47250),
  (117, 'Sky Vodka', 'spirits', 47250),
  (118, 'Bacardi Rum', 'spirits', 42000),
  (119, 'Belvedere Vodka', 'spirits', 73500),
  (120, 'Grey Goose Vodka', 'spirits', 105000),
  (121, 'Gin', 'spirits', 42000),
  (122, 'Singleton 15yrs', 'spirits', 147000),
  (123, 'Chivas Regal 12yrs', 'spirits', 76350),
  (124, 'Chivas Regal 18yrs', 'spirits', 168000),
  (125, 'Famous Grouse', 'spirits', 52500),
  (126, 'Glenfiddich 15yrs', 'spirits', 170500),
  (127, 'Glenfiddich 18yrs', 'spirits', 231000),
  (128, 'Glenfiddich 21yrs', 'spirits', 692500),
  (129, 'Jack Daniels', 'spirits', 78750),
  (130, 'Jameson', 'spirits', 89750),
  (131, 'JW Red Label', 'spirits', 67750),
  (132, 'JW Black Label', 'spirits', 80000),
  (133, 'JW Gold Label', 'spirits', 120000),
  (134, 'Monkey Shoulder', 'spirits', 89000),
  (135, 'Hennessy VS', 'spirits', 126000),
  (136, 'Hennessy VSOP', 'spirits', 180500),
  (137, 'Hennessy XO', 'spirits', 630500),
  (138, 'Martell VS', 'spirits', 105000),
  (139, 'Martell Blueswift', 'spirits', 160000),
  (140, 'Remy Martin VS', 'spirits', 180000),
  (141, 'Don Julio', 'spirits', 682500),
  (142, 'Casamigos', 'spirits', 315000),
  (143, 'Olmeca', 'spirits', 63000),
  (144, 'Smirnoff Black', 'spirits', 5250),
  (145, 'Black Bullet', 'spirits', 5250),
  (146, 'Chamdor', 'wine', 15750),
  (147, 'Bosca Toselli (Red)', 'wine', 26250),
  (148, 'Rooiberg (White, Rose)', 'wine', 26250),
  (149, 'Aswartland (Light Red)', 'wine', 26250),
  (150, 'Martinellis Sparkling Cider', 'wine', 26250),
  (151, 'Carlo Rossi (Red, White) — California', 'wine', 26000),
  (152, 'Chateauneuf Du Pape (Red) — France', 'wine', 89850),
  (153, 'Escudo Rojo (Red) — Chile', 'wine', 42000),
  (154, 'Four Cousins (Red, White) — South Africa', 'wine', 20000),
  (155, 'Mateus (Rose) — Portugal', 'wine', 29000),
  (156, 'Baileys', 'wine', 42000),
  (157, 'Amarula', 'wine', 26000),
  (158, 'Moët & Chandon Brut', 'wine', 180000),
  (159, 'Moët & Chandon Rose', 'wine', 250000),
  (160, 'Andre Brut or Rose', 'wine', 30500)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- IDEMPOTENCY KEY — prevent duplicate order creation
-- ----------------------------------------------------------------------------

alter table orders add column if not exists idempotency_key text unique;

create index if not exists orders_idempotency_key_idx on orders (idempotency_key);

-- ----------------------------------------------------------------------------
-- RLS — menu_items are readable by everyone (public catalogue), writable by admins only
-- ----------------------------------------------------------------------------

alter table menu_items enable row level security;

create policy "Anyone can view active menu items"
  on menu_items for select
  using (active = true);

create policy "Only admins can insert menu items"
  on menu_items for insert
  with check (is_admin());

create policy "Only admins can update menu items"
  on menu_items for update
  using (is_admin());

create policy "Only admins can delete menu items"
  on menu_items for delete
  using (is_admin());
