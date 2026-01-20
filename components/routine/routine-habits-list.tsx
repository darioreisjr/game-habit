'use client'

import { Card } from '@/components/ui/card'
import type { Area, Habit } from '@/types/database.types'
import { RoutineHabitCard } from './routine-habit-card'

interface RoutineHabitsListProps {
  habits: (Habit & { area?: Area })[]
  weekDays: Date[]
  streaksByHabit: Map<string, number>
  isHabitCompletedOnDate: (habitId: string, date: Date) => boolean
}

export function RoutineHabitsList({
  habits,
  weekDays,
  streaksByHabit,
  isHabitCompletedOnDate,
}: RoutineHabitsListProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-semibold">Hábitos da Semana</h2>

      {habits.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary">Você ainda não tem hábitos configurados.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <RoutineHabitCard
              key={habit.id}
              habit={habit}
              weekDays={weekDays}
              streak={streaksByHabit.get(habit.id) || 0}
              isHabitCompletedOnDate={isHabitCompletedOnDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
