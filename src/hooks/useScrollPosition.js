import { useState, useEffect, useCallback, useRef } from 'react'

export default function useScrollPosition(options = {}) {
  const {
    threshold = 10,       // Minimum scroll distance to trigger direction change
    throttleMs = 50,     // Throttle scroll events
  } = options

  const [scrollY, setScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)

  const lastScrollY = useRef(0)
  const lastTime = useRef(Date.now())
  const ticking = useRef(false)

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const updateScrollPosition = useCallback(() => {
    const currentScrollY = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // Update scroll position
    setScrollY(currentScrollY)

    // Update direction only if threshold is met
    const diff = currentScrollY - lastScrollY.current
    if (Math.abs(diff) > threshold) {
      setScrollDirection(diff > 0 ? 'down' : 'up')
      lastScrollY.current = currentScrollY
    }

    // Update position flags
    setIsAtTop(currentScrollY < threshold)
    setIsAtBottom(currentScrollY + windowHeight >= documentHeight - threshold)

    ticking.current = false
  }, [threshold])

  const handleScroll = useCallback(() => {
    const now = Date.now()
    if (now - lastTime.current < throttleMs) {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(updateScrollPosition)
      }
      return
    }

    lastTime.current = now
    updateScrollPosition()
  }, [updateScrollPosition, throttleMs])

  useEffect(() => {
    // Initial position
    updateScrollPosition()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll, updateScrollPosition])

  return {
    scrollY,
    scrollDirection,
    isAtTop,
    isAtBottom,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
    prefersReducedMotion
  }
}
