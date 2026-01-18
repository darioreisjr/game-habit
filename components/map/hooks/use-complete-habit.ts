'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { GAME_CONFIG } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { getLevelFromXP, getXPForDifficulty } from '@/lib/utils'
import type { Checkin, HabitDifficulty, Stats } from '@/types/database.types'

interface UseCompleteHabitOptions {
  initialCheckins: Checkin[]
  initialStats: Stats
  onAllCompleted?: () => void
  totalHabits: number
}

interface UseCompleteHabitReturn {
  localCheckins: Checkin[]
  localStats: Stats
  completingHabit: string | null
  completedHabitIds: Set<string>
  completeHabit: (habitId: string, difficulty: HabitDifficulty) => Promise<void>
  setLocalStats: React.Dispatch<React.SetStateAction<Stats>>
}

export function useCompleteHabit({
  initialCheckins,
  initialStats,
  onAllCompleted,
  totalHabits,
}: UseCompleteHabitOptions): UseCompleteHabitReturn {
  const [completingHabit, setCompletingHabit] = useState<string | null>(null)
  const [localCheckins, setLocalCheckins] = useState<Checkin[]>(initialCheckins)
  const [localStats, setLocalStats] = useState<Stats>(initialStats)

  const completedHabitIds = new Set(localCheckins.map((c) => c.habit_id))

  const completeHabit = useCallback(
    async (habitId: string, difficulty: HabitDifficulty) => {
      setCompletingHabit(habitId)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const today = new Date().toISOString().split('T')[0]

      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.', { position: 'top-right' })
        setCompletingHabit(null)
        return
      }

      const alreadyCompleted = localCheckins.some((c) => c.habit_id === habitId && c.date === today)
      if (alreadyCompleted) {
        setCompletingHabit(null)
        return
      }

      // Optimistic update - create checkin
      const optimisticCheckin: Checkin = {
        id: crypto.randomUUID(),
        habit_id: habitId,
        user_id: user.id,
        date: today,
        created_at: new Date().toISOString(),
      }

      setLocalCheckins((prev) => [...prev, optimisticCheckin])

      // Optimistic update - update stats
      const xpGain = getXPForDifficulty(difficulty)
      const previousStats = localStats

      setLocalStats((prev) => {
        const newXp = prev.xp + xpGain
        const newLevel = getLevelFromXP(newXp)
        const coinGain =
          Math.floor(newXp / GAME_CONFIG.XP_PER_COIN) -
          Math.floor(prev.xp / GAME_CONFIG.XP_PER_COIN)
        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          coins: prev.coins + coinGain,
        }
      })

      // Check if all habits are now completed
      const newCompletedCount = localCheckins.length + 1
      if (newCompletedCount === totalHabits && onAllCompleted) {
        onAllCompleted()
      }

      // Persist to database
      const { error } = await supabase.from('checkins').insert({
        habit_id: habitId,
        user_id: user.id,
        date: today,
      })

      // Handle error - rollback optimistic updates
      if (error && error.code !== '23505') {
        console.error('Erro ao salvar checkin:', error)
        toast.error(`Não foi possível salvar o checkin: ${error.message}`, {
          position: 'top-right',
        })
        setLocalCheckins((prev) =>
          prev.filter((c) => !(c.habit_id === habitId && c.date === today))
        )
        setLocalStats(previousStats)
      }

      setCompletingHabit(null)
    },
    [localCheckins, localStats, totalHabits, onAllCompleted]
  )

  return {
    localCheckins,
    localStats,
    completingHabit,
    completedHabitIds,
    completeHabit,
    setLocalStats,
  }
}
