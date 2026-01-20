'use client'

import { addDays, addWeeks, format, startOfDay, startOfWeek, subWeeks } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Area, Checkin, Habit } from '@/types/database.types'
import { RoutineHabitsList } from './routine-habits-list'
import { RoutineWeekNavigator } from './routine-week-navigator'

export function RoutineView() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [habits, setHabits] = useState<(Habit & { area?: Area })[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 6)

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

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const checkinsByDate = useMemo(() => {
    const map = new Map<string, Checkin[]>()
    for (const checkin of checkins) {
      const existing = map.get(checkin.date) || []
      existing.push(checkin)
      map.set(checkin.date, existing)
    }
    return map
  }, [checkins])

  const checkinKeys = useMemo(
    () => new Set(checkins.map((c) => `${c.habit_id}-${c.date}`)),
    [checkins]
  )

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return checkinKeys.has(`${habitId}-${dateStr}`)
  }

  const streaksByHabit = useMemo(() => {
    const streaks = new Map<string, number>()

    for (const habit of habits) {
      let streak = 0
      let currentDate = startOfDay(new Date())

      while (streak < 365) {
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
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Rotina</h1>
          <p className="text-text-secondary mt-1">Acompanhe seu progresso semanal</p>
        </div>

        <RoutineWeekNavigator
          currentWeek={currentWeek}
          weekStart={weekStart}
          weekDays={weekDays}
          habits={habits}
          checkinsByDate={checkinsByDate}
          onPreviousWeek={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          onNextWeek={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        />

        <RoutineHabitsList
          habits={habits}
          weekDays={weekDays}
          streaksByHabit={streaksByHabit}
          isHabitCompletedOnDate={isHabitCompletedOnDate}
        />
      </div>
    </div>
  )
}
