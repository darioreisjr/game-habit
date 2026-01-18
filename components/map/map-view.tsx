'use client'

import { Check, Flag, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfettiCelebration } from '@/components/map/confetti-celebration'
import { DailyXPPreview } from '@/components/map/daily-xp-preview'
import { EmptyState } from '@/components/map/empty-state'
import { HabitContextMenu } from '@/components/map/habit-context-menu'
import { HabitMiniHistory } from '@/components/map/habit-mini-history'
import { HabitPeriodGroup } from '@/components/map/habit-period-group'
import { MotivationalQuote } from '@/components/map/motivational-quote'
import { StreakCounter } from '@/components/map/streak-counter'
import { AnimatedCoinsDisplay } from '@/components/ui/animated-coins-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatsDisplay } from '@/components/ui/stats-display'
import { DIFFICULTY_CONFIG, getTimePeriodFromTime, type TimePeriod } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { cn, getLevelFromXP, getXPForDifficulty } from '@/lib/utils'
import type {
  Checkin,
  Habit,
  HabitDifficulty,
  Profile,
  Stats,
  Streak,
} from '@/types/database.types'

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

interface GroupedHabits {
  morning: Habit[]
  afternoon: Habit[]
  evening: Habit[]
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
  const [completingHabit, setCompletingHabit] = useState<string | null>(null)
  const [localCheckins, setLocalCheckins] = useState(checkins)
  const [localStats, setLocalStats] = useState(stats)
  const [showConfetti, setShowConfetti] = useState(false)
  const [justCompletedAll, setJustCompletedAll] = useState(false)

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
          filter: `user_id=eq.${stats.user_id}`,
        },
        (payload) => {
          const newStats = payload.new as Stats
          setLocalStats((prev) => {
            if (newStats.xp > prev.xp || newStats.coins > prev.coins) {
              return newStats
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [stats.user_id])

  const completedHabitIds = useMemo(
    () => new Set(localCheckins.map((c) => c.habit_id)),
    [localCheckins]
  )
  const completedCount = completedHabitIds.size
  const totalCount = habits.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const groupedHabits = useMemo(() => {
    const groups: GroupedHabits = {
      morning: [],
      afternoon: [],
      evening: [],
    }

    habits.forEach((habit) => {
      const period = getTimePeriodFromTime(habit.preferred_time)
      groups[period].push(habit)
    })

    return groups
  }, [habits])

  const hasMultiplePeriods = useMemo(() => {
    const nonEmptyPeriods = Object.values(groupedHabits).filter((g) => g.length > 0)
    return nonEmptyPeriods.length > 1
  }, [groupedHabits])

  useEffect(() => {
    if (progress === 100 && totalCount > 0 && !justCompletedAll) {
      setShowConfetti(true)
      setJustCompletedAll(true)
    }
  }, [progress, totalCount, justCompletedAll])

  const handleCompleteHabit = useCallback(
    async (habitId: string, difficulty: string) => {
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

      const optimisticCheckin = {
        id: crypto.randomUUID(),
        habit_id: habitId,
        user_id: user.id,
        date: today,
        created_at: new Date().toISOString(),
      }

      setLocalCheckins((prev) => [...prev, optimisticCheckin])

      const xpGain = getXPForDifficulty(difficulty as 'easy' | 'medium' | 'hard')
      const previousStats = localStats
      setLocalStats((prev) => {
        const newXp = prev.xp + xpGain
        const newLevel = getLevelFromXP(newXp)
        const newCoins = prev.coins + Math.floor(newXp / 50) - Math.floor(prev.xp / 50)
        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          coins: newCoins,
        }
      })

      const { error } = await supabase.from('checkins').insert({
        habit_id: habitId,
        user_id: user.id,
        date: today,
      })

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
    [localCheckins, localStats]
  )

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

  const renderHabitCard = useCallback(
    (habit: Habit) => {
      const isCompleted = completedHabitIds.has(habit.id)
      const isLoading = completingHabit === habit.id
      const difficultyConfig = DIFFICULTY_CONFIG[habit.difficulty as HabitDifficulty]

      return (
        <Card
          key={habit.id}
          className={cn(
            'transition-all duration-quick',
            isCompleted && 'bg-mario-green/5 border-mario-green/30'
          )}
        >
          <div className="p-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => !isCompleted && handleCompleteHabit(habit.id, habit.difficulty)}
              disabled={isCompleted || isLoading}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all',
                isCompleted
                  ? 'bg-mario-green border-mario-green text-white'
                  : 'border-border hover:border-mario-red hover:scale-110'
              )}
            >
              {isCompleted ? (
                <Check size={24} />
              ) : (
                <div className="w-6 h-6 rounded-full bg-background-light" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    'font-medium truncate',
                    isCompleted && 'line-through text-text-secondary'
                  )}
                >
                  {habit.name}
                </h3>
                {isCompleted && <Badge variant="success">Completo!</Badge>}
              </div>

              <div className="flex items-center gap-3">
                {habit.area && (
                  <div className="flex items-center gap-1 text-sm text-text-secondary">
                    <span>{habit.area.icon}</span>
                    <span>{habit.area.name}</span>
                  </div>
                )}
                <HabitMiniHistory
                  habitId={habit.id}
                  recentCheckins={recentCheckins}
                  className="hidden sm:flex"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={difficultyConfig.variant}>+{difficultyConfig.xp} XP</Badge>
              <HabitContextMenu
                habitId={habit.id}
                habitName={habit.name}
                onArchive={handleArchiveHabit}
              />
            </div>
          </div>
        </Card>
      )
    },
    [completedHabitIds, completingHabit, handleCompleteHabit, handleArchiveHabit, recentCheckins]
  )

  const getCompletedCountForPeriod = useCallback(
    (periodHabits: Habit[]) => {
      return periodHabits.filter((h) => completedHabitIds.has(h.id)).length
    },
    [completedHabitIds]
  )

  return (
    <div className="min-h-screen md:ml-64">
      <ConfettiCelebration trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-2xl mx-auto p-4 md:p-6 md:py-8 space-y-6">
        {/* Header */}
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
            level={localStats.level}
            xp={localStats.xp}
            coins={localStats.coins}
            variant="compact"
            hideCoins
          />

          <MotivationalQuote />
        </div>

        {/* Progress Banner */}
        <Card className="bg-gradient-to-r from-mario-red/10 to-mario-blue/10 border-mario-red/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold text-lg">Missão do Dia</h3>
                <p className="text-sm text-text-secondary">
                  {completedCount} de {totalCount} fases concluídas
                </p>
              </div>
              <div className="text-4xl">
                {progress === 100 ? <Flag className="text-mario-yellow" size={40} /> : '🎯'}
              </div>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mario-red to-mario-blue transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3">
              <DailyXPPreview habits={habits} completedHabitIds={completedHabitIds} />
            </div>
          </div>
        </Card>

        {/* Habits List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Fases de Hoje</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/habits?new=1')}
              className="gap-2"
            >
              <Plus size={16} />
              Novo
            </Button>
          </div>

          {habits.length === 0 ? (
            <EmptyState variant="no-habits" userName={profile.name} />
          ) : hasMultiplePeriods ? (
            <div className="space-y-4">
              {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((period) => {
                const periodHabits = groupedHabits[period]
                if (periodHabits.length === 0) return null

                return (
                  <HabitPeriodGroup
                    key={period}
                    period={period}
                    count={periodHabits.length}
                    completedCount={getCompletedCountForPeriod(periodHabits)}
                  >
                    {periodHabits.map(renderHabitCard)}
                  </HabitPeriodGroup>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">{habits.map(renderHabitCard)}</div>
          )}
        </div>

        {/* Completion Message */}
        {progress === 100 && habits.length > 0 && <EmptyState variant="all-completed" />}
      </div>

      <AnimatedCoinsDisplay coins={localStats.coins} />
    </div>
  )
}
