import { getAssetImage } from './images'

export type MenuCategory = 'starters' | 'main_dishes' | 'proteins' | 'drinks'

export interface MenuItem {
  id: number
  name: string
  category: MenuCategory
  price: number
  img: string
}

export const menuData: MenuItem[] = [
  { id: 1, name: 'Special Omelette Served with Plantain or Sliced Butter Bread', category: 'main_dishes', price: 7875, img: getAssetImage(0) },
  { id: 2, name: 'Scrambled Eggs Served with Baked Beans, Sausage, Stir Fry Vegetables & Toasted Bread', category: 'main_dishes', price: 8925, img: getAssetImage(1) },
  { id: 3, name: 'Stir Fry Mixed Irish Potato with Vegetables Served with Grilled Chicken Breast', category: 'main_dishes', price: 8925, img: getAssetImage(2) },
  { id: 4, name: 'Creamy Noodles Served with Grilled Mixed Vegetable and Sunrise Egg', category: 'main_dishes', price: 8400, img: getAssetImage(3) },
  { id: 5, name: 'Sunrise Egg in a Sliced Bread Cut Served with Grilled Sausage and Grilled Mixed Vegetable', category: 'main_dishes', price: 8400, img: getAssetImage(4) },
  { id: 6, name: 'French Fries with Grilled Spicy Chicken Breast Served with Hot Chili Sauce', category: 'main_dishes', price: 9450, img: getAssetImage(5) },
]

export const categories: { label: string; value: MenuCategory }[] = [
  { label: 'Starters', value: 'starters' },
  { label: 'Main Dishes', value: 'main_dishes' },
  { label: 'Proteins', value: 'proteins' },
  { label: 'Drinks', value: 'drinks' },
]