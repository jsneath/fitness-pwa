import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  WelcomeStep,
  GoalsStep,
  ExperienceStep,
  ScheduleStep,
  NotificationStep
} from '../components/onboarding'
import { db } from '../db/database'

const STEPS = [
  { id: 'welcome', component: WelcomeStep },
  { id: 'goals', component: GoalsStep },
  { id: 'experience', component: ExperienceStep },
  { id: 'schedule', component: ScheduleStep },
  { id: 'notifications', component: NotificationStep }
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [userData, setUserData] = useState({
    goals: [],
    experience: null,
    schedule: null,
    notificationsEnabled: false
  })

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1

  const canProceed = useCallback(() => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return true
      case 'goals':
        return userData.goals.length > 0
      case 'experience':
        return userData.experience !== null
      case 'schedule':
        return userData.schedule !== null
      case 'notifications':
        return true
      default:
        return true
    }
  }, [currentStep, userData])

  const goNext = () => {
    if (isLastStep) {
      completeOnboarding()
    } else {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    }
  }

  const goBack = () => {
    if (!isFirstStep) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }

  const skip = () => {
    completeOnboarding()
  }

  const completeOnboarding = async () => {
    try {
      // Save user profile to Dexie
      await db.settings.put({
        key: 'userProfile',
        value: {
          goals: userData.goals,
          experience: userData.experience,
          schedule: userData.schedule
        }
      })

      await db.settings.put({
        key: 'notificationSettings',
        value: {
          enabled: userData.notificationsEnabled,
          time: '09:00',
          frequency: 'daily'
        }
      })

      await db.settings.put({
        key: 'onboardingComplete',
        value: true
      })

      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      navigate('/', { replace: true })
    }
  }

  const updateUserData = (key, value) => {
    setUserData(prev => ({ ...prev, [key]: value }))
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  const CurrentStepComponent = STEPS[currentStep].component

  const getStepProps = () => {
    switch (STEPS[currentStep].id) {
      case 'goals':
        return {
          selectedGoals: userData.goals,
          onSelect: (goals) => updateUserData('goals', goals)
        }
      case 'experience':
        return {
          selected: userData.experience,
          onSelect: (exp) => updateUserData('experience', exp)
        }
      case 'schedule':
        return {
          selected: userData.schedule,
          onSelect: (sched) => updateUserData('schedule', sched)
        }
      case 'notifications':
        return {
          enabled: userData.notificationsEnabled,
          onToggle: (enabled) => updateUserData('notificationsEnabled', enabled)
        }
      default:
        return {}
    }
  }

  // Swipe handling
  const handleDragEnd = (event, info) => {
    const threshold = 50
    if (info.offset.x < -threshold && canProceed()) {
      goNext()
    } else if (info.offset.x > threshold && !isFirstStep) {
      goBack()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex flex-col">
      {/* Header with skip button */}
      <div className="flex justify-between items-center p-4">
        <div className="w-16">
          {!isFirstStep && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goBack}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-6 bg-indigo-500'
                  : index < currentStep
                  ? 'w-2 bg-indigo-400'
                  : 'w-2 bg-slate-300 dark:bg-dark-border'
              }`}
              layoutId={`dot-${step.id}`}
            />
          ))}
        </div>

        <button
          onClick={skip}
          className="w-16 text-right text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="w-full max-w-md"
          >
            <CurrentStepComponent {...getStepProps()} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with navigation */}
      <div className="p-6 pb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={goNext}
          disabled={!canProceed()}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            canProceed()
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-200 dark:bg-dark-border text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLastStep ? "Let's Go!" : 'Continue'}
        </motion.button>

        {currentStep === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-slate-400 dark:text-slate-500 mt-4"
          >
            Swipe or tap to continue
          </motion.p>
        )}
      </div>
    </div>
  )
}
