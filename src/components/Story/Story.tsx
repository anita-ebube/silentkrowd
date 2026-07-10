import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { ImageReveal } from '@/components/ui/ImageReveal'
import destination1 from "../../assets/home/destination1.jpeg";
import destination2 from "../../assets/home/destination2.jpeg";
const lines = ['A destination', 'for unforgettable', 'nights.']

export function Story() {
  return (
    <section id="story" className="relative overflow-hidden py-32 md:py-48">
      <Container>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-0">
          <div className="relative z-10 lg:col-span-7">
            {lines.map((line, i) => (
              <div key={line} className="overflow-hidden">
                <motion.span
                  initial={{ y: '100%' }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: [0.19, 1, 0.22, 1] }}
                  className="block font-serif text-5xl leading-[0.9] tracking-[-0.02em] text-SilentKrowd-white md:text-7xl lg:text-8xl"
                >
                  {i === 1 ? (
                    <>
                      for <em className="text-SilentKrowd-gold not-italic">unforgettable</em>
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </div>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-12 max-w-md text-sm font-light leading-relaxed text-SilentKrowd-muted"
            >
              Born from the belief that an evening should be an experience — not just a meal.
              SilentKrowd exists at the intersection of design, flavor, and atmosphere.
            </motion.p>
          </div>

          <div className="relative h-[500px] lg:col-span-5 md:h-[650px]">
            <div className="relative h-[500px] lg:col-span-5 md:h-[650px]">
              <ImageReveal
                src={destination1}
                alt="Lounge interior"
                className="absolute right-0 top-0 h-[75%] w-[85%] rounded-sm shadow-2xl"
                imgClassName="brightness-75 contrast-110 saturate-75"
              />

              <ImageReveal
                src={destination2}
                alt="Cocktail"
                className="absolute bottom-0 left-0 h-[55%] w-[60%] rounded-sm border border-SilentKrowd-border shadow-2xl"
                imgClassName="brightness-75 contrast-110 saturate-75"
                delay={0.15}
              />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, ease: 'backOut' }}
              className="absolute -bottom-6 right-[20%] flex h-28 w-28 items-center justify-center rounded-full border border-SilentKrowd-gold/30"
            >
              <span className="font-serif text-lg text-SilentKrowd-gold">Est. 2019</span>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  )
}
