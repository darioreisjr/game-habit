'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Checkin } from '@/types/database.types'

interface HistoryCalendarProps {
  checkins: Checkin[]
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function HistoryCalendar({ checkins }: HistoryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const checkinDates = useMemo(() => {
    return new Set(checkins.map((c) => c.date))
  }, [checkins])

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const startDay = firstDayOfMonth.getDay()
    const totalDays = lastDayOfMonth.getDate()

    const days: (number | null)[] = []

    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(day)
    }

    return days
  }, [currentDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const isCompleted = (day: number): boolean => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return checkinDates.has(dateStr)
  }

  const isToday = (day: number): boolean => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isFuture = (day: number): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return checkDate > today
  }

  const completedCount = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    let count = 0

    checkinDates.forEach((dateStr) => {
      const date = new Date(dateStr)
      if (date.getFullYear() === year && date.getMonth() === month) {
        count++
      }
    })

    return count
  }, [checkinDates, currentDate])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-full hover:bg-background-light transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h3 className="font-semibold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <p className="text-xs text-text-secondary">
            {completedCount} {completedCount === 1 ? 'conclusão' : 'conclusões'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-full hover:bg-background-light transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-text-secondary py-2">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              'aspect-square flex items-center justify-center text-sm rounded-lg',
              day === null && 'invisible',
              day !== null && isFuture(day) && 'text-text-secondary/50',
              day !== null && isToday(day) && 'ring-2 ring-mario-blue',
              day !== null && isCompleted(day) && 'bg-mario-green text-white font-medium',
              day !== null && !isCompleted(day) && !isFuture(day) && 'bg-background-light'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-mario-green" />
          <span className="text-xs text-text-secondary">Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-background-light" />
          <span className="text-xs text-text-secondary">Não concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white ring-2 ring-mario-blue" />
          <span className="text-xs text-text-secondary">Hoje</span>
        </div>
      </div>
    </div>
  )
}
