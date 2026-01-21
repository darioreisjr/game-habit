import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileView } from '../profile-view'

const mockProfile = {
  id: 'test-user-id',
  name: 'Jogador Teste',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockPublicProfile = {
  user_id: 'test-user-id',
  username: 'jogador_teste',
  display_name: 'Jogador Teste',
  avatar_url: null,
  friend_code: 'ABC123',
  bio: null,
  is_public: true,
  show_stats: true,
  show_habits: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockStats = {
  user_id: 'test-user-id',
  level: 5,
  xp: 450,
  coins: 100,
  total_checkins: 25,
  current_streak: 7,
  longest_streak: 14,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockPendingRequests = [
  {
    id: 'request-1',
    requester_id: 'user-2',
  },
]

const mockRequesterProfile = {
  user_id: 'user-2',
  username: 'amigo_teste',
  display_name: 'Amigo Teste',
  avatar_url: null,
}

const mockRequesterStats = {
  user_id: 'user-2',
  level: 3,
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: string) => ({
          single: () => {
            if (table === 'profiles') {
              return Promise.resolve({ data: mockProfile, error: null })
            }
            if (table === 'public_profiles') {
              return Promise.resolve({ data: mockPublicProfile, error: null })
            }
            if (table === 'stats') {
              return Promise.resolve({ data: mockStats, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          },
          eq: (column2: string, value2: string) => ({
            limit: () =>
              Promise.resolve({
                data: table === 'friendships' ? mockPendingRequests : [],
                error: null,
              }),
          }),
        }),
        in: (column: string, values: string[]) =>
          Promise.resolve({
            data:
              table === 'public_profiles'
                ? [mockRequesterProfile]
                : table === 'stats'
                  ? [mockRequesterStats]
                  : [],
            error: null,
          }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}))

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Perfil/ })).toBeInTheDocument()
    })
  })

  it('deve renderizar o subtitulo da pagina', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByText(/Gerencie suas informacoes e progresso/)).toBeInTheDocument()
    })
  })

  it('deve renderizar o container com classes de centralizacao', async () => {
    const { container } = render(<ProfileView />)
    await waitFor(() => {
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv).toHaveClass('md:ml-64')

      const innerDiv = outerDiv.firstChild as HTMLElement
      expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
    })
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    const { container } = render(<ProfileView />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('deve renderizar o codigo de amigo', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })
  })

  it('deve renderizar as estatisticas do usuario', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByText('Check-ins realizados')).toBeInTheDocument()
      expect(screen.getByText('Habitos ativos')).toBeInTheDocument()
      expect(screen.getByText('Nivel atual')).toBeInTheDocument()
    })
  })

  it('deve renderizar o formulario de perfil', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByLabelText('Nome')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Salvar alteracoes/ })).toBeInTheDocument()
    })
  })

  it('deve renderizar o botao de logout', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sair/ })).toBeInTheDocument()
    })
  })

  it('deve permitir editar o nome do usuario', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      const input = screen.getByLabelText('Nome') as HTMLInputElement
      expect(input.value).toBe('Jogador Teste')
    })

    const input = screen.getByLabelText('Nome')
    fireEvent.change(input, { target: { value: 'Novo Nome' } })
    expect((input as HTMLInputElement).value).toBe('Novo Nome')
  })

  it('deve renderizar a secao de informacoes do perfil', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByText('Informacoes do Perfil')).toBeInTheDocument()
    })
  })

  it('deve renderizar a secao de sair da conta', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByText('Sair da conta')).toBeInTheDocument()
      expect(screen.getByText('Desconectar e voltar para a tela de login')).toBeInTheDocument()
    })
  })

  it('deve renderizar o icone de usuario no titulo', async () => {
    const { container } = render(<ProfileView />)
    await waitFor(() => {
      const header = container.querySelector('h1')
      expect(header).toBeInTheDocument()
      const icon = header?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  it('deve renderizar o titulo do codigo de amigo', async () => {
    render(<ProfileView />)
    await waitFor(() => {
      expect(screen.getByText('Seu Codigo de Amigo')).toBeInTheDocument()
    })
  })
})
