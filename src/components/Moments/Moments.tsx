import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { momentsData } from '@/data/moments'

export function Moments() {
  return (
    <section id="moments" className="bg-SilentKrowd-charcoal py-32 md:py-48">
      <Container className="mb-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">@SilentKrowdLuxury</span>
            <h2 className="font-serif text-4xl text-SilentKrowd-white md:text-6xl">
              Guest <em className="text-SilentKrowd-gold not-italic">moments</em>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 border border-SilentKrowd-gold/40 px-5 py-3 text-[0.65rem] uppercase tracking-[0.2em] text-SilentKrowd-gold transition-colors hover:bg-SilentKrowd-gold hover:text-SilentKrowd-black"
          >
            Follow on Instagram <ArrowUpRight size={14} />
          </a>
        </div>
      </Container>

      <div className="overflow-x-auto no-scrollbar">
        <div className="flex w-max gap-4 pl-6 pr-6 md:pl-12">
          {momentsData.map((moment, i) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group relative h-[350px] flex-shrink-0 overflow-hidden rounded-sm md:h-[420px]"
              style={{ width: moment.width }}
            >
              <img
                src={moment.img}
                alt={moment.caption}
                loading="lazy"
                className="h-full w-full object-cover brightness-[0.6] contrast-110 saturate-[0.8] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-SilentKrowd-black/80 to-transparent p-6 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                <span className="text-sm font-light text-white">{moment.caption}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
