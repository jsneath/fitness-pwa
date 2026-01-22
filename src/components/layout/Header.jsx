import { useNavigate } from 'react-router-dom'

// Stylish logo component
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Logo mark - stylized dumbbell */}
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl rotate-3 shadow-lg shadow-purple-500/40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
          </svg>
        </div>
      </div>
      {/* Logo text */}
      <div className="flex flex-col -space-y-1">
        <span className="text-base font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          JEFIT
        </span>
        <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
          Tracker
        </span>
      </div>
    </div>
  )
}

export default function Header({ title, showBack = false, rightAction = null, showLogo = false }) {
  const navigate = useNavigate()

  // If showing logo (home page), center it
  if (showLogo) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 safe-area-top z-50">
        <div className="flex items-center justify-center h-16 px-4 max-w-lg mx-auto">
          <Logo />
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 safe-area-top z-50">
      <div className="flex items-center h-16 px-4 max-w-lg mx-auto">
        {/* Left side - back button or spacer */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Center - title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        </div>

        {/* Right side - action or spacer */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
