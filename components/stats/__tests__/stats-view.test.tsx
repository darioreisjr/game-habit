import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StatsView } from '../stats-view'

const mockDashboard = {
  today: {
    total_habits_completed: 5,
    total_xp_earned: 150,
    total_coins_earned: 50,
    habits_by_difficulty: {
      easy: 2,
      medium: 2,
      hard: 1,
    },
    habits_by_area: {
      Saude: 3,
      Produtividade: 2,
    },
  },
  week: {
    total_habits_completed: 25,
    total_xp_earned: 750,
    total_coins_earned: 200,
    perfect_days: 3,
  },
  month: {
    total_habits_completed: 100,
    total_xp_earned: 3000,
    total_coins_earned: 800,
    avg_daily_completion: 85.5,
    most_productive_day: 'Segunda-feira',
  },
}

const mockInsights = [
  {
    id: 'insight-1',
    insight_type: 'achievement_near',
    title: 'Quase la!',
    description: 'Voce esta proximo de completar uma conquista',
    priority: 3,
  },
  {
    id: 'insight-2',
    insight_type: 'streak_warning',
    title: 'Atencao!',
    description: 'Sua sequencia pode ser perdida',
    priority: 5,
  },
]

const mockGoals = [
  {
    id: 'goal-1',
    title: 'Completar 50 habitos',
    description: 'Meta mensal de habitos',
    current_value: 30,
    target_value: 50,
    reward_xp: 500,
    reward_coins: 100,
    deadline: '2024-12-31',
  },
]

const mockDailyStats = [
  {
    date: '2024-01-01',
    total_habits_completed: 5,
    total_xp_earned: 150,
    total_coins_earned: 50,
  },
  {
    date: '2024-01-02',
    total_habits_completed: 3,
    total_xp_earned: 90,
    total_coins_earned: 30,
  },
]

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: table === 'user_insights' ? mockInsights : [],
                  error: null,
                }),
            }),
          }),
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: table === 'daily_statistics' ? mockDailyStats : [],
                error: null,
              }),
          }),
        }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: mockDashboard,
        error: null,
      }),
  }),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

describe('StatsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Estatisticas Avancadas/ })).toBeInTheDocument()
    })
  })

  it('deve renderizar o subtitulo da pagina', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('Analise detalhada do seu progresso')).toBeInTheDocument()
    })
  })

  it('deve renderizar o container com classes de centralizacao', async () => {
    const { container } = render(<StatsView />)
    await waitFor(() => {
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv).toHaveClass('md:ml-64')

      const innerDiv = outerDiv.firstChild as HTMLElement
      expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
    })
  })

  it('deve renderizar os cards de periodo', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('Hoje')).toBeInTheDocument()
      expect(screen.getByText('Esta Semana')).toBeInTheDocument()
      expect(screen.getByText('Este Mes')).toBeInTheDocument()
    })
  })

  it('deve renderizar dados de hoje no card', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })

  it('deve renderizar dados da semana no card', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('750')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('deve renderizar dados do mes no card', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('3000')).toBeInTheDocument()
      expect(screen.getByText('800')).toBeInTheDocument()
      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })
  })

  it('deve abrir modal ao clicar no card Hoje', async () => {
    render(<StatsView />)

    await waitFor(() => {
      expect(screen.getByText('Hoje')).toBeInTheDocument()
    })

    const todayCard = screen.getByText('Hoje').closest('button')
    if (todayCard) fireEvent.click(todayCard)

    await waitFor(() => {
      expect(screen.getByText('Estatisticas de Hoje')).toBeInTheDocument()
    })
  })

  it('deve abrir modal ao clicar no card Esta Semana', async () => {
    render(<StatsView />)

    await waitFor(() => {
      expect(screen.getByText('Esta Semana')).toBeInTheDocument()
    })

    const weekCard = screen.getByText('Esta Semana').closest('button')
    if (weekCard) fireEvent.click(weekCard)

    await waitFor(() => {
      expect(screen.getByText('Estatisticas da Semana')).toBeInTheDocument()
    })
  })

  it('deve abrir modal ao clicar no card Este Mes', async () => {
    render(<StatsView />)

    await waitFor(() => {
      expect(screen.getByText('Este Mes')).toBeInTheDocument()
    })

    const monthCard = screen.getByText('Este Mes').closest('button')
    if (monthCard) fireEvent.click(monthCard)

    await waitFor(() => {
      expect(screen.getByText('Estatisticas do Mes')).toBeInTheDocument()
    })
  })

  it('deve fechar modal ao clicar no botao X', async () => {
    render(<StatsView />)

    await waitFor(() => {
      expect(screen.getByText('Hoje')).toBeInTheDocument()
    })

    const todayCard = screen.getByText('Hoje').closest('button')
    if (todayCard) fireEvent.click(todayCard)

    await waitFor(() => {
      expect(screen.getByText('Estatisticas de Hoje')).toBeInTheDocument()
    })

    const closeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Estatisticas de Hoje')).not.toBeInTheDocument()
    })
  })

  it('deve renderizar labels de metricas nos cards', async () => {
    render(<StatsView />)
    await waitFor(() => {
      const habitosLabels = screen.getAllByText('Habitos')
      expect(habitosLabels.length).toBeGreaterThan(0)

      const xpLabels = screen.getAllByText(/XP/)
      expect(xpLabels.length).toBeGreaterThan(0)

      const moedasLabels = screen.getAllByText('Moedas')
      expect(moedasLabels.length).toBeGreaterThan(0)
    })
  })

  it('deve renderizar Dias Perfeitos no card da semana', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('Dias Perfeitos')).toBeInTheDocument()
    })
  })

  it('deve renderizar Media Diaria no card do mes', async () => {
    render(<StatsView />)
    await waitFor(() => {
      expect(screen.getByText('Media Diaria')).toBeInTheDocument()
    })
  })

  it('deve ter layout responsivo nos cards', async () => {
    const { container } = render(<StatsView />)
    await waitFor(() => {
      const cardsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3')
      expect(cardsGrid).toBeInTheDocument()
    })
  })
})
