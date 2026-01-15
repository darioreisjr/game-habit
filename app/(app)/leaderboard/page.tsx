'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Medal, Crown, TrendingUp, Zap } from 'lucide-react';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time' | 'friends';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<any[]>([]);
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<any>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const periodStart = getPeriodStart(period);
      const periodEnd = new Date().toISOString().split('T')[0];

      // Buscar leaderboard do período
      const { data: leaderboardData, error: lbError } = await supabase
        .from('leaderboards')
        .select('id')
        .eq('leaderboard_type', period === 'all_time' ? 'global_xp' : `${period}_xp`)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .single();

      if (lbError) {
        // Se não existe, criar
        await supabase.rpc('update_global_leaderboard');
      }

      // Buscar entradas
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
        .limit(100);

      if (error) throw error;
      setEntries(data || []);

      // Buscar posição do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEntry = data?.find((e: any) => e.user_id === user.id);
        setUserRank(userEntry);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPeriodStart(period: LeaderboardPeriod): string {
    const now = new Date();
    switch (period) {
      case 'weekly': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart.toISOString().split('T')[0];
      }
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      default:
        return '2024-01-01';
    }
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-12 h-12 text-yellow-600" />
            Ranking Global
          </h1>
          <p className="text-gray-600 text-lg">Veja os melhores jogadores do mundo!</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {(['weekly', 'monthly', 'all_time', 'friends'] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'weekly' && '📅 Semanal'}
              {p === 'monthly' && '📆 Mensal'}
              {p === 'all_time' && '⏳ Todo Tempo'}
              {p === 'friends' && '👥 Amigos'}
            </button>
          ))}
        </div>

        {/* User Rank Card */}
        {userRank && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  #{userRank.rank}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Sua Posição</h3>
                  <p className="text-white/80">
                    {userRank.score.toLocaleString()} XP
                  </p>
                </div>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" />
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Zap className="w-12 h-12 animate-bounce mx-auto mb-4 text-yellow-600" />
              <p>Carregando ranking...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma entrada no ranking ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry: any, _index) => (
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
                      Campeão
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
