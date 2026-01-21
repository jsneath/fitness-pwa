import { useState, useEffect, useRef } from 'react'
import { Header } from '../components/layout'
import { Card, Button } from '../components/common'
import { getSetting, setSetting, exportAllData, importAllData } from '../db/database'

export default function SettingsPage() {
  const [weightUnit, setWeightUnit] = useState('kg')
  const [restTimerDuration, setRestTimerDuration] = useState(90)
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true)
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

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
        {/* Weight Unit */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Weight Unit</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleWeightUnitChange('kg')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                weightUnit === 'kg'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Kilograms (kg)
            </button>
            <button
              onClick={() => handleWeightUnitChange('lbs')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                weightUnit === 'lbs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Pounds (lbs)
            </button>
          </div>
        </Card>

        {/* Rest Timer */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Default Rest Timer</h3>
          <div className="flex flex-wrap gap-2">
            {restTimerOptions.map((seconds) => (
              <button
                key={seconds}
                onClick={() => handleRestTimerChange(seconds)}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  restTimerDuration === seconds
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-gray-700">Auto-start after logging set</span>
            <button
              onClick={() => handleAutoStartChange(!autoStartRestTimer)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoStartRestTimer ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoStartRestTimer ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Data Management */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Data Management</h3>
          <p className="text-sm text-gray-500 mb-4">
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
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {importStatus.message}
              </div>
            )}
          </div>
        </Card>

        {/* About */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-2">About</h3>
          <p className="text-sm text-gray-500">
            Fitness Tracker PWA v1.0
          </p>
          <p className="text-sm text-gray-500 mt-1">
            A mobile-first workout tracking app that works offline.
          </p>
        </Card>
      </div>
    </>
  )
}
