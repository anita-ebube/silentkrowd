import { motion, AnimatePresence } from 'framer-motion'

const brand = 'SilentKrowd Luxury'
const tagline = 'Lounge · Dining · Nightlife'

export function Loader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-SilentKrowd-black"
        >
          {/* Ambient glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="pointer-events-none absolute h-64 w-64 rounded-full bg-SilentKrowd-gold blur-[100px]"
          />

          {/* Brand name — letter stagger */}
          <div className="relative flex overflow-hidden font-serif text-4xl tracking-[0.15em] text-SilentKrowd-white md:text-5xl">
            {brand.split('').map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-110%', opacity: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + i * 0.04,
                  ease: [0.19, 1, 0.22, 1],
                }}
              >
                {letter === 'S' ? (
                  <span className="text-SilentKrowd-gold">{letter}</span>
                ) : (
                  letter
                )}
              </motion.span>
            ))}
          </div>

          {/* Gold rule */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 100, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.19, 1, 0.22, 1] }}
            className="mt-5 h-px bg-SilentKrowd-gold"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, delay: 0.85, ease: 'easeOut' }}
            className="mt-5 text-[0.6rem] uppercase tracking-[0.35em] text-SilentKrowd-muted"
          >
            {tagline}
          </motion.p>

          {/* Progress bar */}
          <div className="absolute bottom-12 left-1/2 h-[2px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-SilentKrowd-border">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 1.3, ease: [0.19, 1, 0.22, 1] }}
              className="h-full bg-SilentKrowd-gold"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-SilentKrowd-black">
      <div className="relative flex overflow-hidden font-serif text-4xl tracking-[0.15em] text-SilentKrowd-white md:text-5xl">
        {brand.split('').map((letter, i) => (
          <motion.span
            key={`${letter}-${i}`}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.04, ease: [0.19, 1, 0.22, 1] }}
          >
            {letter === 'S' ? <span className="text-SilentKrowd-gold">{letter}</span> : letter}
          </motion.span>
        ))}
      </div>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 100, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.19, 1, 0.22, 1] }}
        className="mt-5 h-px bg-SilentKrowd-gold"
      />
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
        className="mt-5 text-[0.6rem] uppercase tracking-[0.35em] text-SilentKrowd-muted"
      >
        {tagline}
      </motion.p>
      <div className="absolute bottom-12 left-1/2 h-[2px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-SilentKrowd-border">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 1.3, ease: [0.19, 1, 0.22, 1] }}
          className="h-full bg-SilentKrowd-gold"
        />
      </div>
    </div>
  )
}
