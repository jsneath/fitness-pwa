export default function Card({ children, className = '', onClick = null, ...props }) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100 p-4
        ${onClick ? 'w-full text-left hover:bg-gray-50 active:bg-gray-100 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}
