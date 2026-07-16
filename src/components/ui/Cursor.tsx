import { useEffect, useRef, useState } from 'react'

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    if (isTouch) return

    let mouseX = 0,
      mouseY = 0
    let cursorX = 0,
      cursorY = 0
    let ringX = 0,
      ringY = 0
    let rafId: number
    let idleTimer: ReturnType<typeof setTimeout>
    let isIdle = false

    function startRaf() {
      isIdle = false
      clearTimeout(idleTimer)
      if (!rafId) rafId = requestAnimationFrame(raf)
    }

    function stopRaf() {
      isIdle = true
      cancelAnimationFrame(rafId)
      rafId = 0
    }

    function handleMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
      if (isIdle) startRaf()
      clearTimeout(idleTimer)
      idleTimer = setTimeout(stopRaf, 200)
    }

    function handleOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.('a, button, input, [data-cursor-hover]')
      if (target && ringRef.current) ringRef.current.classList.add('h-16', 'w-16', 'border-SilentKrowd-gold', 'bg-SilentKrowd-gold/10')
    }
    function handleOut(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.('a, button, input, [data-cursor-hover]')
      if (target && ringRef.current) ringRef.current.classList.remove('h-16', 'w-16', 'border-SilentKrowd-gold', 'bg-SilentKrowd-gold/10')
    }

    function raf() {
      cursorX += (mouseX - cursorX) * 0.25
      cursorY += (mouseY - cursorY) * 0.25
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      if (dotRef.current) dotRef.current.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`
      rafId = requestAnimationFrame(raf)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseout', handleOut)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseout', handleOut)
      cancelAnimationFrame(rafId)
      clearTimeout(idleTimer)
    }
  }, [isTouch])

  if (isTouch) return null

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[99999] h-1.5 w-1.5 rounded-full bg-SilentKrowd-gold"
      />
      <div
        ref={ringRef}
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[99998] h-10 w-10 rounded-full border border-SilentKrowd-gold/40 transition-[height,width,background-color,border-color] duration-300"
      />
    </>
  )
}
