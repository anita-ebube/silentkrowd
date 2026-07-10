import { Hero } from '@/components/Hero/Hero'
import { Story } from '@/components/Story/Story'
import { Atmosphere } from '@/components/Atmosphere/Atmosphere'
import { Timeline } from '@/components/Timeline/Timeline'
import { Spaces } from '@/components/Spaces/Spaces'
import { Cocktails } from '@/components/Cocktails/Cocktails'
import { Moments } from '@/components/Moments/Moments'
import { Reservation } from '@/components/Reservation/Reservation'

export default function Home() {
  return (
    <>
      <>
        <title>SilentKrowd — Lounge · Dining · Nightlife</title>
        <meta
          name="description"
          content="SilentKrowd is a lounge, dining, and nightlife destination where every evening is designed for sensation. Reserve your table."
        />
      </>
      <Hero />
      {/* <Story /> */}
      <Atmosphere />
      <Timeline />
      {/* <Spaces /> */}
      <Cocktails />
      <Moments />
      <Reservation />
    </>
  )
}
