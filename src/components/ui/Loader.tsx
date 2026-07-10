import { motion, AnimatePresence } from 'framer-motion'

const letters = ['N', 'O', 'I', 'R']

export function Loader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-SilentKrowd-black"
        >
          <div className="flex overflow-hidden font-serif text-3xl tracking-[0.3em] text-SilentKrowd-gold">
            {letters.map((letter, i) => (
              <motion.span
                key={letter + i}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-110%' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mt-6 h-px bg-SilentKrowd-gold"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
