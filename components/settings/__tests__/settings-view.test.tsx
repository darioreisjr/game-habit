import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsView } from '../settings-view'

const mockThemes = [
  {
    id: 'theme-1',
    theme_key: 'default',
    name: 'Tema Padrao',
    description: 'Tema padrao do jogo',
    is_premium: false,
    requires_item: null,
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      background: '#ffffff',
    },
  },
  {
    id: 'theme-2',
    theme_key: 'dark',
    name: 'Tema Escuro',
    description: 'Tema escuro para jogar a noite',
    is_premium: true,
    requires_item: 'dark_theme_unlock',
    colors: {
      primary: '#333333',
      secondary: '#666666',
      accent: '#999999',
      background: '#000000',
    },
  },
]

const mockPreferences = {
  user_id: 'test-user-id',
  active_theme: 'default',
  notifications_enabled: true,
  notification_time: '09:00',
  sound_enabled: true,
  language: 'pt-BR',
}

const mockPublicProfile = {
  user_id: 'test-user-id',
  username: 'jogador_teste',
  display_name: 'Jogador Teste',
  friend_code: 'ABC12345',
  is_searchable: true,
  avatar_url: null,
  bio: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockInventory = [
  {
    id: 'inv-1',
    user_id: 'test-user-id',
    item_key: 'dark_theme_unlock',
    quantity: 1,
  },
]

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
    warning: vi.fn(),
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
    },
    from: (table: string) => ({
      select: () => {
        if (table === 'themes') {
          return Promise.resolve({ data: mockThemes, error: null })
        }
        if (table === 'inventory') {
          return {
            eq: () => Promise.resolve({ data: mockInventory, error: null }),
          }
        }
        return {
          eq: () => ({
            single: () => {
              if (table === 'user_preferences') {
                return Promise.resolve({ data: mockPreferences, error: null })
              }
              if (table === 'public_profiles') {
                return Promise.resolve({ data: mockPublicProfile, error: null })
              }
              if (table === 'profiles') {
                return Promise.resolve({ data: { name: 'Jogador Teste' }, error: null })
              }
              return Promise.resolve({ data: null, error: null })
            },
            neq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }
      },
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockPublicProfile, error: null }),
        }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: { success: true },
        error: null,
      }),
  }),
}))

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Configuracoes')
    })
  })

  it('deve renderizar o subtitulo da pagina', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText(/Personalize sua experiencia/)).toBeInTheDocument()
    })
  })

  it('deve renderizar o container com classes de centralizacao', async () => {
    const { container } = render(<SettingsView />)
    await waitFor(() => {
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv).toHaveClass('md:ml-64')

      const innerDiv = outerDiv.firstChild as HTMLElement
      expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
    })
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    const { container } = render(<SettingsView />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('deve renderizar a secao de perfil publico', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getAllByText('Perfil Publico').length).toBeGreaterThan(0)
    })
  })

  it('deve renderizar o codigo de amigo', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('ABC12345')).toBeInTheDocument()
    })
  })

  it('deve renderizar o titulo do codigo de amigo', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Seu Codigo de Amigo')).toBeInTheDocument()
    })
  })

  it('deve renderizar a secao de temas', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Temas')).toBeInTheDocument()
    })
  })

  it('deve renderizar os temas disponiveis', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Tema Padrao')).toBeInTheDocument()
      expect(screen.getByText('Tema Escuro')).toBeInTheDocument()
    })
  })

  it('deve renderizar a secao de notificacoes', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Notificacoes')).toBeInTheDocument()
    })
  })

  it('deve renderizar titulo de notificacoes de habitos', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Notificacoes de Habitos')).toBeInTheDocument()
    })
  })

  it('deve renderizar a secao de outras configuracoes', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Outras Configuracoes')).toBeInTheDocument()
    })
  })

  it('deve renderizar a configuracao de sons', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Sons')).toBeInTheDocument()
      expect(screen.getByText('Efeitos sonoros e musica')).toBeInTheDocument()
    })
  })

  it('deve renderizar a configuracao de idioma', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByText('Idioma')).toBeInTheDocument()
    })
  })

  it('deve renderizar o campo de nome de exibicao', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByLabelText('Nome de Exibicao')).toBeInTheDocument()
    })
  })

  it('deve renderizar o campo de nome de usuario', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByLabelText('Nome de Usuario')).toBeInTheDocument()
    })
  })

  it('deve permitir editar o nome de exibicao', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      const input = screen.getByLabelText('Nome de Exibicao') as HTMLInputElement
      expect(input.value).toBe('Jogador Teste')
    })

    const input = screen.getByLabelText('Nome de Exibicao')
    fireEvent.change(input, { target: { value: 'Novo Nome' } })
    expect((input as HTMLInputElement).value).toBe('Novo Nome')
  })

  it('deve renderizar o botao de salvar alteracoes', async () => {
    render(<SettingsView />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Salvar Alteracoes/ })).toBeInTheDocument()
    })
  })

  it('deve renderizar o icone de configuracoes no titulo', async () => {
    const { container } = render(<SettingsView />)
    await waitFor(() => {
      const header = container.querySelector('h1')
      expect(header).toBeInTheDocument()
      const icon = header?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })
})
