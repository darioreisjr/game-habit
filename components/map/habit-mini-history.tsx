'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface HabitMiniHistoryProps {
  habitId: string
  recentCheckins: { date: string; habit_id: string }[]
  className?: string
}

export function HabitMiniHistory({ habitId, recentCheckins, className }: HabitMiniHistoryProps) {
  const last7Days = useMemo(() => {
    const days: { date: string; completed: boolean }[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const completed = recentCheckins.some(
        (checkin) => checkin.habit_id === habitId && checkin.date === dateStr
      )

      days.push({ date: dateStr, completed })
    }

    return days
  }, [habitId, recentCheckins])

  const streakCount = useMemo(() => {
    let count = 0
    for (let i = last7Days.length - 1; i >= 0; i--) {
      if (last7Days[i].completed) {
        count++
      } else {
        break
      }
    }
    return count
  }, [last7Days])

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {last7Days.map((day, index) => (
        <div
          key={day.date}
          className={cn(
            'w-2 h-2 rounded-full transition-all',
            day.completed
              ? 'bg-mario-green'
              : index === last7Days.length - 1
                ? 'bg-border ring-1 ring-mario-blue/50'
                : 'bg-border'
          )}
          title={`${day.date}: ${day.completed ? 'Completo' : 'Não completo'}`}
        />
      ))}
      {streakCount > 1 && (
        <span className="text-[10px] text-mario-green font-medium ml-1">{streakCount}d</span>
      )}
    </div>
  )
}
