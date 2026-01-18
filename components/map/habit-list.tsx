'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { EmptyState } from '@/components/map/empty-state'
import { HabitCard } from '@/components/map/habit-card'
import { HabitPeriodGroup } from '@/components/map/habit-period-group'
import { Button } from '@/components/ui/button'
import { getTimePeriodFromTime, type TimePeriod } from '@/lib/constants'
import type { Habit, HabitDifficulty } from '@/types/database.types'

interface RecentCheckin {
  habit_id: string
  date: string
}

interface GroupedHabits {
  morning: Habit[]
  afternoon: Habit[]
  evening: Habit[]
}

interface HabitListProps {
  habits: Habit[]
  completedHabitIds: Set<string>
  completingHabit: string | null
  recentCheckins: RecentCheckin[]
  userName: string
  onCompleteHabit: (habitId: string, difficulty: HabitDifficulty) => void
  onArchiveHabit: (habitId: string) => void
}

export function HabitList({
  habits,
  completedHabitIds,
  completingHabit,
  recentCheckins,
  userName,
  onCompleteHabit,
  onArchiveHabit,
}: HabitListProps) {
  const router = useRouter()

  const groupedHabits = useMemo(() => {
    const groups: GroupedHabits = {
      morning: [],
      afternoon: [],
      evening: [],
    }

    habits.forEach((habit) => {
      const period = getTimePeriodFromTime(habit.preferred_time)
      groups[period].push(habit)
    })

    return groups
  }, [habits])

  const hasMultiplePeriods = useMemo(() => {
    const nonEmptyPeriods = Object.values(groupedHabits).filter((g) => g.length > 0)
    return nonEmptyPeriods.length > 1
  }, [groupedHabits])

  const getCompletedCountForPeriod = useCallback(
    (periodHabits: Habit[]) => {
      return periodHabits.filter((h) => completedHabitIds.has(h.id)).length
    },
    [completedHabitIds]
  )

  const renderHabitCard = useCallback(
    (habit: Habit) => (
      <HabitCard
        key={habit.id}
        habit={habit}
        isCompleted={completedHabitIds.has(habit.id)}
        isLoading={completingHabit === habit.id}
        recentCheckins={recentCheckins}
        onComplete={onCompleteHabit}
        onArchive={onArchiveHabit}
      />
    ),
    [completedHabitIds, completingHabit, recentCheckins, onCompleteHabit, onArchiveHabit]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold">Fases de Hoje</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push('/habits?new=1')}
          className="gap-2"
        >
          <Plus size={16} />
          Novo
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState variant="no-habits" userName={userName} />
      ) : hasMultiplePeriods ? (
        <div className="space-y-4">
          {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((period) => {
            const periodHabits = groupedHabits[period]
            if (periodHabits.length === 0) return null

            return (
              <HabitPeriodGroup
                key={period}
                period={period}
                count={periodHabits.length}
                completedCount={getCompletedCountForPeriod(periodHabits)}
              >
                {periodHabits.map(renderHabitCard)}
              </HabitPeriodGroup>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">{habits.map(renderHabitCard)}</div>
      )}
    </div>
  )
}
