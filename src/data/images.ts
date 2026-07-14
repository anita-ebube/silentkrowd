import img1 from '@/assets/home/cocktail.jpg'
import img2 from '@/assets/home/cocktail2.jpg'
import img3 from '@/assets/home/outdoor.jpg'
import img4 from '@/assets/home/destination2.jpg'
import img5 from '@/assets/home/destination3.jpg'
import img6 from '@/assets/home/IMG_3095.jpg'
import img7 from '@/assets/home/IMG_3087.jpg'
import img8 from '@/assets/home/IMG_3083.jpg'
import img9 from '@/assets/home/IMG_3082.jpg'
import img10 from '@/assets/home/IMG_0823.JPG.jpg'
import img11 from '@/assets/home/IMG_0818.JPG.jpg'
import img12 from '@/assets/home/IMG_0814.JPG.jpg'
import img13 from '@/assets/home/IMG_0813.JPG.jpg'
import img14 from '@/assets/home/IMG_0812.JPG.jpg'
import img15 from '@/assets/home/IMG_0811.JPG.jpg'
import img16 from '@/assets/home/IMG_0810.JPG.jpg'
import img17 from '@/assets/home/IMG_0809.JPG.jpg'
import img18 from '@/assets/home/IMG_0807.JPG.jpg'
import img19 from '@/assets/home/IMG_0804.JPG.jpg'
import img20 from '@/assets/home/IMG_0803.JPG.jpg'

const pool = [
  img1, img2, img3, img4, img5,
  img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15,
  img16, img17, img18, img19, img20,
]

export function getAssetImage(index: number): string {
  return pool[index % pool.length]
}
