'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import type { Area, Checkin, Habit, HabitDifficulty } from '@/types/database.types'
import { HistoryCalendar } from './history-calendar'
import { HistoryStats } from './history-stats'

interface HistoryViewProps {
  habit: Habit & { area?: Area }
  checkins: Checkin[]
}

export function HistoryView({ habit, checkins }: HistoryViewProps) {
  const router = useRouter()

  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-background-light transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold">{habit.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {habit.area && (
                <Badge variant="secondary">
                  {habit.area.icon} {habit.area.name}
                </Badge>
              )}
              <Badge variant={DIFFICULTY_CONFIG[habit.difficulty as HabitDifficulty].variant}>
                +{DIFFICULTY_CONFIG[habit.difficulty as HabitDifficulty].xp} XP
              </Badge>
            </div>
          </div>
        </div>

        <HistoryStats checkins={checkins} />

        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Calendário de Conclusões</h2>
          <HistoryCalendar checkins={checkins} />
        </Card>

        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico Recente</h2>
          <HistoryRecentList checkins={checkins} />
        </Card>
      </div>
    </div>
  )
}

interface HistoryRecentListProps {
  checkins: Checkin[]
}

function HistoryRecentList({ checkins }: HistoryRecentListProps) {
  if (checkins.length === 0) {
    return (
      <p className="text-text-secondary text-center py-8">Nenhuma conclusão registrada ainda.</p>
    )
  }

  const recentCheckins = checkins.slice(0, 10)

  return (
    <div className="space-y-2">
      {recentCheckins.map((checkin) => (
        <div
          key={checkin.id}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-background-light"
        >
          <span className="text-sm font-medium">{formatDate(checkin.date)}</span>
          <Badge variant="success">Completo</Badge>
        </div>
      ))}
      {checkins.length > 10 && (
        <p className="text-xs text-text-secondary text-center pt-2">
          E mais {checkins.length - 10} conclusões anteriores
        </p>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) {
    return 'Hoje'
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Ontem'
  }

  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
