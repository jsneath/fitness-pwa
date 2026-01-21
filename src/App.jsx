import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { WorkoutProvider } from './context/WorkoutContext'
import { seedDatabase } from './db/seed'
import {
  HomePage,
  WorkoutPage,
  ExercisesPage,
  HistoryPage,
  WorkoutDetailPage,
  ProgressPage,
  SettingsPage,
  ProgrammesPage,
  ProgrammeDetailPage
} from './pages'

function App() {
  useEffect(() => {
    // Seed database on first load
    seedDatabase()
  }, [])

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App
