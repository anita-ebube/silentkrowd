import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { value: 'Tue–Sun', label: 'Open Days' },
  { value: '6PM – 3AM', label: 'Hours' },
  { value: '42', label: 'Seats' },
]

export function Reservation() {
  return (
    <section id="reserve" className="relative flex min-h-screen items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="hero-orb h-[500px] w-[500px] bg-SilentKrowd-gold opacity-[0.04]"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animationDelay: '-3s' }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <div className="mb-6 overflow-hidden">
          <motion.span
            initial={{ y: '100%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="block text-[0.65rem] uppercase tracking-[0.4em] text-SilentKrowd-gold"
          >
            Reserve Your Evening
          </motion.span>
        </div>
        <div className="mb-4 overflow-hidden">
          <motion.h2
            initial={{ y: '100%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-serif text-5xl leading-[0.9] text-SilentKrowd-white md:text-7xl lg:text-8xl"
          >
            Your table
            <br />
            <em className="text-SilentKrowd-gold not-italic">awaits.</em>
          </motion.h2>
        </div>
        <div className="mb-16 overflow-hidden">
          <motion.p
            initial={{ y: '100%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm font-light text-SilentKrowd-muted"
          >
            Every evening at SilentKrowd is limited to ensure an intimate experience.
            <br />
            Secure your place in the story.
          </motion.p>
        </div>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Button variant="filled" href="/reservations" icon={<ArrowRight size={18} />} className="px-10 py-5 text-[0.8rem]">
            Book a Table
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 flex items-center justify-center gap-8 md:gap-16"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8 md:gap-16">
              {i > 0 && <div className="h-12 w-px bg-SilentKrowd-border" />}
              <div className="text-center">
                <span className="font-serif text-2xl text-SilentKrowd-gold md:text-3xl">{stat.value}</span>
                <p className="mt-1 text-xs uppercase tracking-wider text-SilentKrowd-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
