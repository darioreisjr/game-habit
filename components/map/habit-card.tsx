'use client'

import { Check } from 'lucide-react'
import { HabitContextMenu } from '@/components/map/habit-context-menu'
import { HabitMiniHistory } from '@/components/map/habit-mini-history'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Habit, HabitDifficulty } from '@/types/database.types'

interface RecentCheckin {
  habit_id: string
  date: string
}

interface HabitCardProps {
  habit: Habit
  isCompleted: boolean
  isLoading: boolean
  recentCheckins: RecentCheckin[]
  onComplete: (habitId: string, difficulty: HabitDifficulty) => void
  onArchive: (habitId: string) => void
}

export function HabitCard({
  habit,
  isCompleted,
  isLoading,
  recentCheckins,
  onComplete,
  onArchive,
}: HabitCardProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[habit.difficulty as HabitDifficulty]

  return (
    <Card
      className={cn(
        'transition-all duration-quick',
        isCompleted && 'bg-mario-green/5 border-mario-green/30'
      )}
    >
      <div className="p-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => !isCompleted && onComplete(habit.id, habit.difficulty)}
          disabled={isCompleted || isLoading}
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all',
            isCompleted
              ? 'bg-mario-green border-mario-green text-white'
              : 'border-border hover:border-mario-red hover:scale-110'
          )}
        >
          {isCompleted ? (
            <Check size={24} />
          ) : (
            <div className="w-6 h-6 rounded-full bg-background-light" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={cn(
                'font-medium truncate',
                isCompleted && 'line-through text-text-secondary'
              )}
            >
              {habit.name}
            </h3>
            {isCompleted && <Badge variant="success">Completo!</Badge>}
          </div>

          <div className="flex items-center gap-3">
            {habit.area && (
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                <span>{habit.area.icon}</span>
                <span>{habit.area.name}</span>
              </div>
            )}
            <HabitMiniHistory
              habitId={habit.id}
              recentCheckins={recentCheckins}
              className="hidden sm:flex"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={difficultyConfig.variant}>+{difficultyConfig.xp} XP</Badge>
          <HabitContextMenu habitId={habit.id} habitName={habit.name} onArchive={onArchive} />
        </div>
      </div>
    </Card>
  )
}
