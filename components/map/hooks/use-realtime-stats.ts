'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Stats } from '@/types/database.types'

interface UseRealtimeStatsOptions {
  userId: string
  onStatsUpdate: (stats: Stats) => void
  currentStats: Stats
}

export function useRealtimeStats({
  userId,
  onStatsUpdate,
  currentStats,
}: UseRealtimeStatsOptions): void {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('stats-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newStats = payload.new as Stats
          // Only update if XP or coins increased (prevents overwriting optimistic updates)
          if (newStats.xp > currentStats.xp || newStats.coins > currentStats.coins) {
            onStatsUpdate(newStats)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onStatsUpdate, currentStats])
}
