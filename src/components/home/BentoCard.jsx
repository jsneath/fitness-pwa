import { motion } from 'framer-motion'

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
}

const sizeClasses = {
  '1x1': 'col-span-1 row-span-1',
  '2x1': 'col-span-2 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x2': 'col-span-2 row-span-2',
}

export default function BentoCard({
  children,
  size = '1x1',
  className = '',
  onClick = null,
  gradient = null,
  ...props
}) {
  const Component = onClick ? motion.button : motion.div

  const gradientClasses = {
    primary: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    success: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    warning: 'bg-gradient-to-br from-amber-400 to-orange-500',
    energy: 'bg-gradient-to-br from-orange-500 to-red-500',
    cool: 'bg-gradient-to-br from-cyan-500 to-blue-500',
  }

  const baseClasses = gradient
    ? `${gradientClasses[gradient]} text-white shadow-lg`
    : 'bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm border border-white/60 dark:border-white/5 shadow-lg shadow-slate-900/5 dark:shadow-black/20'

  return (
    <Component
      className={`
        ${sizeClasses[size]}
        ${baseClasses}
        rounded-2xl p-4 w-full h-full transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        ${className}
      `}
      variants={itemVariants}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}
