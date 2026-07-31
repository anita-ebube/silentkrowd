import img1 from '@/assets/home/cocktail.webp'
import img2 from '@/assets/home/cocktail2.webp'
import img3 from '@/assets/home/outdoor.webp'
import img4 from '@/assets/home/destination2.webp'
import img5 from '@/assets/home/destination3.webp'
import img6 from '@/assets/home/IMG_3095.webp'
import img7 from '@/assets/home/IMG_3087.webp'
import img8 from '@/assets/home/IMG_3083.webp'
import img9 from '@/assets/home/IMG_3082.webp'
import img10 from '@/assets/home/IMG_0823.JPG.webp'
import img11 from '@/assets/home/IMG_0818.JPG.webp'
import img12 from '@/assets/home/IMG_0814.JPG.webp'
import img13 from '@/assets/home/IMG_0813.JPG.webp'
import img14 from '@/assets/home/IMG_0812.JPG.webp'
import img15 from '@/assets/home/IMG_0811.JPG.webp'
import img16 from '@/assets/home/IMG_0810.JPG.webp'
import img17 from '@/assets/home/IMG_0809.JPG.webp'
import img18 from '@/assets/home/IMG_0807.JPG.webp'
import img19 from '@/assets/home/IMG_0804.JPG.webp'
import img20 from '@/assets/home/IMG_0803.JPG.webp'

const pool = [
  img1, img2, img3, img4, img5,
  img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15,
  img16, img17, img18, img19, img20,
]

export function getAssetImage(index: number): string {
  return pool[index % pool.length]
}
