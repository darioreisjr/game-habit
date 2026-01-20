import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PetsView } from '../pets-view'

const mockUserPets = [
  {
    id: 'pet-1',
    user_id: 'user-1',
    pet_type_id: 'type-1',
    nickname: 'Rex',
    level: 5,
    xp: 250,
    happiness: 80,
    hunger: 60,
    energy: 70,
    is_active: true,
    pet_type: {
      id: 'type-1',
      name: 'Dragao',
      emoji: '🐉',
      rarity: 'rare',
      price: 100,
      description: 'Um dragao amigavel',
    },
  },
  {
    id: 'pet-2',
    user_id: 'user-1',
    pet_type_id: 'type-2',
    nickname: 'Buddy',
    level: 3,
    xp: 120,
    happiness: 50,
    hunger: 40,
    energy: 60,
    is_active: false,
    pet_type: {
      id: 'type-2',
      name: 'Gato',
      emoji: '🐱',
      rarity: 'common',
      price: 0,
      description: 'Um gato fofo',
    },
  },
]

const mockPetTypes = [
  {
    id: 'type-1',
    name: 'Dragao',
    emoji: '🐉',
    rarity: 'rare',
    price: 100,
    description: 'Um dragao amigavel',
  },
  {
    id: 'type-2',
    name: 'Gato',
    emoji: '🐱',
    rarity: 'common',
    price: 0,
    description: 'Um gato fofo',
  },
  {
    id: 'type-3',
    name: 'Fenix',
    emoji: '🔥',
    rarity: 'legendary',
    price: 500,
    description: 'Uma fenix lendaria',
  },
]

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
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: table === 'user_pets' ? mockUserPets : [],
              error: null,
            }),
          single: () =>
            Promise.resolve({
              data: { coins: 1000 },
              error: null,
            }),
        }),
        order: () =>
          Promise.resolve({
            data: table === 'pet_types' ? mockPetTypes : [],
            error: null,
          }),
      }),
      insert: () =>
        Promise.resolve({
          data: null,
          error: null,
        }),
      update: () => ({
        eq: () =>
          Promise.resolve({
            data: null,
            error: null,
          }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: { success: true, message: 'Interacao realizada' },
        error: null,
      }),
  }),
}))

describe('PetsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', async () => {
    render(<PetsView />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Meus Pets/ })).toBeInTheDocument()
    })
  })

  it('deve renderizar o subtitulo da pagina', async () => {
    render(<PetsView />)
    await waitFor(() => {
      expect(screen.getByText('Cuide do seu companheiro virtual!')).toBeInTheDocument()
    })
  })

  it('deve renderizar o container com classes de centralizacao', async () => {
    const { container } = render(<PetsView />)
    await waitFor(() => {
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv).toHaveClass('md:ml-64')

      const innerDiv = outerDiv.firstChild as HTMLElement
      expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
    })
  })

  it('deve renderizar os botoes de tabs', async () => {
    render(<PetsView />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Meus Pets/ })).toBeInTheDocument()
      expect(screen.getByText('Adotar Pet')).toBeInTheDocument()
    })
  })

  it('deve renderizar corretamente apos carregamento', async () => {
    render(<PetsView />)

    await waitFor(() => {
      const content = screen.queryAllByText('Rex')
      expect(content.length).toBeGreaterThan(0)
    })
  })

  it('deve permitir trocar entre tabs', async () => {
    render(<PetsView />)

    await waitFor(() => {
      expect(screen.getAllByText('Rex').length).toBeGreaterThan(0)
    })

    const adotarButton = screen.getByText('Adotar Pet')
    fireEvent.click(adotarButton)

    await waitFor(() => {
      expect(adotarButton).toHaveClass('bg-gradient-to-r')
    })
  })

  it('deve renderizar o pet ativo apos carregar', async () => {
    render(<PetsView />)

    await waitFor(() => {
      expect(screen.getAllByText('Rex').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Nivel 5').length).toBeGreaterThan(0)
  })

  it('deve renderizar as estatisticas do pet', async () => {
    render(<PetsView />)

    await waitFor(() => {
      expect(screen.getByText('Felicidade')).toBeInTheDocument()
    })

    expect(screen.getByText('Fome')).toBeInTheDocument()
    expect(screen.getByText('Energia')).toBeInTheDocument()
  })

  it('deve renderizar os botoes de interacao', async () => {
    render(<PetsView />)

    await waitFor(() => {
      expect(screen.getByText('Alimentar')).toBeInTheDocument()
    })

    expect(screen.getByText('Brincar')).toBeInTheDocument()
    expect(screen.getByText('Carinho')).toBeInTheDocument()
    expect(screen.getByText('Dormir')).toBeInTheDocument()
  })

  it('deve renderizar a lista de todos os pets', async () => {
    render(<PetsView />)

    await waitFor(() => {
      expect(screen.getByText('Todos os Pets')).toBeInTheDocument()
    })

    expect(screen.getByText('Buddy')).toBeInTheDocument()
  })

  it('deve renderizar pets disponiveis na aba de adocao', async () => {
    render(<PetsView />)

    const adotarButton = screen.getByText('Adotar Pet')
    fireEvent.click(adotarButton)

    await waitFor(() => {
      expect(screen.getByText('Dragao')).toBeInTheDocument()
    })

    expect(screen.getByText('Gato')).toBeInTheDocument()
    expect(screen.getByText('Fenix')).toBeInTheDocument()
  })

  it('deve exibir raridades dos pets', async () => {
    render(<PetsView />)

    const adotarButton = screen.getByText('Adotar Pet')
    fireEvent.click(adotarButton)

    await waitFor(() => {
      expect(screen.getByText('Raro')).toBeInTheDocument()
    })

    expect(screen.getByText('Comum')).toBeInTheDocument()
    expect(screen.getByText('Lendario')).toBeInTheDocument()
  })

  it('deve exibir precos dos pets', async () => {
    render(<PetsView />)

    const adotarButton = screen.getByText('Adotar Pet')
    fireEvent.click(adotarButton)

    await waitFor(() => {
      expect(screen.getByText('Adotar Gratis')).toBeInTheDocument()
    })

    expect(screen.getByText('100 moedas')).toBeInTheDocument()
    expect(screen.getByText('500 moedas')).toBeInTheDocument()
  })
})
