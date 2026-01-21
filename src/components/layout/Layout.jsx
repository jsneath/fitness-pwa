import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-14 pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
