'use client'

import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Coins,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

type PeriodType = 'today' | 'week' | 'month' | null

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
}

export default function StatsPage() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(null)
  const [dailyData, setDailyData] = useState<any[]>([])

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const [dashboardResult, insightsResult, goalsResult, dailyStatsResult] = await Promise.all([
          supabase.rpc('get_user_dashboard'),
          supabase
            .from('user_insights')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_dismissed', false)
            .order('priority', { ascending: false })
            .limit(5),
          supabase
            .from('personal_goals')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_completed', false)
            .order('created_at', { ascending: false }),
          supabase
            .from('daily_statistics')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(30),
        ])

        if (dashboardResult.data) setDashboard(dashboardResult.data)
        if (insightsResult.data) setInsights(insightsResult.data)
        if (goalsResult.data) setGoals(goalsResult.data)
        if (dailyStatsResult.data) setDailyData(dailyStatsResult.data.reverse())
      } catch (error) {
        console.error('Error loading stats data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [])

  function getInsightIcon(type: string) {
    switch (type) {
      case 'achievement_near':
        return <Award className="w-6 h-6 text-yellow-600" />
      case 'streak_warning':
        return <Zap className="w-6 h-6 text-red-600" />
      case 'consistency_praise':
        return <Target className="w-6 h-6 text-green-600" />
      default:
        return <TrendingUp className="w-6 h-6 text-blue-600" />
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  function getDayName(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  }

  function getWeekData() {
    const last7Days = dailyData.slice(-7)
    return last7Days.map((day) => ({
      name: getDayName(day.date),
      date: formatDate(day.date),
      habitos: day.total_habits_completed || 0,
      xp: day.total_xp_earned || 0,
      moedas: day.total_coins_earned || 0,
    }))
  }

  function getMonthData() {
    const last30Days = dailyData.slice(-30)
    const weeklyAggregated: { [key: string]: { habitos: number; xp: number; moedas: number } } = {}

    last30Days.forEach((day, index) => {
      const weekNum = Math.floor(index / 7) + 1
      const weekKey = `Sem ${weekNum}`
      if (!weeklyAggregated[weekKey]) {
        weeklyAggregated[weekKey] = { habitos: 0, xp: 0, moedas: 0 }
      }
      weeklyAggregated[weekKey].habitos += day.total_habits_completed || 0
      weeklyAggregated[weekKey].xp += day.total_xp_earned || 0
      weeklyAggregated[weekKey].moedas += day.total_coins_earned || 0
    })

    return Object.entries(weeklyAggregated).map(([name, data]) => ({
      name,
      ...data,
    }))
  }

  function getDifficultyData(habitsByDifficulty: any) {
    if (!habitsByDifficulty) return []
    return [
      { name: 'Fácil', value: habitsByDifficulty.easy || 0, color: DIFFICULTY_COLORS.easy },
      { name: 'Médio', value: habitsByDifficulty.medium || 0, color: DIFFICULTY_COLORS.medium },
      { name: 'Difícil', value: habitsByDifficulty.hard || 0, color: DIFFICULTY_COLORS.hard },
    ].filter((d) => d.value > 0)
  }

  function renderTodayModal() {
    const todayData = dashboard?.today
    if (!todayData) return <p className="text-gray-500 text-center py-8">Sem dados de hoje</p>

    const difficultyData = getDifficultyData(todayData.habits_by_difficulty)

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Hábitos</p>
            <p className="text-3xl font-bold text-blue-600">{todayData.total_habits_completed}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">XP Ganho</p>
            <p className="text-3xl font-bold text-purple-600">{todayData.total_xp_earned}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Moedas</p>
            <p className="text-3xl font-bold text-yellow-600">{todayData.total_coins_earned}</p>
          </div>
        </div>

        {difficultyData.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Hábitos por Dificuldade</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {todayData.habits_by_area && Object.keys(todayData.habits_by_area).length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Hábitos por Área</h4>
            <div className="space-y-2">
              {Object.entries(todayData.habits_by_area).map(([area, count], index) => (
                <div key={area} className="flex items-center justify-between">
                  <span className="text-gray-600">{area}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${((count as number) / todayData.total_habits_completed) * 100}px`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <span className="font-bold">{count as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderWeekModal() {
    const weekData = getWeekData()
    const weekStats = dashboard?.week

    if (weekData.length === 0 && !weekStats) {
      return <p className="text-gray-500 text-center py-8">Sem dados da semana</p>
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Hábitos</p>
            <p className="text-2xl font-bold text-blue-600">
              {weekStats?.total_habits_completed || 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">XP Total</p>
            <p className="text-2xl font-bold text-purple-600">{weekStats?.total_xp_earned || 0}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Moedas</p>
            <p className="text-2xl font-bold text-yellow-600">
              {weekStats?.total_coins_earned || 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Dias Perfeitos</p>
            <p className="text-2xl font-bold text-green-600">{weekStats?.perfect_days || 0}</p>
          </div>
        </div>

        {weekData.length > 0 && (
          <>
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Hábitos por Dia</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === 'habitos' ? 'Hábitos' : name === 'xp' ? 'XP' : 'Moedas',
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="habitos" fill="#3b82f6" name="Hábitos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">XP e Moedas por Dia</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="XP"
                      dot={{ fill: '#8b5cf6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moedas"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Moedas"
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  function renderMonthModal() {
    const monthData = getMonthData()
    const monthStats = dashboard?.month

    if (monthData.length === 0 && !monthStats) {
      return <p className="text-gray-500 text-center py-8">Sem dados do mês</p>
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Hábitos</p>
            <p className="text-2xl font-bold text-blue-600">
              {monthStats?.total_habits_completed || 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">XP Total</p>
            <p className="text-2xl font-bold text-purple-600">{monthStats?.total_xp_earned || 0}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Moedas</p>
            <p className="text-2xl font-bold text-yellow-600">
              {monthStats?.total_coins_earned || 0}
            </p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Média Diária</p>
            <p className="text-2xl font-bold text-pink-600">
              {monthStats?.avg_daily_completion?.toFixed(1) || 0}%
            </p>
          </div>
        </div>

        {monthData.length > 0 && (
          <>
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Progresso Semanal</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="habitos" fill="#3b82f6" name="Hábitos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="xp" fill="#8b5cf6" name="XP" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Evolução de Moedas</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="moedas"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      name="Moedas"
                      dot={{ fill: '#f59e0b', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {monthStats?.most_productive_day && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Dia mais produtivo</p>
            <p className="text-xl font-bold text-green-600">{monthStats.most_productive_day}</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            Estatísticas Avançadas
          </h1>
          <p className="text-gray-600">Análise detalhada do seu progresso</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card Hoje */}
          <button
            onClick={() => setSelectedPeriod('today')}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Hoje</h3>
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
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
                  <span className="font-bold text-yellow-600">
                    {dashboard.today.total_coins_earned}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sem dados de hoje</p>
            )}
          </button>

          {/* Card Semana */}
          <button
            onClick={() => setSelectedPeriod('week')}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Esta Semana</h3>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
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
                  <span className="text-gray-600">Moedas</span>
                  <span className="font-bold text-yellow-600">
                    {dashboard.week.total_coins_earned}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dias Perfeitos</span>
                  <span className="font-bold text-green-600">{dashboard.week.perfect_days}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sem dados da semana</p>
            )}
          </button>

          {/* Card Mês */}
          <button
            onClick={() => setSelectedPeriod('month')}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Este Mês</h3>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
            {dashboard?.month ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hábitos</span>
                  <span className="font-bold">{dashboard.month.total_habits_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Total</span>
                  <span className="font-bold text-blue-600">{dashboard.month.total_xp_earned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moedas</span>
                  <span className="font-bold text-yellow-600">
                    {dashboard.month.total_coins_earned}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Média Diária</span>
                  <span className="font-bold text-purple-600">
                    {dashboard.month.avg_daily_completion?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sem dados do mês</p>
            )}
          </button>
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
                        width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%`,
                      }}
                    />
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      <Zap className="w-4 h-4" /> +{goal.reward_xp} XP
                    </span>
                    <span className="text-yellow-600 font-semibold flex items-center gap-1">
                      <Coins className="w-4 h-4" /> +{goal.reward_coins} moedas
                    </span>
                    {goal.deadline && (
                      <span className="text-gray-600">
                        {new Date(goal.deadline).toLocaleDateString('pt-BR')}
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
            <p className="text-gray-500 text-lg">
              Comece a completar hábitos para ver suas estatísticas!
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedPeriod && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPeriod(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {selectedPeriod === 'today' && (
                  <>
                    <Calendar className="w-7 h-7 text-blue-600" />
                    Estatísticas de Hoje
                  </>
                )}
                {selectedPeriod === 'week' && (
                  <>
                    <TrendingUp className="w-7 h-7 text-green-600" />
                    Estatísticas da Semana
                  </>
                )}
                {selectedPeriod === 'month' && (
                  <>
                    <Award className="w-7 h-7 text-purple-600" />
                    Estatísticas do Mês
                  </>
                )}
              </h2>
              <button
                onClick={() => setSelectedPeriod(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {selectedPeriod === 'today' && renderTodayModal()}
              {selectedPeriod === 'week' && renderWeekModal()}
              {selectedPeriod === 'month' && renderMonthModal()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
