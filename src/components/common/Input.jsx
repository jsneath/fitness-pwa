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
        <label className="text-sm font-semibold text-slate-600">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 bg-slate-50 border-2 rounded-xl
          focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10
          transition-all duration-200 font-medium text-slate-800
          placeholder:text-slate-400
          ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}
        `}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-500 font-medium">{error}</span>
      )}
    </div>
  )
}
