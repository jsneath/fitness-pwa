import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout'
import { Card, Button } from '../components/common'
import { db, getSetting, setSetting, exportAllData, importAllData } from '../db/database'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [weightUnit, setWeightUnit] = useState('kg')
  const [restTimerDuration, setRestTimerDuration] = useState(90)
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true)
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  const handleResetOnboarding = async () => {
    if (confirm('This will reset the onboarding wizard. You will see it again on next app load.')) {
      await db.settings.delete('onboardingComplete')
      await db.settings.delete('userProfile')
      navigate('/', { replace: true })
      window.location.reload()
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      const unit = await getSetting('weightUnit')
      const duration = await getSetting('restTimerDuration')
      const autoStart = await getSetting('autoStartRestTimer')

      if (unit) setWeightUnit(unit)
      if (duration) setRestTimerDuration(duration)
      if (autoStart !== undefined) setAutoStartRestTimer(autoStart)
    }
    loadSettings()
  }, [])

  const handleWeightUnitChange = async (unit) => {
    setWeightUnit(unit)
    await setSetting('weightUnit', unit)
  }

  const handleRestTimerChange = async (duration) => {
    setRestTimerDuration(duration)
    await setSetting('restTimerDuration', duration)
  }

  const handleAutoStartChange = async (autoStart) => {
    setAutoStartRestTimer(autoStart)
    await setSetting('autoStartRestTimer', autoStart)
  }

  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export data: ' + error.message)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !data.exportDate) {
        throw new Error('Invalid backup file format')
      }

      if (confirm('This will replace all existing data. Are you sure?')) {
        await importAllData(data)
        setImportStatus({ success: true, message: 'Data imported successfully!' })
        setTimeout(() => setImportStatus(null), 3000)
      }
    } catch (error) {
      setImportStatus({ success: false, message: 'Failed to import: ' + error.message })
      setTimeout(() => setImportStatus(null), 5000)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const restTimerOptions = [30, 60, 90, 120, 180, 240, 300]

  return (
    <>
      <Header title="Settings" />

      <div className="space-y-4 pt-4">
        {/* Theme Toggle */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Appearance</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-surface-elevated'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-surface-elevated'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                theme === 'system'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-surface-elevated'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.321A.75.75 0 0113.25 17h-6.5a.75.75 0 01-.29-1.44l.804-.321.123-.489H5a2 2 0 01-2-2V5zm2 0v8h10V5H5z" clipRule="evenodd" />
              </svg>
              System
            </button>
          </div>
        </Card>

        {/* Weight Unit */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Weight Unit</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleWeightUnitChange('kg')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                weightUnit === 'kg'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300'
              }`}
            >
              Kilograms (kg)
            </button>
            <button
              onClick={() => handleWeightUnitChange('lbs')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                weightUnit === 'lbs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300'
              }`}
            >
              Pounds (lbs)
            </button>
          </div>
        </Card>

        {/* Rest Timer */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Default Rest Timer</h3>
          <div className="flex flex-wrap gap-2">
            {restTimerOptions.map((seconds) => (
              <button
                key={seconds}
                onClick={() => handleRestTimerChange(seconds)}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  restTimerDuration === seconds
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300'
                }`}
              >
                {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <span className="text-gray-700 dark:text-gray-300">Auto-start after logging set</span>
            <button
              onClick={() => handleAutoStartChange(!autoStartRestTimer)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoStartRestTimer ? 'bg-blue-600' : 'bg-gray-300 dark:bg-dark-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                  autoStartRestTimer ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Data Management */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Data Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Export your data to create a backup, or import from a previous backup.
          </p>

          <div className="space-y-3">
            <Button fullWidth variant="secondary" onClick={handleExport}>
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data
              </span>
            </Button>

            <label className="block">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Data
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  importStatus.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {importStatus.message}
              </div>
            )}
          </div>
        </Card>

        {/* Advanced */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Advanced</h3>
          <button
            onClick={handleResetOnboarding}
            className="w-full py-2.5 px-4 rounded-xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-surface-elevated transition-colors flex items-center gap-3"
          >
            <span className="text-xl">🔄</span>
            <div>
              <p className="font-medium">Reset Onboarding</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Re-run the setup wizard</p>
            </div>
          </button>
        </Card>

        {/* About */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fitness Tracker PWA v2.0
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A mobile-first workout tracking app that works offline.
          </p>
        </Card>
      </div>
    </>
  )
}
