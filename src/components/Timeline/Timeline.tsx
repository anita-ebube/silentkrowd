import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { ImageReveal } from '@/components/ui/ImageReveal'
import { timelineData } from '@/data/timeline'
import { cn } from '@/utils/cn'

function TimelineDot({ progress, index, total }: { progress: any; index: number; total: number }) {
  const threshold = (index + 0.5) / total
  const opacity = useTransform(progress, [threshold - 0.05, threshold], [0, 1])
  return (
    <motion.div
      style={{ opacity }}
      className="absolute left-5 top-2 h-3 w-3 -translate-x-1/2 rounded-full border border-SilentKrowd-gold bg-SilentKrowd-gold shadow-[0_0_20px_rgba(201,169,110,0.4)] md:left-1/2"
    />
  )
}

export function Timeline() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 40%'] })
  const fillHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section id="experience" className="relative py-32 md:py-48">
      <Container className="max-w-[1000px]">
        <div className="mb-24 text-center">
          <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
            The Journey
          </span>
          <h2 className="font-serif text-4xl text-SilentKrowd-white md:text-6xl">
            An evening <em className="text-SilentKrowd-gold not-italic">unfolds</em>
          </h2>
        </div>

        <div ref={ref} className="relative">
          <div className="absolute left-5 top-0 h-full w-px -translate-x-1/2 bg-SilentKrowd-gold/15 md:left-1/2">
            <motion.div
              style={{ height: fillHeight }}
              className="w-full bg-gradient-to-b from-SilentKrowd-gold to-SilentKrowd-bronze"
            />
          </div>

          {timelineData.map((stop, i) => {
            const reverse = i % 2 === 1
            return (
              <div key={stop.id} className="relative pb-24 md:pb-32 last:pb-0">
                <TimelineDot progress={scrollYProgress} index={i} total={timelineData.length} />
                <div className="pl-12 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                  <div
                    className={cn(
                      reverse ? 'md:order-2 md:pl-12' : 'md:pr-12 md:text-right',
                    )}
                  >
                    <span className="text-[0.6rem] uppercase tracking-[0.3em] text-SilentKrowd-gold">
                      {stop.time}
                    </span>
                    <h3 className="mb-3 mt-2 font-serif text-2xl text-SilentKrowd-white md:text-3xl">
                      {stop.title}
                    </h3>
                    <p className="text-sm font-light leading-relaxed text-SilentKrowd-muted">{stop.desc}</p>
                  </div>
                  <ImageReveal
                    src={`https://picsum.photos/seed/${stop.img}/700/500`}
                    alt={stop.title}
                    delay={0.1}
                    className={cn(
                      'mt-6 h-[200px] rounded-sm md:mt-0 md:h-[280px]',
                      reverse ? 'md:order-1 md:pr-12' : 'md:pl-12',
                    )}
                    imgClassName="brightness-50 contrast-110 saturate-75"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
