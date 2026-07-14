import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { ImageReveal } from '@/components/ui/ImageReveal'
import Outdoor from '../../assets/home/outdoor.jpg'
import Cocktail from '../../assets/home/cocktail2.jpg'
import destination3 from '../../assets/home/destination3.jpg'
import collageBig from '../../assets/home/IMG_3095.jpg'
import collage2 from '../../assets/home/IMG_3087.jpg'
import collage3 from '../../assets/home/IMG_3083.jpg'
import collage4 from '../../assets/home/IMG_3082.jpg'
import collage5 from '../../assets/home/IMG_0823.JPG.jpg'
const panels = [
  {
    eyebrow: '01 — Atmosphere',
    title: 'Designed for',
    accent: 'sensation',
    desc: 'Every surface, every shadow, every beam of light has been orchestrated to create a space that feels both intimate and infinite. The architecture of mood.',
    tag: 'Immersive Design',
    img: Outdoor,
    reverse: false,
  },
  {
    eyebrow: '02 — Craft',
    title: 'Cocktails as',
    accent: 'art forms',
    desc: "Our mixologists don't pour drinks — they compose experiences. Each cocktail is a narrative of rare spirits, house-made infusions, and theatrical presentation.",
    tag: 'Liquid Artistry',
    img: Cocktail,
    reverse: true,
  },
]

const collage = [
  { img: collageBig, big: true },
  { img: collage2 },
  { img: collage3 },
  { img: collage4 },
  { img: collage5 },
]

export function Atmosphere() {
  return (
    <section id="atmosphere" className="relative">
      {panels.map((panel) => (
        <div key={panel.eyebrow} className="flex min-h-screen items-center overflow-hidden py-20 md:py-0">
          <Container>
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <ImageReveal
                src={panel.img}
                alt={panel.title}
                className={`h-[700px] rounded-sm lg:col-span-7 md:h-[550px] ${
                  panel.reverse ? 'order-1 lg:order-2' : ''
                }`}
                imgClassName="brightness-[0.6] contrast-110 saturate-75"
              />
              <div
                className={`lg:col-span-5 ${
                  panel.reverse ? 'order-2 lg:order-1 lg:pr-8' : 'lg:pl-8'
                }`}
              >
                <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
                  {panel.eyebrow}
                </span>
                <h2 className="mb-6 font-serif text-3xl leading-tight text-SilentKrowd-white md:text-5xl">
                  {panel.title}
                  <br />
                  <em className="text-SilentKrowd-gold not-italic">{panel.accent}</em>
                </h2>
                <p className="mb-8 text-sm font-light leading-relaxed text-SilentKrowd-muted">{panel.desc}</p>
                <div className="flex items-center gap-3 text-SilentKrowd-gold">
                  <div className="h-px w-12 bg-SilentKrowd-gold/40" />
                  <span className="text-[0.65rem] uppercase tracking-[0.2em]">{panel.tag}</span>
                </div>
              </div>
            </div>
          </Container>
        </div>
      ))}

      <div className="relative h-[70vh] overflow-hidden md:h-[90vh]">
        <ImageReveal
          src={destination3}
          alt="Nightlife"
          className="absolute inset-0 h-full w-full"
          // imgClassName="brightness-[0.4] contrast-125 saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-SilentKrowd-black/80 via-SilentKrowd-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <Container>
            <span className="mb-6 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
              03 — Nightlife
            </span>
            <h2 className="max-w-3xl font-serif text-4xl leading-[0.9] text-SilentKrowd-white md:text-7xl lg:text-8xl">
              When the city <em className="text-SilentKrowd-gold not-italic">sleeps</em>, we awaken.
            </h2>
          </Container>
        </div>
      </div>

      <div className="overflow-hidden py-32 md:py-48">
        <Container>
          <div className="mb-20 text-center">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold"
            >
              04 — Moments
            </motion.span>
            <h2 className="font-serif text-3xl text-SilentKrowd-white md:text-5xl">
              Every corner, a new <em className="text-SilentKrowd-gold not-italic">discovery</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {collage.map((item, i) => (
              <ImageReveal
                key={i}
                src={item.img}
                alt=""
                delay={i * 0.05}
                className={
                  item.big
                    ? 'col-span-2 row-span-2 h-[300px] rounded-sm md:h-[520px]'
                    : 'h-[140px] rounded-sm md:h-[250px]'
                }
                imgClassName="brightness-[0.55] contrast-110 saturate-75"
              />
            ))}
          </div>
        </Container>
      </div>
    </section>
  )
}
