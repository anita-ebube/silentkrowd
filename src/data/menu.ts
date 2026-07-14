import { getAssetImage } from './images'

export type MenuCategory = 'food' | 'drinks' | 'wine' | 'spirits' | 'desserts'

export interface MenuItem {
  id: number
  name: string
  category: MenuCategory
  price: number
  img: string
}

export const menuData: MenuItem[] = [
  // ───────────── FOOD — Breakfast ─────────────
  { id: 1, name: 'Special Omelette Served with Plantain or Sliced Butter Bread', category: 'food', price: 7875, img: getAssetImage(0) },
  { id: 2, name: 'Scrambled Eggs Served with Baked Beans, Sausage, Stir Fry Vegetables & Toasted Bread', category: 'food', price: 8925, img: getAssetImage(1) },
  { id: 3, name: 'Stir Fry Mixed Irish Potato with Vegetables Served with Grilled Chicken Breast', category: 'food', price: 8925, img: getAssetImage(2) },
  { id: 4, name: 'Creamy Noodles Served with Grilled Mixed Vegetable and Sunrise Egg', category: 'food', price: 8400, img: getAssetImage(3) },
  { id: 5, name: 'Sunrise Egg in a Sliced Bread Cut Served with Grilled Sausage and Grilled Mixed Vegetable', category: 'food', price: 8400, img: getAssetImage(4) },
  { id: 6, name: 'French Fries with Grilled Spicy Chicken Breast Served with Hot Chili Sauce', category: 'food', price: 9450, img: getAssetImage(5) },

  // ───────────── FOOD — Starters ─────────────
  { id: 7, name: 'Spring Rolls, Deep Fried Pastry Roll Filled with Mixed Vegetable, Served with Sweet Chili', category: 'food', price: 7350, img: getAssetImage(6) },
  { id: 8, name: 'Crispy Wings, Deep Fried Breaded Chicken Wings Served with Hot Chili and Mixed Vegetable', category: 'food', price: 7350, img: getAssetImage(7) },
  { id: 9, name: 'Fried Dodo Served with Hot Chili Sauce', category: 'food', price: 6300, img: getAssetImage(8) },
  { id: 10, name: 'Cheesy Potato Chicken Served with Hot Chili', category: 'food', price: 10500, img: getAssetImage(9) },
  { id: 11, name: 'Chicken Shawarma', category: 'food', price: 8400, img: getAssetImage(10) },
  { id: 12, name: 'Beef Special Shawarma', category: 'food', price: 8400, img: getAssetImage(11) },
  { id: 13, name: 'Beef Burger with French Fries', category: 'food', price: 15750, img: getAssetImage(12) },
  { id: 14, name: 'Chicken Burger with French Fries', category: 'food', price: 15750, img: getAssetImage(13) },
  { id: 15, name: 'Pork Dumplings', category: 'food', price: 7350, img: getAssetImage(14) },
  { id: 16, name: 'Prawns Dumplings', category: 'food', price: 10500, img: getAssetImage(15) },
  { id: 17, name: 'Chicken Spring Rolls', category: 'food', price: 8400, img: getAssetImage(16) },
  { id: 18, name: 'Beef Spring Rolls', category: 'food', price: 8400, img: getAssetImage(17) },
  { id: 19, name: 'Pepperoni Pizza (Small)', category: 'food', price: 10500, img: getAssetImage(18) },
  { id: 20, name: 'Pepperoni Pizza (Medium)', category: 'food', price: 12600, img: getAssetImage(19) },
  { id: 21, name: 'Pepperoni Pizza (Large)', category: 'food', price: 15750, img: getAssetImage(0) },
  { id: 22, name: 'Chicken Pizza (Small)', category: 'food', price: 10500, img: getAssetImage(1) },
  { id: 23, name: 'Chicken Pizza (Medium)', category: 'food', price: 12600, img: getAssetImage(2) },
  { id: 24, name: 'Chicken Pizza (Large)', category: 'food', price: 15750, img: getAssetImage(3) },

  // ───────────── FOOD — Pasta ─────────────
  { id: 25, name: 'Seafood Pasta, Stir Fry Seafood and Veggies, Served with Grilled Jumbo Shrimps', category: 'food', price: 16800, img: getAssetImage(4) },
  { id: 26, name: 'Vegetable Pasta Served with Deep Fried Turkey', category: 'food', price: 15750, img: getAssetImage(5) },
  { id: 27, name: 'Chicken Alfredo Pasta Served with Fried Chicken', category: 'food', price: 17850, img: getAssetImage(6) },
  { id: 28, name: 'Creamy Alfredo Pasta with Grilled Prawns and Stir Fried Vegetables', category: 'food', price: 18900, img: getAssetImage(7) },
  { id: 29, name: 'Singapore Noodles with Prawns and Vegetables', category: 'food', price: 18375, img: getAssetImage(8) },
  { id: 30, name: 'Singapore Noodles with Shredded Beef and Chicken, Served with Fried Chicken', category: 'food', price: 18900, img: getAssetImage(9) },
  { id: 31, name: 'Mixed Meat Pasta with Veggies Served with Fried Chicken', category: 'food', price: 16800, img: getAssetImage(10) },

  // ───────────── FOOD — Main Dish ─────────────
  { id: 32, name: 'Pineapple Rice with Grilled Prawns', category: 'food', price: 18900, img: getAssetImage(11) },
  { id: 33, name: 'Special Chinese Rice Served with Deep Fried Turkey', category: 'food', price: 20475, img: getAssetImage(12) },
  { id: 34, name: 'Jambalaya Rice with Stir Fried Vegetable, Served with Grilled Boneless Chicken', category: 'food', price: 21000, img: getAssetImage(13) },
  { id: 35, name: 'Stir Fried Vegetable Rice Served with Chicken Curry Sauce', category: 'food', price: 15750, img: getAssetImage(14) },
  { id: 36, name: 'Special Fried Rice with Fluffy Grilled Turkey and Stir Fried Vegetable', category: 'food', price: 18900, img: getAssetImage(15) },
  { id: 37, name: 'Shredded Beef Sauce Served with Stir Fried Egg Rice', category: 'food', price: 16800, img: getAssetImage(16) },
  { id: 38, name: 'Sweet and Sour Chicken Sauce with Steamy White Rice', category: 'food', price: 15750, img: getAssetImage(17) },
  { id: 39, name: 'Loaded Fries with Lollipop Chicken', category: 'food', price: 21000, img: getAssetImage(18) },
  { id: 40, name: 'Naija Jollof Rice with Special Mixed Beef and Vegetable Sauce', category: 'food', price: 18375, img: getAssetImage(19) },
  { id: 41, name: 'Signature Rice Served with Spicy Fried Chicken', category: 'food', price: 18375, img: getAssetImage(0) },
  { id: 42, name: 'French Fries with Crispy Chicken and Sweet Chili Sauce', category: 'food', price: 15750, img: getAssetImage(1) },
  { id: 43, name: 'Silent Krowd Special Served with Spicy Grilled Prawns', category: 'food', price: 26250, img: getAssetImage(2) },
  { id: 44, name: 'Seafood Soup with Steaming White Rice', category: 'food', price: 17850, img: getAssetImage(3) },

  // ───────────── FOOD — Protein ─────────────
  { id: 45, name: 'Grilled Croaker Fish', category: 'food', price: 25200, img: getAssetImage(4) },
  { id: 46, name: 'Grilled Tilapia Fish', category: 'food', price: 27300, img: getAssetImage(5) },
  { id: 47, name: 'Grilled Turkey', category: 'food', price: 18900, img: getAssetImage(6) },
  { id: 48, name: 'Grilled Whole Chicken', category: 'food', price: 36750, img: getAssetImage(7) },
  { id: 49, name: 'Half Chicken', category: 'food', price: 17850, img: getAssetImage(8) },
  { id: 50, name: '4/4 Chicken', category: 'food', price: 8750, img: getAssetImage(9) },

  // ───────────── FOOD — Salad ─────────────
  { id: 51, name: 'Cheese Salad', category: 'food', price: 11550, img: getAssetImage(10) },
  { id: 52, name: 'Chicken Special Salad', category: 'food', price: 12600, img: getAssetImage(11) },
  { id: 53, name: 'Special Veggies Salad', category: 'food', price: 16800, img: getAssetImage(12) },
  { id: 54, name: 'Silent Krowd Salad', category: 'food', price: 21000, img: getAssetImage(13) },
  { id: 55, name: 'Healthy Fruit Salad', category: 'food', price: 19950, img: getAssetImage(14) },

  // ───────────── DRINKS — Fresh Juice ─────────────
  { id: 56, name: 'Fresh Orange Juice', category: 'drinks', price: 6300, img: getAssetImage(15) },
  { id: 57, name: 'Fresh Pineapple Juice', category: 'drinks', price: 6300, img: getAssetImage(16) },
  { id: 58, name: 'Fresh Water Melon Juice', category: 'drinks', price: 6300, img: getAssetImage(17) },
  { id: 59, name: 'Fresh Mixed Fruit Juice', category: 'drinks', price: 7350, img: getAssetImage(18) },
  { id: 60, name: 'Chapman (Fresh)', category: 'drinks', price: 7350, img: getAssetImage(19) },

  // ───────────── DRINKS — Water, Soft & Energy Drinks ─────────────
  { id: 61, name: 'Bottle Water', category: 'drinks', price: 525, img: getAssetImage(0) },
  { id: 62, name: 'Maltina', category: 'drinks', price: 1575, img: getAssetImage(1) },
  { id: 63, name: 'Coke / Zero / Sprite / Fanta', category: 'drinks', price: 1050, img: getAssetImage(2) },
  { id: 64, name: 'Pepsi / Light / 7up / Mirinda', category: 'drinks', price: 1050, img: getAssetImage(3) },
  { id: 65, name: 'Power Horse', category: 'drinks', price: 5250, img: getAssetImage(4) },
  { id: 66, name: 'Redbull', category: 'drinks', price: 5250, img: getAssetImage(5) },
  { id: 67, name: 'Soda / Tonic Water / Bitter Lemon', category: 'drinks', price: 1575, img: getAssetImage(6) },

  // ───────────── DRINKS — Hot Beverages & Infusions ─────────────
  { id: 68, name: 'Black Coffee', category: 'drinks', price: 3150, img: getAssetImage(7) },
  { id: 69, name: 'Cappuccino', category: 'drinks', price: 4200, img: getAssetImage(8) },
  { id: 70, name: 'Silentkrowd Lemon Grass-Ginger Tea', category: 'drinks', price: 4725, img: getAssetImage(9) },
  { id: 71, name: 'Double Espresso', category: 'drinks', price: 6300, img: getAssetImage(10) },
  { id: 72, name: 'Espresso', category: 'drinks', price: 3150, img: getAssetImage(11) },
  { id: 73, name: 'Hot Chocolate', category: 'drinks', price: 3150, img: getAssetImage(12) },
  { id: 74, name: 'Lebanese Coffee (Pot)', category: 'drinks', price: 5250, img: getAssetImage(13) },
  { id: 75, name: 'Tea', category: 'drinks', price: 3675, img: getAssetImage(14) },
  { id: 76, name: 'Arabian Tea (Small)', category: 'drinks', price: 6000, img: getAssetImage(15) },
  { id: 77, name: 'Arabian Tea (Big)', category: 'drinks', price: 2100, img: getAssetImage(16) },

  // ───────────── DRINKS — Fresh Juices & Mocktails ─────────────
  { id: 78, name: 'Orange / Pineapple / Watermelon Juice', category: 'drinks', price: 5250, img: getAssetImage(17) },
  { id: 79, name: 'Lemonade', category: 'drinks', price: 5250, img: getAssetImage(18) },
  { id: 80, name: 'Strawberry Juice', category: 'drinks', price: 7875, img: getAssetImage(19) },
  { id: 81, name: 'Passion Fruit Juice', category: 'drinks', price: 7875, img: getAssetImage(0) },
  { id: 82, name: 'Virgin Pina / Strawberry Colada', category: 'drinks', price: 6825, img: getAssetImage(1) },
  { id: 83, name: 'Silentkrowd Special Drink', category: 'drinks', price: 8400, img: getAssetImage(2) },
  { id: 84, name: 'Virgin Mojito', category: 'drinks', price: 7350, img: getAssetImage(3) },
  { id: 85, name: 'Virgin Strawberry Mojito', category: 'drinks', price: 7350, img: getAssetImage(4) },
  { id: 86, name: 'Virgin Strawberry Daiquiri', category: 'drinks', price: 7350, img: getAssetImage(5) },
  { id: 87, name: 'Virgin Jolly Rancher', category: 'drinks', price: 7350, img: getAssetImage(6) },
  { id: 88, name: 'Smoothie', category: 'drinks', price: 7350, img: getAssetImage(7) },

  // ───────────── DRINKS — Juice Packs & Coolers ─────────────
  { id: 89, name: 'Juice Pack (1L)', category: 'drinks', price: 5250, img: getAssetImage(8) },
  { id: 90, name: 'Cranberry Pack (1.5L)', category: 'drinks', price: 9450, img: getAssetImage(9) },
  { id: 91, name: 'Chapman', category: 'drinks', price: 4200, img: getAssetImage(10) },
  { id: 92, name: 'Iced Tea', category: 'drinks', price: 5250, img: getAssetImage(11) },
  { id: 93, name: 'Jumanji', category: 'drinks', price: 4725, img: getAssetImage(12) },
  { id: 94, name: 'Milkshake', category: 'drinks', price: 7350, img: getAssetImage(13) },
  { id: 95, name: 'Groundnut Banana Milkshake', category: 'drinks', price: 6300, img: getAssetImage(14) },
  { id: 96, name: 'Coffee Ginger Milkshake', category: 'drinks', price: 630, img: getAssetImage(15) },
  { id: 97, name: 'Frappuccino', category: 'drinks', price: 5775, img: getAssetImage(16) },

  // ───────────── DRINKS — Milkshakes ─────────────
  { id: 98, name: 'Vanilla Milkshake', category: 'drinks', price: 6825, img: getAssetImage(17) },
  { id: 99, name: 'Chocolate Milkshake', category: 'drinks', price: 7350, img: getAssetImage(18) },
  { id: 100, name: 'Oreo Milkshake', category: 'drinks', price: 7350, img: getAssetImage(19) },
  { id: 101, name: 'Strawberry Milkshake', category: 'drinks', price: 7350, img: getAssetImage(0) },
  { id: 102, name: 'Banana Honey Pop', category: 'drinks', price: 7875, img: getAssetImage(1) },

  // ───────────── DRINKS — Shisha ─────────────
  { id: 103, name: 'Big Shisha', category: 'drinks', price: 15750, img: getAssetImage(2) },
  { id: 104, name: 'Small Shisha', category: 'drinks', price: 10500, img: getAssetImage(3) },

  // ───────────── DRINKS — Cocktails ─────────────
  { id: 105, name: 'Black Magic', category: 'drinks', price: 8925, img: getAssetImage(4) },
  { id: 106, name: 'Long Island', category: 'drinks', price: 8925, img: getAssetImage(5) },
  { id: 107, name: 'White Russian', category: 'drinks', price: 8925, img: getAssetImage(6) },
  { id: 108, name: 'Clover Club', category: 'drinks', price: 8925, img: getAssetImage(7) },
  { id: 109, name: 'Whiskey Sour', category: 'drinks', price: 8925, img: getAssetImage(8) },
  { id: 110, name: 'Negroni', category: 'drinks', price: 8925, img: getAssetImage(9) },
  { id: 111, name: 'Screaming Orgasm', category: 'drinks', price: 11025, img: getAssetImage(10) },
  { id: 112, name: 'Silent Krowd Special Cocktail (Ask Server for Price)', category: 'drinks', price: 0, img: getAssetImage(11) },

  // ───────────── DRINKS — Beers ─────────────
  { id: 113, name: 'Heineken', category: 'drinks', price: 2625, img: getAssetImage(12) },
  { id: 114, name: 'Star', category: 'drinks', price: 3150, img: getAssetImage(13) },
  { id: 115, name: 'Small Stout', category: 'drinks', price: 3150, img: getAssetImage(14) },

  // ───────────── SPIRITS — White Spirits ─────────────
  { id: 116, name: 'Absolut Vodka', category: 'spirits', price: 47250, img: getAssetImage(15) },
  { id: 117, name: 'Sky Vodka', category: 'spirits', price: 47250, img: getAssetImage(16) },
  { id: 118, name: 'Bacardi Rum', category: 'spirits', price: 42000, img: getAssetImage(17) },
  { id: 119, name: 'Belvedere Vodka', category: 'spirits', price: 73500, img: getAssetImage(18) },
  { id: 120, name: 'Grey Goose Vodka', category: 'spirits', price: 105000, img: getAssetImage(19) },
  { id: 121, name: 'Gin', category: 'spirits', price: 42000, img: getAssetImage(0) },

  // ───────────── SPIRITS — Whiskeys ─────────────
  { id: 122, name: 'Singleton 15yrs', category: 'spirits', price: 147000, img: getAssetImage(1) },
  { id: 123, name: 'Chivas Regal 12yrs', category: 'spirits', price: 76350, img: getAssetImage(2) },
  { id: 124, name: 'Chivas Regal 18yrs', category: 'spirits', price: 168000, img: getAssetImage(3) },
  { id: 125, name: 'Famous Grouse', category: 'spirits', price: 52500, img: getAssetImage(4) },
  { id: 126, name: 'Glenfiddich 15yrs', category: 'spirits', price: 170500, img: getAssetImage(5) },
  { id: 127, name: 'Glenfiddich 18yrs', category: 'spirits', price: 231000, img: getAssetImage(6) },
  { id: 128, name: 'Glenfiddich 21yrs', category: 'spirits', price: 692500, img: getAssetImage(7) },
  { id: 129, name: 'Jack Daniels', category: 'spirits', price: 78750, img: getAssetImage(8) },
  { id: 130, name: 'Jameson', category: 'spirits', price: 89750, img: getAssetImage(9) },
  { id: 131, name: 'JW Red Label', category: 'spirits', price: 67750, img: getAssetImage(10) },
  { id: 132, name: 'JW Black Label', category: 'spirits', price: 80000, img: getAssetImage(11) },
  { id: 133, name: 'JW Gold Label', category: 'spirits', price: 120000, img: getAssetImage(12) },
  { id: 134, name: 'Monkey Shoulder', category: 'spirits', price: 89000, img: getAssetImage(13) },

  // ───────────── SPIRITS — Cognacs (Bottle) ─────────────
  { id: 135, name: 'Hennessy VS', category: 'spirits', price: 126000, img: getAssetImage(14) },
  { id: 136, name: 'Hennessy VSOP', category: 'spirits', price: 180500, img: getAssetImage(15) },
  { id: 137, name: 'Hennessy XO', category: 'spirits', price: 630500, img: getAssetImage(16) },
  { id: 138, name: 'Martell VS', category: 'spirits', price: 105000, img: getAssetImage(17) },
  { id: 139, name: 'Martell Blueswift', category: 'spirits', price: 160000, img: getAssetImage(18) },
  { id: 140, name: 'Remy Martin VS', category: 'spirits', price: 180000, img: getAssetImage(19) },

  // ───────────── SPIRITS — Tequila ─────────────
  { id: 141, name: 'Don Julio', category: 'spirits', price: 682500, img: getAssetImage(0) },
  { id: 142, name: 'Casamigos', category: 'spirits', price: 315000, img: getAssetImage(1) },
  { id: 143, name: 'Olmeca', category: 'spirits', price: 63000, img: getAssetImage(2) },

  // ───────────── SPIRITS — Misc ─────────────
  { id: 144, name: 'Smirnoff Black', category: 'spirits', price: 5250, img: getAssetImage(3) },
  { id: 145, name: 'Black Bullet', category: 'spirits', price: 5250, img: getAssetImage(4) },

  // ───────────── WINE — Alcohol-Free Sparkling Wine ─────────────
  { id: 146, name: 'Chamdor', category: 'wine', price: 15750, img: getAssetImage(5) },
  { id: 147, name: 'Bosca Toselli (Red)', category: 'wine', price: 26250, img: getAssetImage(6) },
  { id: 148, name: 'Rooiberg (White, Rose)', category: 'wine', price: 26250, img: getAssetImage(7) },
  { id: 149, name: 'Aswartland (Light Red)', category: 'wine', price: 26250, img: getAssetImage(8) },
  { id: 150, name: 'Martinellis Sparkling Cider', category: 'wine', price: 26250, img: getAssetImage(9) },

  // ───────────── WINE — Wines ─────────────
  { id: 151, name: 'Carlo Rossi (Red, White) — California', category: 'wine', price: 26000, img: getAssetImage(10) },
  { id: 152, name: 'Chateauneuf Du Pape (Red) — France', category: 'wine', price: 89850, img: getAssetImage(11) },
  { id: 153, name: 'Escudo Rojo (Red) — Chile', category: 'wine', price: 42000, img: getAssetImage(12) },
  { id: 154, name: 'Four Cousins (Red, White) — South Africa', category: 'wine', price: 20000, img: getAssetImage(13) },
  { id: 155, name: 'Mateus (Rose) — Portugal', category: 'wine', price: 29000, img: getAssetImage(14) },
  { id: 156, name: 'Baileys', category: 'wine', price: 42000, img: getAssetImage(15) },
  { id: 157, name: 'Amarula', category: 'wine', price: 26000, img: getAssetImage(16) },

  // ───────────── WINE — Champagnes ─────────────
  { id: 158, name: 'Moët & Chandon Brut', category: 'wine', price: 180000, img: getAssetImage(17) },
  { id: 159, name: 'Moët & Chandon Rose', category: 'wine', price: 250000, img: getAssetImage(18) },
  { id: 160, name: 'Andre Brut or Rose', category: 'wine', price: 30500, img: getAssetImage(19) },
]

export const categories: { label: string; value: MenuCategory  }[] = [
  { label: 'Food', value: 'food' },
  { label: 'Drinks', value: 'drinks' },
  { label: 'Wine', value: 'wine' },
  { label: 'Spirits', value: 'spirits' },
  { label: 'Desserts', value: 'desserts' },
]