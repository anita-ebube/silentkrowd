import timelineImg1 from '@/assets/home/IMG_0813.JPG.webp'
import timelineImg2 from '@/assets/home/IMG_0812.JPG.webp'
import timelineImg3 from '@/assets/home/IMG_0811.JPG.webp'
import timelineImg4 from '@/assets/home/IMG_0810.JPG.webp'
import timelineImg5 from '@/assets/home/IMG_0809.JPG.webp'

export interface TimelineStop {
  id: number
  time: string
  title: string
  desc: string
  img: string
}

export const timelineData: TimelineStop[] = [
  { id: 1, time: '6:00 PM', title: 'Luxury Lounge', desc: 'Arrive to curated ambient soundscapes and bespoke welcome cocktails. The evening begins with intention.', img: timelineImg1 },
  { id: 2, time: '7:00 PM', title: 'Signature Cocktails', desc: 'Our mixologists guide you through a sensory journey. Smoke, flame, and precision in every pour.', img: timelineImg2 },
  { id: 3, time: '8:00 PM', title: 'VIP Segment', desc: 'Private sanctuaries with dedicated service. Your space, your music, your pace.', img: timelineImg3 },
  { id: 4, time: '9:00 PM', title: 'Music and Games for Entertainment', desc: 'Jazz, soul, and electronic sets from acclaimed artists. The soundtrack of your night.', img: timelineImg4 },
  { id: 5, time: '10:00 PM', title: 'Fine Dining', desc: 'A curated menu of modern European cuisine with Asian influences. Each plate, a masterpiece.', img: timelineImg5 },
]
