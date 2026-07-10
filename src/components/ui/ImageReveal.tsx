import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface ImageRevealProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  delay?: number
}

export function ImageReveal({ src, alt, className, imgClassName, delay = 0 }: ImageRevealProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay, ease: [0.19, 1, 0.22, 1] }}
        className="h-full w-full"
      >
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay, ease: [0.19, 1, 0.22, 1] }}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      </motion.div>
    </div>
  )
}
