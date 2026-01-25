import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import BentoCard from './BentoCard'

export default function QuickActionsCard() {
  return (
    <Link to="/workout" className="block">
      <BentoCard size="1x1" gradient="primary" onClick={() => {}}>
        <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <svg className="w-10 h-10 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </motion.div>
          <span className="font-bold text-white text-sm">Start Workout</span>
        </div>
      </BentoCard>
    </Link>
  )
}
