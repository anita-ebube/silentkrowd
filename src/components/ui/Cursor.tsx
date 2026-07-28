import { useEffect, useRef, useState } from 'react'

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.hardwareConcurrency <= 4),
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
    const idleTimeoutMs = 500

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
      idleTimer = setTimeout(stopRaf, idleTimeoutMs)
    }

    function handleOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.('a, button, input, [data-cursor-hover]')
      if (target && ringRef.current) {
        ringRef.current.style.width = '4rem'
        ringRef.current.style.height = '4rem'
        ringRef.current.style.borderColor = 'rgb(201, 169, 110)'
        ringRef.current.style.backgroundColor = 'rgba(201, 169, 110, 0.1)'
      }
    }
    function handleOut(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.('a, button, input, [data-cursor-hover]')
      if (target && ringRef.current) {
        ringRef.current.style.width = '2.5rem'
        ringRef.current.style.height = '2.5rem'
        ringRef.current.style.borderColor = 'rgba(201, 169, 110, 0.4)'
        ringRef.current.style.backgroundColor = 'transparent'
      }
    }

    function raf() {
      cursorX += (mouseX - cursorX) * 0.25
      cursorY += (mouseY - cursorY) * 0.25
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
      rafId = requestAnimationFrame(raf)
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
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
        className="pointer-events-none fixed left-0 top-0 z-[99999] h-1.5 w-1.5 rounded-full bg-SilentKrowd-gold will-change-transform"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[99998] h-10 w-10 rounded-full border border-SilentKrowd-gold/40 will-change-transform"
        style={{ width: '2.5rem', height: '2.5rem' }}
      />
    </>
  )
}
