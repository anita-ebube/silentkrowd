import { useEffect, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  animate,
  type PanInfo,
} from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'

import galleryImg1 from '@/assets/home/outdoor.jpg'
import galleryImg2 from '@/assets/home/IMG_3095.jpg'
import galleryImg3 from '@/assets/home/IMG_3087.jpg'
import galleryImg4 from '@/assets/home/IMG_3083.jpg'
import galleryImg5 from '@/assets/home/IMG_3082.jpg'
import galleryImg6 from '@/assets/home/IMG_0823.JPG.jpg'
import galleryImg7 from '@/assets/home/IMG_0818.JPG.jpg'
import galleryImg8 from '@/assets/home/IMG_0814.JPG.jpg'
import galleryImg9 from '@/assets/home/IMG_0813.JPG.jpg'
import galleryImg10 from '@/assets/home/IMG_0812.JPG.jpg'
import galleryImg11 from '@/assets/home/IMG_0811.JPG.jpg'
import galleryImg12 from '@/assets/home/IMG_0810.JPG.jpg'
import galleryImg13 from '@/assets/home/IMG_0809.JPG.jpg'
import galleryImg14 from '@/assets/home/IMG_0807.JPG.jpg'
import galleryImg15 from '@/assets/home/IMG_0804.JPG.jpg'
import galleryImg16 from '@/assets/home/IMG_0803.JPG.jpg'
import featuredImg from '@/assets/home/cocktail.jpg'

type GalleryImage = {
  id: number
  src: string
  caption: string
}

const galleryImages: GalleryImage[] = [
  { id: 1, src: galleryImg1, caption: 'The Pool Cabana' },
  { id: 2, src: galleryImg2, caption: 'Crispy Bites' },
  { id: 3, src: galleryImg3, caption: 'Poolside Gathering' },
  { id: 4, src: galleryImg4, caption: "Chef's Fried Rice" },
  { id: 5, src: galleryImg5, caption: 'Team SilentKrowd' },
  { id: 6, src: galleryImg6, caption: 'Evening Ambience' },
  { id: 7, src: galleryImg7, caption: 'The Terrace' },
  { id: 8, src: galleryImg8, caption: 'Sunset Session' },
  { id: 9, src: galleryImg9, caption: 'Signature Plate' },
  { id: 10, src: galleryImg10, caption: 'Private Cabana' },
  { id: 11, src: galleryImg11, caption: 'Guest Moment' },
  { id: 12, src: galleryImg12, caption: 'The Lounge' },
  { id: 13, src: galleryImg13, caption: 'Poolside Evening' },
  { id: 14, src: galleryImg14, caption: 'The Bar' },
  { id: 15, src: galleryImg15, caption: "Chef's Special" },
  { id: 16, src: galleryImg16, caption: 'Golden Hour' },
]

const featured = {
  src: featuredImg,
  heading: 'A World Apart',
  description:
    'Cabanas draped in white linen, the pool catching the last light of day — SilentKrowd was built for evenings that linger.',
}



/* ───────────────────────── Shared animation variants ───────────────────────── */

const blurRevealVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 140, damping: 20 },
  },
}

const staggerContainer = (stagger = 0.1, delay = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
})

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.92, filter: 'blur(14px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
}

/* ───────────────────────── Magnetic hook ───────────────────────── */

function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 14, mass: 0.15 })
  const springY = useSpring(y, { stiffness: 150, damping: 14, mass: 0.15 })

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * strength)
    y.set((e.clientY - rect.top - rect.height / 2) * strength)
  }

  function onMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return { ref, style: { x: springX, y: springY }, onMouseMove, onMouseLeave }
}

/* ───────────────────────── Counter ───────────────────────── */

function Counter({ value, suffix, isInfinity }: { value: number; suffix: string; isInfinity?: boolean }) {
  const [count, setCount] = useState(0)
  const hasRun = useRef(false)

  if (isInfinity) {
    return <span>{suffix}</span>
  }

  return (
    <motion.span
      viewport={{ once: true, margin: '-80px' }}
      onViewportEnter={() => {
        if (hasRun.current) return
        hasRun.current = true
        animate(0, value, {
          duration: 1.8,
          ease: 'easeOut',
          onUpdate: (v) => setCount(Math.floor(v)),
        })
      }}
    >
      {count}
      {suffix}
    </motion.span>
  )
}

