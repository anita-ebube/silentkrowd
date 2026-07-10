export interface Cocktail {
  id: number
  eyebrow: string
  name: string
  desc: string
  price: number
  img: string
  size: 'large' | 'small'
}

export const cocktailsData: Cocktail[] = [
  { id: 1, eyebrow: 'Signature', name: 'Midnight Ember', desc: 'Smoked bourbon, black cherry reduction, activated charcoal, gold leaf', price: 28, img: 'SilentKrowdcock1', size: 'large' },
  { id: 2, eyebrow: 'Classic', name: 'Velvet SilentKrowd', desc: 'Espresso martini, vanilla cognac, cocoa dust', price: 24, img: 'SilentKrowdcock2', size: 'small' },
  { id: 3, eyebrow: 'Seasonal', name: 'Golden Hour', desc: 'Saffron gin, honeycomb, elderflower, prosecco', price: 26, img: 'SilentKrowdcock3', size: 'small' },
  { id: 4, eyebrow: 'Theatrical', name: 'Smoke & Mirrors', desc: 'Mezcal, passion fruit, chili tincture, dry ice presentation', price: 32, img: 'SilentKrowdcock4', size: 'large' },
]
