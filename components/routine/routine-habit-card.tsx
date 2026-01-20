'use client'

import { format, isSameDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Area, Habit } from '@/types/database.types'

interface RoutineHabitCardProps {
  habit: Habit & { area?: Area }
  weekDays: Date[]
  streak: number
  isHabitCompletedOnDate: (habitId: string, date: Date) => boolean
}

export function RoutineHabitCard({
  habit,
  weekDays,
  streak,
  isHabitCompletedOnDate,
}: RoutineHabitCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{habit.name}</h3>
          <div className="flex items-center gap-2">
            {habit.area && (
              <Badge variant="secondary">
                {habit.area.icon} {habit.area.name}
              </Badge>
            )}
            {streak > 0 && (
              <Badge variant="warning">
                🔥 {streak} {streak === 1 ? 'dia' : 'dias'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isCompleted = isHabitCompletedOnDate(habit.id, day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                isCompleted
                  ? 'bg-mario-green text-white'
                  : isToday
                    ? 'bg-background-light border-2 border-mario-red'
                    : 'bg-background-light'
              }`}
            >
              {isCompleted ? '✓' : format(day, 'd')}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
