'use client'

import { addDays, addWeeks, format, isSameDay, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Checkin, Habit } from '@/types/database.types'

interface RoutineWeekNavigatorProps {
  currentWeek: Date
  weekStart: Date
  weekDays: Date[]
  habits: Habit[]
  checkinsByDate: Map<string, Checkin[]>
  onPreviousWeek: () => void
  onNextWeek: () => void
}

export function RoutineWeekNavigator({
  currentWeek,
  weekStart,
  weekDays,
  habits,
  checkinsByDate,
  onPreviousWeek,
  onNextWeek,
}: RoutineWeekNavigatorProps) {
  const getCheckinsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return checkinsByDate.get(dateStr) || []
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPreviousWeek}
          className="p-2 hover:bg-background-light rounded-lg transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <div className="font-display font-semibold text-lg">
            {format(weekStart, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <div className="text-sm text-text-secondary">
            {format(weekStart, 'dd/MM')} - {format(addDays(weekStart, 6), 'dd/MM')}
          </div>
        </div>

        <button
          type="button"
          onClick={onNextWeek}
          className="p-2 hover:bg-background-light rounded-lg transition-colors"
          aria-label="Próxima semana"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayCheckins = getCheckinsForDate(day)
          const isToday = isSameDay(day, new Date())
          const completionRate = habits.length > 0 ? (dayCheckins.length / habits.length) * 100 : 0

          return (
            <div
              key={day.toISOString()}
              className={`p-3 rounded-xl text-center transition-all ${
                isToday
                  ? 'bg-mario-red/10 border-2 border-mario-red'
                  : 'bg-background-light border-2 border-transparent'
              }`}
            >
              <div className="text-xs text-text-secondary font-medium mb-1">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className={`text-lg font-bold mb-2 ${isToday ? 'text-mario-red' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="text-xs">
                <div className="text-text-secondary mb-1">
                  {dayCheckins.length}/{habits.length}
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mario-green transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
