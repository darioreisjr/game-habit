'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Calendar, Target, Award, Zap, Activity } from 'lucide-react';

export default function StatsPage() {
  const supabase = createClient();
  const [dashboard, setDashboard] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadInsights();
    loadGoals();
  }, [loadDashboard, loadGoals, loadInsights]);

  async function loadDashboard() {
    try {
      const { data, error } = await supabase.rpc('get_user_dashboard');
      if (error) throw error;
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInsights() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('priority', { ascending: false })
        .limit(5);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }

  async function loadGoals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }

  function getInsightIcon(type: string) {
    switch (type) {
      case 'achievement_near':
        return <Award className="w-6 h-6 text-yellow-600" />;
      case 'streak_warning':
        return <Zap className="w-6 h-6 text-red-600" />;
      case 'consistency_praise':
        return <Target className="w-6 h-6 text-green-600" />;
      default:
        return <TrendingUp className="w-6 h-6 text-blue-600" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            Estatísticas Avançadas
          </h1>
          <p className="text-gray-600">Análise detalhada do seu progresso</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Hoje</h3>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            {dashboard?.today ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hábitos</span>
                  <span className="font-bold">{dashboard.today.total_habits_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Ganho</span>
                  <span className="font-bold text-blue-600">{dashboard.today.total_xp_earned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moedas</span>
                  <span className="font-bold text-yellow-600">{dashboard.today.total_coins_earned}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sem dados de hoje</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Esta Semana</h3>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            {dashboard?.week ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hábitos</span>
                  <span className="font-bold">{dashboard.week.total_habits_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Total</span>
                  <span className="font-bold text-blue-600">{dashboard.week.total_xp_earned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dias Perfeitos</span>
                  <span className="font-bold text-green-600">{dashboard.week.perfect_days}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sem dados da semana</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Este Mês</h3>
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            {dashboard?.month ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hábitos</span>
                  <span className="font-bold">{dashboard.month.total_habits_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conquistas</span>
                  <span className="font-bold text-yellow-600">{dashboard.month.achievements_unlocked || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Média Diária</span>
                  <span className="font-bold text-purple-600">{dashboard.month.avg_daily_completion?.toFixed(1) || 0}%</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sem dados do mês</p>
            )}
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              Insights Personalizados
            </h2>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-start gap-4"
                >
                  <div className="mt-1">{getInsightIcon(insight.insight_type)}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-gray-600 text-sm">{insight.description}</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    Prioridade {insight.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Goals */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-green-600" />
              Metas Pessoais
            </h2>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{goal.title}</h3>
                    <span className="text-sm text-gray-600">
                      {goal.current_value} / {goal.target_value}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (goal.current_value / goal.target_value) * 100
                        )}%`
                      }}
                    />
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-blue-600 font-semibold">
                      🎯 +{goal.reward_xp} XP
                    </span>
                    <span className="text-yellow-600 font-semibold">
                      💰 +{goal.reward_coins} moedas
                    </span>
                    {goal.deadline && (
                      <span className="text-gray-600">
                        ⏰ {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!dashboard && !insights.length && !goals.length && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Comece a completar hábitos para ver suas estatísticas!</p>
          </div>
        )}
      </div>
    </div>
  );
}
