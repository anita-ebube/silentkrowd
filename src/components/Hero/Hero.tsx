import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const reveal = {
  hidden: { y: '110%', opacity: 0 },
  show: { y: 0, opacity: 1 },
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section ref={ref} className="relative flex h-screen items-center justify-center overflow-hidden">
      <motion.div style={{ scale: bgScale }} className="absolute inset-0">
        <div className="hero-orb h-[600px] w-[600px] bg-SilentKrowd-gold" style={{ top: '-10%', left: '-10%' }} />
        <div
          className="hero-orb h-[500px] w-[500px] bg-SilentKrowd-bronze"
          style={{ bottom: '-15%', right: '-5%', animationDelay: '-4s' }}
        />
        <div
          className="hero-orb h-[400px] w-[400px] bg-SilentKrowd-gold opacity-[0.08]"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animationDelay: '-8s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-SilentKrowd-black/60 via-transparent to-SilentKrowd-black" />
      </motion.div>

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 px-6 text-center">
        <div className="mb-6 overflow-hidden">
          <motion.p
            variants={reveal}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
            className="font-sans text-[0.7rem] uppercase tracking-[0.4em] text-SilentKrowd-gold md:text-[0.8rem]"
          >
            Lounge · Dining · Nightlife
          </motion.p>
        </div>
        <div className="mb-2 overflow-hidden">
          <motion.h1
            variants={reveal}
            initial="hidden"
            animate="show"
            transition={{ duration: 1, delay: 0.12, ease: [0.19, 1, 0.22, 1] }}
            className="font-serif text-7xl leading-[0.85] tracking-[-0.03em] text-SilentKrowd-white md:text-8xl lg:text-[10rem]"
          >
            SilentKrowd
          </motion.h1>
        </div>
        <div className="mb-10 overflow-hidden">
          <motion.p
            variants={reveal}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.9, delay: 0.24, ease: [0.19, 1, 0.22, 1] }}
            className="font-serif text-xl italic text-SilentKrowd-white/60 md:text-2xl"
          >
            Where the night comes alive
          </motion.p>
        </div>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button variant="filled" href="/reservations">
            Reserve a Table
          </Button>
          <Button variant="outline" href="/menu" icon={<ArrowRight size={16} />}>
            View Menu
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-SilentKrowd-muted">Scroll</span>
        <motion.div
          animate={{ scaleY: [1, 0.4, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-10 w-px origin-top bg-gradient-to-b from-SilentKrowd-gold/60 to-transparent"
        />
      </motion.div>
    </section>
  )
}
