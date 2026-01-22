import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 -z-10" />

      {/* Decorative blobs */}
      <div className="fixed top-0 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl -z-10" />
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-pink-200/30 to-indigo-200/30 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/50 to-transparent rounded-full blur-3xl -z-10" />

      <main className="pt-16 pb-24 px-4 max-w-lg mx-auto relative">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
