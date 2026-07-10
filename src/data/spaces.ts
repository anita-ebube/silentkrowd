export interface Space {
  id: number
  label: string
  title: string
  desc: string
  img: string
  features: string[]
}

export const spacesData: Space[] = [
  { id: 1, label: '01 — Main Lounge', title: 'The Grand Lounge', desc: 'The heart of SilentKrowd. Soaring ceilings meet intimate seating clusters, with ambient soundscapes that shift throughout the evening.', img: 'SilentKrowdspace19', features: ['80 Capacity', 'Live Music', 'Full Bar', 'DJ Booth'] },
  { id: 2, label: '02 — VIP Lounge', title: 'VIP Sanctuary', desc: 'Elevated above the main floor, offering discreet service and exclusive bottle presentations from a private balcony.', img: 'SilentKrowdspace20', features: ['24 Capacity', 'Private Balcony', 'Dedicated Host', 'Bottle Service'] },
  { id: 3, label: '03 — Outdoor Terrace', title: 'The Terrace', desc: 'An open-air escape under the stars, with heated floors, fire pits, and lush greenery in the heart of the city.', img: 'SilentKrowdspace21', features: ['40 Capacity', 'Fire Pits', 'Heated Floors', 'Garden Views'] },
  { id: 4, label: '04 — Cocktail Bar', title: 'The Lab', desc: 'Our cocktail laboratory, where mixologists perform their craft. Counter seating puts you close to the artistry.', img: 'SilentKrowdspace22', features: ['12 Seats', 'Interactive Bar', 'Smoke Kitchen', 'Rare Spirits'] },
  { id: 5, label: '05 — Private Suites', title: 'The Vault', desc: 'Two fully private suites for exclusive gatherings, each with its own bar, sound system, and dedicated staff.', img: 'SilentKrowdspace23', features: ['2 Suites', 'Private Bar', 'Custom Playlists', '16 Capacity Each'] },
]
