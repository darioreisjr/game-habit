'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { HabitFormModal } from '@/components/habits/habit-form-modal'
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
  onHabitCreated?: () => void
}

export function HabitList({
  habits,
  completedHabitIds,
  completingHabit,
  recentCheckins,
  userName,
  onCompleteHabit,
  onArchiveHabit,
  onHabitCreated,
}: HabitListProps) {
  const [showNewHabitModal, setShowNewHabitModal] = useState(false)

  const sortHabitsByCompletion = useCallback(
    (habitsToSort: Habit[]) => {
      return [...habitsToSort].sort((a, b) => {
        const aCompleted = completedHabitIds.has(a.id)
        const bCompleted = completedHabitIds.has(b.id)
        if (aCompleted === bCompleted) return 0
        return aCompleted ? 1 : -1
      })
    },
    [completedHabitIds]
  )

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

    return {
      morning: sortHabitsByCompletion(groups.morning),
      afternoon: sortHabitsByCompletion(groups.afternoon),
      evening: sortHabitsByCompletion(groups.evening),
    }
  }, [habits, sortHabitsByCompletion])

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

  const sortedHabits = useMemo(() => {
    return sortHabitsByCompletion(habits)
  }, [habits, sortHabitsByCompletion])

  const renderHabitCard = useCallback(
    (habit: Habit) => (
      <motion.div
        key={habit.id}
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <HabitCard
          habit={habit}
          isCompleted={completedHabitIds.has(habit.id)}
          isLoading={completingHabit === habit.id}
          recentCheckins={recentCheckins}
          onComplete={onCompleteHabit}
          onArchive={onArchiveHabit}
        />
      </motion.div>
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
          onClick={() => setShowNewHabitModal(true)}
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
                <AnimatePresence mode="popLayout">
                  {periodHabits.map(renderHabitCard)}
                </AnimatePresence>
              </HabitPeriodGroup>
            )
          })}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">{sortedHabits.map(renderHabitCard)}</div>
        </AnimatePresence>
      )}

      <HabitFormModal
        isOpen={showNewHabitModal}
        onClose={() => setShowNewHabitModal(false)}
        onSuccess={() => {
          setShowNewHabitModal(false)
          onHabitCreated?.()
        }}
      />
    </div>
  )
}
