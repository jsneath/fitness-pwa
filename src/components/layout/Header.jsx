import { useNavigate } from "react-router-dom";

// GainForge logo component
function Logo() {
  return (
    <div className="flex items-center -ml-14">
      {/* Logo icon */}
      <img
        src="/favicon.png"
        alt="GainForge"
        className="w-40 h-40 object-contain"
      />
      {/* Logo text */}
      <div className="flex items-baseline -ml-12">
        <span className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Gain
        </span>
        <span className="text-3xl font-bold tracking-tight text-purple-500 dark:text-purple-400">
          Forge
        </span>
      </div>
    </div>
  );
}

export default function Header({
  title,
  showBack = false,
  rightAction = null,
  showLogo = false,
}) {
  const navigate = useNavigate();

  // If showing logo (home page), center it
  if (showLogo) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-white/70 dark:bg-dark-surface/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-dark-border/50 safe-area-top z-50 transition-colors duration-300">
        <div className="flex items-center justify-center h-20 px-4 max-w-lg mx-auto">
          <Logo />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/70 dark:bg-dark-surface/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-dark-border/50 safe-area-top z-50 transition-colors duration-300">
      <div className="flex items-center h-16 px-4 max-w-lg mx-auto">
        {/* Left side - back button or spacer */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-surface-elevated active:bg-slate-200 dark:active:bg-dark-border transition-colors duration-200"
            >
              <svg
                className="w-6 h-6 text-slate-600 dark:text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center - title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h1>
        </div>

        {/* Right side - action or spacer */}
        <div className="w-10 flex justify-end">{rightAction}</div>
      </div>
    </header>
  );
}
