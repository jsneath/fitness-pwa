import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getActiveProgramme } from '../../db/database'
import BentoCard from './BentoCard'

export default function ActiveProgrammeCard() {
  const [programme, setProgramme] = useState(null)

  useEffect(() => {
    getActiveProgramme().then(setProgramme)
  }, [])

  const progress = programme
    ? ((programme.currentWeek || 1) / (programme.durationWeeks || 6)) * 100
    : 0

  if (!programme) {
    return (
      <Link to="/programmes" className="block">
        <BentoCard size="1x1" onClick={() => {}}>
          <div className="flex flex-col h-full min-h-[100px]">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Programme
            </p>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                No active programme
              </p>
              <p className="text-xs text-indigo-500 mt-1">
                Tap to create one
              </p>
            </div>
          </div>
        </BentoCard>
      </Link>
    )
  }

  return (
    <Link to={`/programmes/${programme.id}`} className="block">
      <BentoCard size="1x1" onClick={() => {}}>
        <div className="flex flex-col h-full min-h-[100px]">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Active Programme
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {programme.name}
          </p>
          <div className="mt-2">
            <div className="h-1.5 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              Week {programme.currentWeek || 1}/{programme.durationWeeks}
            </span>
          </div>
        </div>
      </BentoCard>
    </Link>
  )
}
