import { lazy, Suspense } from 'react'
import { Hero } from '@/components/Hero/Hero'

const Atmosphere = lazy(() => import('@/components/Atmosphere/Atmosphere').then(m => ({ default: m.Atmosphere })))
const Timeline = lazy(() => import('@/components/Timeline/Timeline').then(m => ({ default: m.Timeline })))
const Cocktails = lazy(() => import('@/components/Cocktails/Cocktails').then(m => ({ default: m.Cocktails })))
const Moments = lazy(() => import('@/components/Moments/Moments').then(m => ({ default: m.Moments })))
const Reservation = lazy(() => import('@/components/Reservation/Reservation').then(m => ({ default: m.Reservation })))

function SectionFallback() {
  return <div className="h-64" />
}

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
      <Suspense fallback={<SectionFallback />}><Atmosphere /></Suspense>
      <Suspense fallback={<SectionFallback />}><Timeline /></Suspense>
      <Suspense fallback={<SectionFallback />}><Cocktails /></Suspense>
      <Suspense fallback={<SectionFallback />}><Moments /></Suspense>
      <Suspense fallback={<SectionFallback />}><Reservation /></Suspense>
    </>
  )
}
