import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-sm border border-SilentKrowd-border bg-SilentKrowd-glass backdrop-blur-sm transition-colors duration-300 hover:border-SilentKrowd-gold/20',
        className,
      )}
    >
      {children}
    </div>
  )
}
