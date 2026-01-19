'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CompletionMessage } from '@/components/map/completion-message'
import { ConfettiCelebration } from '@/components/map/confetti-celebration'
import { DailyProgressBanner } from '@/components/map/daily-progress-banner'
import { HabitList } from '@/components/map/habit-list'
import { useCompleteHabit } from '@/components/map/hooks/use-complete-habit'
import { useRealtimeStats } from '@/components/map/hooks/use-realtime-stats'
import { MapHeader } from '@/components/map/map-header'
import { AnimatedCoinsDisplay } from '@/components/ui/animated-coins-display'
import { createClient } from '@/lib/supabase/client'
import type { Checkin, Habit, Profile, Stats, Streak } from '@/types/database.types'

interface RecentCheckin {
  habit_id: string
  date: string
}

interface MapViewProps {
  stats: Stats
  profile: Profile
  habits: Habit[]
  checkins: Checkin[]
  streak?: Streak | null
  recentCheckins?: RecentCheckin[]
}

export function MapView({
  stats,
  profile,
  habits,
  checkins,
  streak,
  recentCheckins = [],
}: MapViewProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [justCompletedAll, setJustCompletedAll] = useState(false)

  const handleAllCompleted = useCallback(() => {
    if (!justCompletedAll) {
      setShowConfetti(true)
      setJustCompletedAll(true)
    }
  }, [justCompletedAll])

  const {
    localCheckins,
    localStats,
    completingHabit,
    completedHabitIds,
    completeHabit,
    setLocalStats,
  } = useCompleteHabit({
    initialCheckins: checkins,
    initialStats: stats,
    onAllCompleted: handleAllCompleted,
    totalHabits: habits.length,
  })

  // Subscribe to realtime stats updates
  useRealtimeStats({
    userId: stats.user_id,
    onStatsUpdate: setLocalStats,
    currentStats: localStats,
  })

  // Check if all habits are completed on mount/update
  const progress = habits.length > 0 ? (completedHabitIds.size / habits.length) * 100 : 0

  useEffect(() => {
    if (progress === 100 && habits.length > 0 && !justCompletedAll) {
      setShowConfetti(true)
      setJustCompletedAll(true)
    }
  }, [progress, habits.length, justCompletedAll])

  const handleArchiveHabit = useCallback(
    async (habitId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', habitId)

      if (error) {
        toast.error('Erro ao arquivar hábito', { position: 'top-right' })
      } else {
        toast.success('Hábito arquivado', { position: 'top-right' })
        router.refresh()
      }
    },
    [router]
  )

  return (
    <div className="min-h-screen md:ml-64">
      <ConfettiCelebration trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-2xl mx-auto p-4 md:p-6 md:py-8 space-y-6">
        <MapHeader profile={profile} stats={localStats} streak={streak} />

        <DailyProgressBanner habits={habits} completedHabitIds={completedHabitIds} />

        <HabitList
          habits={habits}
          completedHabitIds={completedHabitIds}
          completingHabit={completingHabit}
          recentCheckins={recentCheckins}
          userName={profile.name}
          onCompleteHabit={completeHabit}
          onArchiveHabit={handleArchiveHabit}
          onHabitCreated={() => router.refresh()}
        />

        <CompletionMessage isVisible={progress === 100 && habits.length > 0} />
      </div>

      <AnimatedCoinsDisplay coins={localStats.coins} />
    </div>
  )
}
