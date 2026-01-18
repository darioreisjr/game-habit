'use client'

import { Zap } from 'lucide-react'
import { useMemo } from 'react'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Habit, HabitDifficulty } from '@/types/database.types'

interface DailyXPPreviewProps {
  habits: Habit[]
  completedHabitIds: Set<string>
  className?: string
}

export function DailyXPPreview({ habits, completedHabitIds, className }: DailyXPPreviewProps) {
  const { earnedXP, remainingXP } = useMemo(() => {
    let total = 0
    let earned = 0

    habits.forEach((habit) => {
      const xp = DIFFICULTY_CONFIG[habit.difficulty as HabitDifficulty]?.xp || 10
      total += xp
      if (completedHabitIds.has(habit.id)) {
        earned += xp
      }
    })

    return {
      totalXP: total,
      earnedXP: earned,
      remainingXP: total - earned,
    }
  }, [habits, completedHabitIds])

  if (habits.length === 0) return null

  const allCompleted = remainingXP === 0

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        allCompleted ? 'text-mario-green' : 'text-text-secondary',
        className
      )}
    >
      <Zap size={16} className={allCompleted ? 'text-mario-green' : 'text-mario-yellow'} />
      {allCompleted ? (
        <span className="font-medium">+{earnedXP} XP ganhos hoje!</span>
      ) : (
        <span>
          Complete tudo e ganhe{' '}
          <span className="font-semibold text-mario-yellow">+{remainingXP} XP</span>
        </span>
      )}
    </div>
  )
}
