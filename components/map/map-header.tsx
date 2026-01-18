'use client'

import { useMemo } from 'react'
import { MotivationalQuote } from '@/components/map/motivational-quote'
import { StreakCounter } from '@/components/map/streak-counter'
import { StatsDisplay } from '@/components/ui/stats-display'
import type { Profile, Stats, Streak } from '@/types/database.types'

interface MapHeaderProps {
  profile: Profile
  stats: Stats
  streak?: Streak | null
}

export function MapHeader({ profile, stats, streak }: MapHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            {greeting}, {profile.name}!
          </h1>
          <p className="text-text-secondary mt-1">Mundo 1-1: Hoje</p>
        </div>
        <StreakCounter currentStreak={streak?.current_streak || 0} />
      </div>

      <StatsDisplay
        level={stats.level}
        xp={stats.xp}
        coins={stats.coins}
        variant="compact"
        hideCoins
      />

      <MotivationalQuote />
    </div>
  )
}
