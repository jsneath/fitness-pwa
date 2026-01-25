import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

export default function BentoGrid({ children, className = '' }) {
  return (
    <motion.div
      className={`grid grid-cols-2 gap-3 w-full auto-rows-fr ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}
