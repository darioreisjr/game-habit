'use client'

import { Calendar, Flame, Target, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import type { Checkin } from '@/types/database.types'

interface HistoryStatsProps {
  checkins: Checkin[]
}

export function HistoryStats({ checkins }: HistoryStatsProps) {
  const stats = useMemo(() => {
    const totalCompletions = checkins.length
    const { currentStreak, longestStreak } = calculateStreaks(checkins)
    const completionRate = calculateCompletionRate(checkins)

    return {
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate,
    }
  }, [checkins])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={Target}
        label="Total de Conclusões"
        value={stats.totalCompletions}
        color="text-mario-blue"
      />
      <StatCard
        icon={Flame}
        label="Sequência Atual"
        value={`${stats.currentStreak}d`}
        color="text-mario-red"
      />
      <StatCard
        icon={TrendingUp}
        label="Maior Sequência"
        value={`${stats.longestStreak}d`}
        color="text-mario-yellow"
      />
      <StatCard
        icon={Calendar}
        label="Taxa de Conclusão"
        value={`${stats.completionRate}%`}
        color="text-mario-green"
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
  color: string
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-background-light ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function calculateStreaks(checkins: Checkin[]): { currentStreak: number; longestStreak: number } {
  if (checkins.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const dates = checkins.map((c) => c.date).sort((a, b) => b.localeCompare(a))

  const dateSet = new Set(dates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let currentStreak = 0
  let checkDate = new Date(today)

  const todayStr = checkDate.toISOString().split('T')[0]
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
    currentStreak = 0
  } else {
    if (!dateSet.has(todayStr)) {
      checkDate = yesterdayDate
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (dateSet.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  const sortedDatesAsc = [...dates].sort((a, b) => a.localeCompare(b))
  let longestStreak = 0
  let tempStreak = 1

  for (let i = 1; i < sortedDatesAsc.length; i++) {
    const prevDate = new Date(sortedDatesAsc[i - 1])
    const currDate = new Date(sortedDatesAsc[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      tempStreak++
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return { currentStreak, longestStreak }
}

function calculateCompletionRate(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0

  const dates = checkins.map((c) => c.date)
  const firstDate = new Date(Math.min(...dates.map((d) => new Date(d).getTime())))
  const today = new Date()

  const daysSinceStart =
    Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const rate = Math.round((checkins.length / daysSinceStart) * 100)
  return Math.min(rate, 100)
}
