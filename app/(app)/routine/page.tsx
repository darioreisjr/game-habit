'use client'

import { addDays, addWeeks, format, isSameDay, startOfDay, startOfWeek, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Area, Checkin, Habit } from '@/types/database.types'

export default function RoutinePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [habits, setHabits] = useState<(Habit & { area?: Area })[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 6)

      // Otimização: Promise.all para queries paralelas
      const [habitsResult, checkinsResult] = await Promise.all([
        supabase
          .from('habits')
          .select('*, area:areas(*)')
          .eq('is_archived', false)
          .order('created_at'),
        supabase
          .from('checkins')
          .select('*')
          .gte('date', format(weekStart, 'yyyy-MM-dd'))
          .lte('date', format(weekEnd, 'yyyy-MM-dd')),
      ])

      if (habitsResult.data) setHabits(habitsResult.data as any)
      if (checkinsResult.data) setCheckins(checkinsResult.data)
    }

    loadData()
  }, [currentWeek])

  // Otimização: useMemo para weekStart e weekDays (evita recálculo a cada render)
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Otimização: índice de checkins por data para lookup O(1)
  const checkinsByDate = useMemo(() => {
    const map = new Map<string, Checkin[]>()
    for (const checkin of checkins) {
      const existing = map.get(checkin.date) || []
      existing.push(checkin)
      map.set(checkin.date, existing)
    }
    return map
  }, [checkins])

  // Otimização: Set de checkins por habitId-date para lookup O(1)
  const checkinKeys = useMemo(
    () => new Set(checkins.map((c) => `${c.habit_id}-${c.date}`)),
    [checkins]
  )

  const getCheckinsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return checkinsByDate.get(dateStr) || []
  }

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return checkinKeys.has(`${habitId}-${dateStr}`)
  }

  // Otimização: pré-calcular streaks para todos os hábitos de uma vez
  const streaksByHabit = useMemo(() => {
    const streaks = new Map<string, number>()

    for (const habit of habits) {
      let streak = 0
      let currentDate = startOfDay(new Date())

      while (streak < 365) {
        // Limite de segurança para evitar loop infinito
        const dateStr = format(currentDate, 'yyyy-MM-dd')
        if (!checkinKeys.has(`${habit.id}-${dateStr}`)) break
        streak++
        currentDate = addDays(currentDate, -1)
      }

      streaks.set(habit.id, streak)
    }

    return streaks
  }, [habits, checkinKeys])

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Rotina</h1>
        <p className="text-text-secondary mt-1">Acompanhe seu progresso semanal</p>
      </div>

      {/* Week Navigator */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 hover:bg-background-light rounded-lg transition-colors"
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
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 hover:bg-background-light rounded-lg transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayCheckins = getCheckinsForDate(day)
            const isToday = isSameDay(day, new Date())
            const completionRate =
              habits.length > 0 ? (dayCheckins.length / habits.length) * 100 : 0

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

      {/* Habits Grid */}
      <div className="space-y-3">
        <h2 className="text-xl font-display font-semibold">Hábitos da Semana</h2>

        {habits.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">Você ainda não tem hábitos configurados.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const streak = streaksByHabit.get(habit.id) || 0

              return (
                <Card key={habit.id} className="p-4">
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
            })}
          </div>
        )}
      </div>
    </div>
  )
}
