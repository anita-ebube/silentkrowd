export interface TimelineStop {
  id: number
  time: string
  title: string
  desc: string
  img: string
}

export const timelineData: TimelineStop[] = [
  { id: 1, time: '6:00 PM', title: 'Luxury Lounge', desc: 'Arrive to curated ambient soundscapes and bespoke welcome cocktails. The evening begins with intention.', img: 'SilentKrowdlounge13' },
  { id: 2, time: '7:00 PM', title: 'Signature Cocktails', desc: 'Our mixologists guide you through a sensory journey. Smoke, flame, and precision in every pour.', img: 'SilentKrowdcocktail14' },
  { id: 3, time: '8:00 PM', title: 'VIP Rooms', desc: 'Private sanctuaries with dedicated service. Your space, your music, your pace.', img: 'SilentKrowdvip15' },
  { id: 4, time: '9:00 PM', title: 'Live Entertainment', desc: 'Jazz, soul, and electronic sets from acclaimed artists. The soundtrack of your night.', img: 'SilentKrowdmusic16' },
  { id: 5, time: '10:00 PM', title: 'Fine Dining', desc: 'A curated menu of modern European cuisine with Asian influences. Each plate, a masterpiece.', img: 'SilentKrowddining17' },
  { id: 6, time: '12:00 AM', title: 'Private Events', desc: 'As the night deepens, the experience intensifies — exclusive gatherings that become legends.', img: 'SilentKrowdparty18' },
]
