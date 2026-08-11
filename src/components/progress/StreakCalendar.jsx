import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { todayKey, shiftDateKey, parseDateKey, LOCALE } from '../../utils/dates'

export default function StreakCalendar({ workoutDates = [], weeks = 12 }) {
  const calendarData = useMemo(() => {
    const today = todayKey()

    // Anchor the grid on the END of the current week, then count back.
    //
    // It used to be anchored on the start instead — today minus (weeks * 7)
    // rounded back to a Sunday — which made the final column the Saturday
    // *before* the current week. Today was never on the calendar at all, so
    // neither was any workout done this week.
    const endKey = shiftDateKey(today, 6 - parseDateKey(today).getDay())
    const startKey = shiftDateKey(endKey, -(weeks * 7) + 1)

    const workoutSet = new Set(workoutDates)
    const data = []

    for (let week = 0; week < weeks; week++) {
      const weekData = []
      for (let day = 0; day < 7; day++) {
        const dateStr = shiftDateKey(startKey, week * 7 + day)
        const asDate = parseDateKey(dateStr)

        weekData.push({
          date: dateStr,
          hasWorkout: workoutSet.has(dateStr),
          isToday: dateStr === today,
          isFuture: dateStr > today,
          day: asDate.getDate(),
          month: asDate.getMonth()
        })
      }
      data.push(weekData)
    }

    return data
  }, [workoutDates, weeks])

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1

    calendarData.forEach((week, weekIndex) => {
      const firstDay = week[0]
      if (firstDay.month !== lastMonth) {
        labels.push({
          month: parseDateKey(firstDay.date).toLocaleDateString(LOCALE, { month: 'short' }),
          weekIndex
        })
        lastMonth = firstDay.month
      }
    })

    return labels
  }, [calendarData])

  const getIntensityClass = (hasWorkout, isFuture) => {
    if (isFuture) return 'bg-slate-100 dark:bg-dark-border/50'
    if (!hasWorkout) return 'bg-slate-200 dark:bg-dark-border'
    return 'bg-emerald-500'
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-slate-200 dark:border-dark-border"
    >
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Activity
      </h3>

      {/* Month labels */}
      <div className="flex mb-1 pl-7">
        {monthLabels.map((label, index) => (
          <div
            key={index}
            className="text-[10px] text-slate-400 dark:text-slate-500"
            style={{
              marginLeft: index === 0 ? 0 : `${(label.weekIndex - (monthLabels[index - 1]?.weekIndex || 0)) * 14 - 14}px`
            }}
          >
            {label.month}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-1">
          {dayLabels.map((day, index) => (
            <div
              key={index}
              className="w-5 h-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center"
            >
              {index % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-[2px] overflow-x-auto">
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                  className={`w-3 h-3 rounded-sm ${getIntensityClass(day.hasWorkout, day.isFuture)} ${
                    day.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-dark-surface' : ''
                  }`}
                  title={`${day.date}: ${day.hasWorkout ? 'Workout completed' : 'No workout'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-dark-border" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </motion.div>
  )
}
