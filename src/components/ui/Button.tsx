import { type ReactNode, type MouseEvent, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface ButtonProps {
  children: ReactNode
  variant?: 'outline' | 'filled'
  icon?: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

export function Button({
  children,
  variant = 'outline',
  icon,
  onClick,
  href,
  className,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const ref = useRef<HTMLElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    if (disabled) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    el.style.transform = `translate(${dx * 0.08}px, ${dy * 0.25}px)`
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.transform = ''
  }

  const base = cn(
    'relative inline-flex items-center gap-2 px-10 py-4 text-[0.7rem] font-medium tracking-[0.2em] uppercase transition-colors duration-300 overflow-hidden',
    variant === 'outline' && 'border border-SilentKrowd-gold/40 text-SilentKrowd-gold hover:text-SilentKrowd-black',
    variant === 'filled' && 'bg-SilentKrowd-gold text-SilentKrowd-black hover:bg-SilentKrowd-goldLight',
    disabled && 'pointer-events-none opacity-40',
    className,
  )

  const content = (
    <>
      {variant === 'outline' && (
        <motion.span
          className="absolute inset-0 origin-left bg-SilentKrowd-gold"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
        />
      )}
      <span className="relative z-10">{children}</span>
      {icon && <span className="relative z-10">{icon}</span>}
    </>
  )

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={base}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={base}
    >
      {content}
    </button>
  )
}
