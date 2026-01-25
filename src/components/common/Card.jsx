export default function Card({ children, className = '', onClick = null, ...props }) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={`
        bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-2xl
        shadow-lg shadow-slate-900/5 dark:shadow-black/20
        border border-white/60 dark:border-white/5 p-5 transition-all duration-300
        ${onClick ? 'w-full text-left hover:bg-white dark:hover:bg-dark-surface-elevated hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99]' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}
