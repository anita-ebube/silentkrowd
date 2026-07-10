import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <>
        <title>Page Not Found — SilentKrowd</title>
      </>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
          404
        </span>
        <h1 className="mb-6 font-serif text-5xl text-SilentKrowd-white md:text-7xl">
          Lost in the <em className="text-SilentKrowd-gold not-italic">dark</em>
        </h1>
        <p className="mx-auto mb-10 max-w-sm text-sm font-light text-SilentKrowd-muted">
          This corner of SilentKrowd doesn't exist. Let's find your way back to the light.
        </p>
        <Button variant="outline" href="/" icon={<ArrowLeft size={16} />}>
          Back to Home
        </Button>
      </motion.div>
    </div>
  )
}
