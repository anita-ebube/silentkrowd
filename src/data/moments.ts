import momentImg1 from '@/assets/home/IMG_0804.JPG.jpg'
import momentImg2 from '@/assets/home/IMG_0803.JPG.jpg'
import momentImg3 from '@/assets/home/destination2.jpg'
import momentImg4 from '@/assets/home/destination3.jpg'
import momentImg5 from '@/assets/home/IMG_3082.jpg'
import momentImg6 from '@/assets/home/IMG_3083.jpg'
import momentImg7 from '@/assets/home/IMG_3087.jpg'

export interface Moment {
  id: number
  caption: string
  img: string
  width: number
}

export const momentsData: Moment[] = [
  { id: 1, caption: 'Birthday celebration', img: momentImg1, width: 320 },
  { id: 2, caption: 'Cocktail artistry', img: momentImg2, width: 240 },
  { id: 3, caption: 'VIP night out', img: momentImg3, width: 380 },
  { id: 4, caption: 'Live jazz evening', img: momentImg4, width: 260 },
  { id: 5, caption: 'Corporate event', img: momentImg5, width: 340 },
  { id: 6, caption: 'Anniversary dinner', img: momentImg6, width: 280 },
  { id: 7, caption: 'Late night vibes', img: momentImg7, width: 320 },
]
