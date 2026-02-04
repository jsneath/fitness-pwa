import { Header } from '../components/layout'
import {
  BentoGrid,
  QuickActionsCard,
  ProgrammesCard,
  StreakCounter,
  TodayProgressCard,
  ActiveProgrammeCard,
  RecentWorkoutsCard,
  WeeklyVolumeCard,
  PRHighlightCard
} from '../components/home'

export default function HomePage() {
  return (
    <>
      <Header showLogo />

      <div className="pt-24 space-y-3">
        {/* Quick Actions - Start Workout & Programmes */}
        <BentoGrid>
          <QuickActionsCard />
          <ProgrammesCard />
        </BentoGrid>

        {/* Active Programme & PR */}
        <BentoGrid>
          <ActiveProgrammeCard />
          <PRHighlightCard />
        </BentoGrid>

        {/* Stats Row */}
        <BentoGrid>
          <StreakCounter />
          <WeeklyVolumeCard />
        </BentoGrid>

        {/* Today's Progress - Full width */}
        <BentoGrid>
          <TodayProgressCard />
        </BentoGrid>

        {/* Recent Workouts */}
        <BentoGrid>
          <RecentWorkoutsCard />
        </BentoGrid>
      </div>
    </>
  )
}
