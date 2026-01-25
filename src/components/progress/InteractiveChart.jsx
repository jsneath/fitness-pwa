import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-dark-surface p-3 rounded-xl shadow-lg border border-slate-200 dark:border-dark-border"
      >
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()} {entry.unit || ''}
          </p>
        ))}
      </motion.div>
    )
  }
  return null
}

export default function InteractiveChart({
  data,
  dataKey = 'value',
  xAxisKey = 'date',
  title,
  subtitle,
  color = '#6366f1',
  gradientId = 'chartGradient',
  unit = '',
  showBrush = false,
  height = 200
}) {
  const [activeIndex, setActiveIndex] = useState(null)

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((item, index) => ({
      ...item,
      index
    }))
  }, [data])

  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null
    const values = chartData.map(d => d[dataKey]).filter(v => v != null)
    if (values.length === 0) return null

    return {
      current: values[values.length - 1],
      max: Math.max(...values),
      min: Math.min(...values),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      change: values.length > 1 ? values[values.length - 1] - values[0] : 0,
      changePercent: values.length > 1 && values[0] !== 0
        ? Math.round(((values[values.length - 1] - values[0]) / values[0]) * 100)
        : 0
    }
  }, [chartData, dataKey])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-slate-200 dark:border-dark-border">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data available yet</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-slate-200 dark:border-dark-border"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        {stats && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {stats.current.toLocaleString()}{unit}
            </p>
            <p className={`text-sm font-medium ${
              stats.change >= 0
                ? 'text-emerald-500'
                : 'text-red-500'
            }`}>
              {stats.change >= 0 ? '+' : ''}{stats.change.toLocaleString()}{unit}
              <span className="text-slate-400 dark:text-slate-500 ml-1">
                ({stats.changePercent}%)
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onMouseMove={(state) => {
              if (state.activeTooltipIndex !== undefined) {
                setActiveIndex(state.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-slate-200 dark:text-dark-border"
            />

            <XAxis
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-slate-400 dark:text-slate-500"
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-slate-400 dark:text-slate-500"
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={1000}
              name={title}
              unit={unit}
            />

            {showBrush && chartData.length > 10 && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={color}
                fill="currentColor"
                className="text-slate-100 dark:text-dark-surface"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      {stats && (
        <div className="flex justify-between mt-4 pt-4 border-t border-slate-100 dark:border-dark-border">
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">Min</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {stats.min.toLocaleString()}{unit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">Avg</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {stats.avg.toLocaleString()}{unit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">Max</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {stats.max.toLocaleString()}{unit}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
