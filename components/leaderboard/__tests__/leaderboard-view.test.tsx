import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LeaderboardView } from '../leaderboard-view'

const mockLeaderboardEntries = [
  {
    id: '1',
    user_id: 'user-1',
    rank: 1,
    score: 5000,
    profiles: { name: 'Jogador 1', avatar_url: null },
  },
  {
    id: '2',
    user_id: 'user-2',
    rank: 2,
    score: 4500,
    profiles: { name: 'Jogador 2', avatar_url: null },
  },
  {
    id: '3',
    user_id: 'user-3',
    rank: 3,
    score: 4000,
    profiles: { name: 'Jogador 3', avatar_url: null },
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
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: table === 'leaderboards' ? { id: 'lb-1' } : null,
                  error: null,
                }),
            }),
          }),
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: mockLeaderboardEntries,
                error: null,
              }),
          }),
        }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: null,
        error: null,
      }),
  }),
}))

describe('LeaderboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', () => {
    render(<LeaderboardView />)
    expect(screen.getByText('Ranking Global')).toBeInTheDocument()
  })

  it('deve renderizar o subtitulo da pagina', () => {
    render(<LeaderboardView />)
    expect(screen.getByText('Veja os melhores jogadores e compita pelo topo!')).toBeInTheDocument()
  })

  it('deve renderizar o container com classes de centralizacao', () => {
    const { container } = render(<LeaderboardView />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).toHaveClass('md:ml-64')

    const innerDiv = outerDiv.firstChild as HTMLElement
    expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
  })

  it('deve renderizar os botoes de periodo', () => {
    render(<LeaderboardView />)
    expect(screen.getByText('Semanal')).toBeInTheDocument()
    expect(screen.getByText('Mensal')).toBeInTheDocument()
    expect(screen.getByText('Todo Tempo')).toBeInTheDocument()
    expect(screen.getByText('Amigos')).toBeInTheDocument()
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    const { container } = render(<LeaderboardView />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('deve permitir trocar entre periodos', async () => {
    render(<LeaderboardView />)

    const mensalButton = screen.getByText('Mensal')
    fireEvent.click(mensalButton)

    expect(mensalButton).toHaveClass('bg-gradient-to-r')
  })

  it('deve renderizar as entradas do ranking apos carregar', async () => {
    render(<LeaderboardView />)

    await waitFor(() => {
      expect(screen.getByText('Jogador 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Jogador 2')).toBeInTheDocument()
    expect(screen.getByText('Jogador 3')).toBeInTheDocument()
  })

  it('deve mostrar o badge de campeao para o primeiro lugar', async () => {
    render(<LeaderboardView />)

    await waitFor(() => {
      expect(screen.getByText('Campeao')).toBeInTheDocument()
    })
  })

  it('deve exibir a pontuacao dos jogadores', async () => {
    render(<LeaderboardView />)

    await waitFor(() => {
      expect(screen.getByText(/5.000 XP|5,000 XP/)).toBeInTheDocument()
    })

    expect(screen.getByText(/4.500 XP|4,500 XP/)).toBeInTheDocument()
    expect(screen.getByText(/4.000 XP|4,000 XP/)).toBeInTheDocument()
  })
})
