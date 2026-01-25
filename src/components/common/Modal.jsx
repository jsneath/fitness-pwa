import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full sm:max-w-md bg-white/95 dark:bg-dark-surface/95 backdrop-blur-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden animate-slide-up shadow-2xl shadow-slate-900/20 dark:shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-surface-elevated active:bg-slate-200 dark:active:bg-dark-border transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-72px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
