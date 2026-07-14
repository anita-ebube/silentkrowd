import { useState } from 'react'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { spacesData, type Space } from '@/data/spaces'
import { SpaceModal } from './SpaceModal'

export function Spaces() {
  const [active, setActive] = useState<Space | null>(null)

  return (
    <section id="spaces" className="relative py-32 md:py-48">
      <Container>
        <div className="mb-20 grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
          <div>
            <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
              Explore
            </span>
            <h2 className="font-serif text-4xl leading-tight text-SilentKrowd-white md:text-6xl">
              Five worlds.
              <br />
              <em className="text-SilentKrowd-gold not-italic">One address.</em>
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-sm font-light leading-relaxed text-SilentKrowd-muted lg:ml-auto lg:max-w-md">
              Each space within SilentKrowd has its own personality, its own rhythm. Discover where your
              evening belongs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {spacesData.map((space, i) => (
            <motion.button
              key={space.id}
              data-cursor-hover
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              onClick={() => setActive(space)}
              className="group relative h-[280px] overflow-hidden rounded-sm border border-SilentKrowd-border text-left transition-colors duration-500 hover:border-SilentKrowd-gold/30 md:h-[360px]"
            >
              <img
                src={space.img}
                alt={space.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover brightness-[0.35] contrast-110 transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-SilentKrowd-black/90 via-SilentKrowd-black/30 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <span className="mb-1 text-[0.55rem] uppercase tracking-[0.3em] text-SilentKrowd-gold">
                  {String(space.id).padStart(2, '0')}
                </span>
                <h3 className="font-serif text-xl text-SilentKrowd-white">{space.title}</h3>
                <div className="mt-3 h-px w-8 bg-SilentKrowd-gold/40 transition-all duration-500 group-hover:w-16" />
              </div>
            </motion.button>
          ))}
        </div>
      </Container>

      <SpaceModal space={active} onClose={() => setActive(null)} />
    </section>
  )
}
