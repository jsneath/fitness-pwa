export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  error = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 bg-slate-50 dark:bg-dark-surface border-2 rounded-xl
          focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400
          focus:bg-white dark:focus:bg-dark-surface-elevated
          focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/20
          transition-all duration-200 font-medium text-slate-800 dark:text-slate-100
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          ${error ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-slate-200 dark:border-dark-border'}
        `}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-500 dark:text-red-400 font-medium">{error}</span>
      )}
    </div>
  )
}
