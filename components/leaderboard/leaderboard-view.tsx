'use client'

import { Crown, Medal, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time' | 'friends'

interface LeaderboardEntry {
  id: string
  user_id: string
  rank: number
  score: number
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly')
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

  const getPeriodStart = useCallback((p: LeaderboardPeriod): string => {
    const now = new Date()
    switch (p) {
      case 'weekly': {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        return weekStart.toISOString().split('T')[0]
      }
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      default:
        return '2024-01-01'
    }
  }, [])

  const loadLeaderboard = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    try {
      const periodStart = getPeriodStart(period)
      const periodEnd = new Date().toISOString().split('T')[0]

      const { data: leaderboardData } = await supabase
        .from('leaderboards')
        .select('id')
        .eq('leaderboard_type', period === 'all_time' ? 'global_xp' : `${period}_xp`)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .single()

      if (!leaderboardData) {
        await supabase.rpc('update_global_leaderboard')
      }

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles:user_id (
            name,
            avatar_url
          )
        `)
        .eq('leaderboard_id', leaderboardData?.id)
        .order('rank', { ascending: true })
        .limit(100)

      if (error) throw error
      setEntries(data || [])

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const userEntry = data?.find((e: LeaderboardEntry) => e.user_id === user.id)
        setUserRank(userEntry || null)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [period, getPeriodStart])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  const getRankIcon = useMemo(
    () => (rank: number) => {
      if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
      if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
      if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />
      return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    },
    []
  )

  const periodLabels: Record<LeaderboardPeriod, string> = {
    weekly: 'Semanal',
    monthly: 'Mensal',
    all_time: 'Todo Tempo',
    friends: 'Amigos',
  }

  const CardSkeleton = () => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center justify-center md:justify-start gap-3">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-600" />
            Ranking Global
          </h1>
          <p className="text-text-secondary mt-1">
            Veja os melhores jogadores e compita pelo topo!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {(['weekly', 'monthly', 'all_time', 'friends'] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {userRank && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  #{userRank.rank}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Sua Posicao</h3>
                  <p className="text-white/80">{userRank.score.toLocaleString()} XP</p>
                </div>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma entrada no ranking ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {entry.profiles?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {entry.profiles?.name || 'Jogador'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          {entry.score.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {entry.rank === 1 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm">
                      <Crown className="w-4 h-4" />
                      Campeao
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
