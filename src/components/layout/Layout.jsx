import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import BottomNav from './BottomNav'
import useScrollPosition from '../../hooks/useScrollPosition'

export default function Layout({ children }) {
  const { scrollY, prefersReducedMotion } = useScrollPosition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Parallax transforms - subtle movement based on scroll
  const blob1Y = prefersReducedMotion ? 0 : Math.min(scrollY * 0.1, 50)
  const blob2Y = prefersReducedMotion ? 0 : Math.min(scrollY * 0.15, 75)
  const blob3Y = prefersReducedMotion ? 0 : Math.min(scrollY * 0.05, 30)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg -z-10 transition-colors duration-300" />

      {/* Decorative blobs with parallax */}
      <motion.div
        className="fixed top-0 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl -z-10"
        style={{
          transform: mounted ? `translateY(${blob1Y}px)` : 'translateY(0px)'
        }}
      />
      <motion.div
        className="fixed -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-pink-200/30 to-indigo-200/30 dark:from-pink-900/10 dark:to-indigo-900/10 rounded-full blur-3xl -z-10"
        style={{
          transform: mounted ? `translateY(-${blob2Y}px)` : 'translateY(0px)'
        }}
      />
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/50 dark:from-indigo-950/30 to-transparent rounded-full blur-3xl -z-10"
        style={{
          transform: mounted ? `translate(-50%, calc(-50% + ${blob3Y}px))` : 'translate(-50%, -50%)'
        }}
      />

      <main className="pt-16 pb-24 px-4 md:max-w-lg md:mx-auto relative">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
