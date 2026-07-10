import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SectionTitleProps {
  eyebrow: string
  title: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionTitle({ eyebrow, title, align = 'left', className }: SectionTitleProps) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="font-serif text-4xl leading-[0.95] text-SilentKrowd-white md:text-6xl"
      >
        {title}
      </motion.h2>
    </div>
  )
}
