export type MenuCategory = 'starters' | 'main_dishes' | 'proteins' | 'drinks' | 'pastries'

export interface MenuItem {
  id: number
  name: string
  category: MenuCategory
  price: number
  img: string
}

export const categories: { label: string; value: MenuCategory }[] = [
  { label: 'Starters', value: 'starters' },
  { label: 'Pastries', value: 'pastries' },
  { label: 'Main Dishes', value: 'main_dishes' },
  { label: 'Proteins', value: 'proteins' },
  { label: 'Drinks', value: 'drinks' },
]