/* ───────────────────────── Gallery card: tilt + glow + scroll zoom ───────────────────────── */

function GalleryCard({
  item,
  index,
  onOpen,
}: {
  item: GalleryImage
  index: number
  onOpen: () => void
}) {
  const cardRef = useRef<HTMLButtonElement>(null)

  // Tilt (spring-smoothed)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 220, damping: 22 })
  const springRotateY = useSpring(rotateY, { stiffness: 220, damping: 22 })

  // Cursor-following glow position (as % within the card)
  const glowX = useMotionValue(50)
  const glowY = useMotionValue(50)
  const glowBackground = useTransform([glowX, glowY], ([gx, gy]) =>
    `radial-gradient(circle at ${gx}% ${gy}%, rgba(212,175,55,0.35), transparent 55%)`,
  )

  // Scroll-linked parallax + zoom on the image
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], [-18, 18])
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.08])

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateX.set((py - 0.5) * -10)
    rotateY.set((px - 0.5) * 10)
    glowX.set(px * 100)
    glowY.set(py * 100)
  }

  function handleMouseLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.button
      ref={cardRef}
      layoutId={`gallery-image-${item.id}`}
      data-cursor-hover
      variants={cardVariants}
      whileHover={{
        y: -10,
        rotate: 2,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onOpen}
      style={{
        perspective: 900,
        rotateX: springRotateX,
        rotateY: springRotateY,
        transitionDelay: `${(index % 4) * 0.06}s`,
      }}
      className={`group relative block aspect-[4/5] w-full origin-bottom overflow-hidden rounded-xl border border-SilentKrowd-border/60 shadow-lg shadow-black/20 transition-shadow duration-500 will-change-transform hover:z-10 hover:shadow-2xl hover:shadow-SilentKrowd-gold/20`}
    >
      {/* Scroll-linked parallax/zoom wrapper */}
      <motion.div style={{ y: imgY, scale: imgScale }} className="h-full w-full">
        <motion.img
          src={item.src}
          alt={item.caption}
          loading="lazy"
          whileHover={{ scale: 1.12 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="h-full w-full object-cover brightness-[0.7] contrast-110 saturate-[0.85]"
        />
      </motion.div>

      {/* Base gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-SilentKrowd-black/90 via-SilentKrowd-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Cursor-following golden glow */}
      <motion.div
        style={{ background: glowBackground }}
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Glowing ring border on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-SilentKrowd-gold/0 shadow-[0_0_0_0_rgba(212,175,55,0)] transition-all duration-500 group-hover:ring-SilentKrowd-gold/40 group-hover:shadow-[0_0_30px_4px_rgba(212,175,55,0.25)]" />

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden p-5">
        <span className="block translate-y-3 text-sm font-light tracking-wide text-white opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          {item.caption}
        </span>
        <span className="mt-1 block h-px w-0 bg-SilentKrowd-gold transition-all duration-500 ease-out group-hover:w-10" />
      </div>
    </motion.button>
  )
}

/* ───────────────────────── Page ───────────────────────── */

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  useLockBodyScroll(activeIndex !== null)

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(heroProgress, [0, 1], [0, 120])
  const heroOpacity = useTransform(heroProgress, [0, 1], [1, 0])

  const featuredRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: featuredProgress } = useScroll({ target: featuredRef, offset: ['start end', 'end start'] })
  const featuredImgY = useTransform(featuredProgress, [0, 1], [-40, 40])
  const featuredImgScale = useTransform(featuredProgress, [0, 0.5, 1], [1.18, 1.05, 1.12])

  const ctaMagnetic = useMagnetic(0.35)
  const closeMagnetic = useMagnetic(0.5)
  const prevMagnetic = useMagnetic(0.45)
  const nextMagnetic = useMagnetic(0.45)

  function close() {
    setActiveIndex(null)
  }
  function next() {
    setActiveIndex((i) => (i === null ? null : (i + 1) % galleryImages.length))
  }
  function prev() {
    setActiveIndex((i) => (i === null ? null : (i - 1 + galleryImages.length) % galleryImages.length))
  }

  // Keyboard navigation
  useEffect(() => {
    if (activeIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeIndex])

  // Preload adjacent images
  useEffect(() => {
    if (activeIndex === null) return
    const nextI = (activeIndex + 1) % galleryImages.length
    const prevI = (activeIndex - 1 + galleryImages.length) % galleryImages.length
      ;[nextI, prevI].forEach((idx) => {
        const preload = new window.Image()
        preload.src = galleryImages[idx].src
      })
  }, [activeIndex])

  function handleDragEnd(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x < -80) next()
    else if (info.offset.x > 80) prev()
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-32 pt-40">
      <>
        <title>Gallery — SilentKrowd</title>
        <meta name="description" content="A visual tour of SilentKrowd's spaces, cocktails, dishes, and guest moments." />
      </>

      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Floating decorative blobs (parallax on scroll) */}
      <motion.div
        aria-hidden
        style={{ y: heroY }}
        className="pointer-events-none absolute left-[-10%] top-32 h-72 w-72 rounded-full bg-SilentKrowd-gold/10 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-[60%] h-96 w-96 rounded-full bg-SilentKrowd-gold/[0.06] blur-3xl"
        animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-[20%] h-2 w-2 rounded-full bg-SilentKrowd-gold/60"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ───────────── HERO ───────────── */}
      <div ref={heroRef} className="relative z-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <Container className="mb-24 text-center">
            <motion.div
              variants={staggerContainer(0.15)}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center"
            >
              <motion.span
                variants={blurRevealVariants}
                className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold"
              >
                The Gallery
              </motion.span>
              <motion.h1
                variants={blurRevealVariants}
                className="font-serif text-4xl text-SilentKrowd-white md:text-6xl"
              >
                Every corner, <em className="text-SilentKrowd-gold not-italic">captured</em>
              </motion.h1>
              <motion.p
                variants={blurRevealVariants}
                className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-SilentKrowd-muted md:text-base"
              >
                Poolside evenings, plates worth remembering, and the quiet moments in between — a look inside SilentKrowd.
              </motion.p>

              <motion.div
                variants={blurRevealVariants}
                className="mt-16 flex flex-col items-center gap-2 text-SilentKrowd-muted"
              >
                <span className="text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                  <ChevronDown size={18} className="text-SilentKrowd-gold" />
                </motion.div>
              </motion.div>
            </motion.div>
          </Container>
        </motion.div>
      </div>

      {/* ───────────── FEATURED IMAGE (parallax + zoom on scroll) ───────────── */}
      <div ref={featuredRef} className="relative z-10 mb-28">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={blurRevealVariants}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative h-[420px] overflow-hidden rounded-2xl md:h-[560px]"
          >
            <motion.img
              style={{ y: featuredImgY, scale: featuredImgScale }}
              src={featured.src}
              alt={featured.heading}
              className="absolute inset-0 h-[130%] w-full object-cover brightness-[0.55]"
            />
            <div className="absolute inset-0 " />
            <motion.div
              variants={staggerContainer(0.1, 0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              className="absolute inset-x-0 bottom-0 p-8 md:p-14"
            >
              <motion.span
                variants={blurRevealVariants}
                className="mb-3 block text-[0.6rem] uppercase tracking-[0.35em] text-SilentKrowd-gold"
              >
                Featured
              </motion.span>
              <motion.h2
                variants={blurRevealVariants}
                className="max-w-xl font-serif text-3xl text-SilentKrowd-white md:text-5xl"
              >
                {featured.heading}
              </motion.h2>
              <motion.p
                variants={blurRevealVariants}
                className="mt-4 max-w-md text-sm font-light leading-relaxed text-SilentKrowd-muted md:text-base"
              >
                {featured.description}
              </motion.p>
            </motion.div>
          </motion.div>
        </Container>
      </div>

      {/* ───────────── BENTO GALLERY (stagger reveal) ───────────── */}
      <div className="relative z-10">
        <Container>
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
          >
            {galleryImages.map((item, i) => (
              <GalleryCard key={item.id} item={item} index={i} onOpen={() => setActiveIndex(i)} />
            ))}
          </motion.div>
        </Container>
      </div>


      {/* ───────────── CTA (magnetic button) ───────────── */}
      <div className="relative z-10 mt-28">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={blurRevealVariants}
            className="flex flex-col items-center rounded-2xl border border-SilentKrowd-border bg-SilentKrowd-glass px-6 py-20 text-center"
          >
            <h2 className="font-serif text-3xl text-SilentKrowd-white md:text-5xl">
              Every Visit Becomes <em className="text-SilentKrowd-gold not-italic">a Story</em>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-SilentKrowd-muted md:text-base">
              Reserve your table, your cabana, or your evening — and let SilentKrowd take it from there.
            </p>
            <motion.a
              ref={ctaMagnetic.ref as React.RefObject<HTMLAnchorElement>}
              href="/reservations"
              onMouseMove={ctaMagnetic.onMouseMove}
              onMouseLeave={ctaMagnetic.onMouseLeave}
              style={ctaMagnetic.style}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="mt-8 rounded-full bg-SilentKrowd-gold px-10 py-4 text-xs uppercase tracking-[0.2em] text-SilentKrowd-black transition-colors hover:bg-SilentKrowd-goldLight"
            >
              Reserve Your Experience
            </motion.a>
          </motion.div>
        </Container>
      </div>

      {/* ───────────── LIGHTBOX (shared layout transition) ───────────── */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-SilentKrowd-black/95 p-6 backdrop-blur-xl"
            onClick={close}
          >
            <motion.button
              ref={closeMagnetic.ref as React.RefObject<HTMLButtonElement>}
              aria-label="Close"
              onClick={close}
              onMouseMove={closeMagnetic.onMouseMove}
              onMouseLeave={closeMagnetic.onMouseLeave}
              style={closeMagnetic.style}
              whileHover={{ scale: 1.15 }}
              className="absolute right-6 top-6 z-10 text-SilentKrowd-white/60 transition-colors hover:text-SilentKrowd-gold"
            >
              <X size={28} />
            </motion.button>
            <motion.button
              ref={prevMagnetic.ref as React.RefObject<HTMLButtonElement>}
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              onMouseMove={prevMagnetic.onMouseMove}
              onMouseLeave={prevMagnetic.onMouseLeave}
              style={prevMagnetic.style}
              whileHover={{ scale: 1.15 }}
              className="absolute left-4 z-10 text-SilentKrowd-white/60 transition-colors hover:text-SilentKrowd-gold md:left-8"
            >
              <ChevronLeft size={32} />
            </motion.button>
            <motion.button
              ref={nextMagnetic.ref as React.RefObject<HTMLButtonElement>}
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              onMouseMove={nextMagnetic.onMouseMove}
              onMouseLeave={nextMagnetic.onMouseLeave}
              style={nextMagnetic.style}
              whileHover={{ scale: 1.15 }}
              className="absolute right-4 z-10 text-SilentKrowd-white/60 transition-colors hover:text-SilentKrowd-gold md:right-8"
            >
              <ChevronRight size={32} />
            </motion.button>

            <span className="absolute top-6 left-6 z-10 text-xs font-light tracking-widest text-SilentKrowd-white/50">
              {String(activeIndex + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                layoutId={`gallery-image-${galleryImages[activeIndex].id}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] max-w-4xl cursor-grab overflow-hidden rounded-sm active:cursor-grabbing"
              >
                <img
                  src={galleryImages[activeIndex].src}
                  alt={galleryImages[activeIndex].caption}
                  className="max-h-[85vh] w-auto select-none object-contain brightness-90"
                  draggable={false}
                />
                <p className="mt-4 text-center font-serif text-lg font-light tracking-wide text-SilentKrowd-muted">
                  {galleryImages[activeIndex].caption}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}