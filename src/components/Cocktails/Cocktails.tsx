import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { cocktailsData } from '@/data/cocktails'

export function Cocktails() {
  const trackRef = useRef<HTMLDivElement>(null)

  return (
    <section id="cocktails" className="overflow-hidden py-32 md:py-48">
      <Container className="mb-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
              The Bar
            </span>
            <h2 className="font-serif text-4xl text-SilentKrowd-white md:text-6xl">
              Featured <em className="text-SilentKrowd-gold not-italic">creations</em>
            </h2>
          </div>
          <p className="max-w-sm text-sm font-light text-SilentKrowd-muted">
            Drag to explore. Each cocktail is a chapter in our liquid story.
          </p>
        </div>
      </Container>

      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{ left: -1400, right: 0 }}
        className="flex cursor-grab gap-6 pl-6 pr-6 active:cursor-grabbing md:pl-12"
      >
        {cocktailsData.map((cocktail) => {
          const large = cocktail.size === 'large'
          return (
            <div
              key={cocktail.id}
              className={`relative flex-shrink-0 select-none overflow-hidden rounded-sm ${
                large ? 'h-[500px] w-[85vw] md:h-[650px] md:w-[600px]' : 'h-[500px] w-[55vw] md:h-[650px] md:w-[380px]'
              }`}
            >
              <img
                src={`https://picsum.photos/seed/${cocktail.img}/800/1000`}
                alt={cocktail.name}
                draggable={false}
                loading="lazy"
                className="h-full w-full object-cover brightness-[0.45] contrast-110 saturate-[0.8]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-SilentKrowd-black/95 via-SilentKrowd-black/20 to-transparent" />
              <div className={`absolute inset-x-0 bottom-0 ${large ? 'p-8 md:p-12' : 'p-8'}`}>
                <span className="text-[0.55rem] uppercase tracking-[0.3em] text-SilentKrowd-gold">
                  {cocktail.eyebrow}
                </span>
                <h3 className={`mt-2 font-serif text-SilentKrowd-white ${large ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                  {cocktail.name}
                </h3>
                <p className={`mt-2 font-light text-SilentKrowd-muted ${large ? 'max-w-sm mt-3 text-sm' : 'text-sm'}`}>
                  {cocktail.desc}
                </p>
                <span className="mt-4 block font-serif text-xl text-SilentKrowd-gold md:text-2xl">
                  ${cocktail.price}
                </span>
              </div>
            </div>
          )
        })}
        <div className="w-6 flex-shrink-0" />
      </motion.div>
    </section>
  )
}
