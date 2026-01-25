import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Layout } from './components/layout'
import { WorkoutProvider } from './context/WorkoutContext'
import { ThemeProvider } from './context/ThemeContext'
import { seedDatabase } from './db/seed'
import { db } from './db/database'
import {
  HomePage,
  WorkoutPage,
  ExercisesPage,
  HistoryPage,
  WorkoutDetailPage,
  ProgressPage,
  SettingsPage,
  ProgrammesPage,
  ProgrammeDetailPage,
  OnboardingPage
} from './pages'

function AppContent() {
  const [isLoading, setIsLoading] = useState(true)

  // Query returns undefined when key doesn't exist, null is never returned
  // So we use a wrapper to distinguish "loading" from "not found"
  const onboardingSetting = useLiveQuery(
    async () => {
      const result = await db.settings.get('onboardingComplete')
      return result ?? null // Convert undefined to null so we can distinguish from loading
    },
    []
  )

  useEffect(() => {
    // Once we get any value (including null), we're done loading
    if (onboardingSetting !== undefined) {
      setIsLoading(false)
    }
  }, [onboardingSetting])

  // Show loading state only during initial load
  if (isLoading && onboardingSetting === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-pulse text-4xl">💪</div>
      </div>
    )
  }

  const isOnboardingComplete = onboardingSetting?.value === true

  if (!isOnboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    )
  }

  return (
    <WorkoutProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<WorkoutDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/programmes" element={<ProgrammesPage />} />
          <Route path="/programmes/:id" element={<ProgrammeDetailPage />} />
        </Routes>
      </Layout>
    </WorkoutProvider>
  )
}

function App() {
  useEffect(() => {
    // Seed database on first load
    seedDatabase()
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
