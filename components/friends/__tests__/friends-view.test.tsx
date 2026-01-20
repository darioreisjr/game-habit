import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FriendsView } from '../friends-view'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          or: () =>
            Promise.resolve({
              data: [],
              error: null,
            }),
          single: () =>
            Promise.resolve({
              data: null,
              error: null,
            }),
        }),
        in: () =>
          Promise.resolve({
            data: [],
            error: null,
          }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: [],
        error: null,
      }),
  }),
}))

describe('FriendsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', () => {
    render(<FriendsView />)
    expect(screen.getByText('Amigos')).toBeInTheDocument()
  })

  it('deve renderizar o subtitulo da pagina', () => {
    render(<FriendsView />)
    expect(
      screen.getByText('Conecte-se com outros jogadores e compita juntos!')
    ).toBeInTheDocument()
  })

  it('deve renderizar o container com classes de centralizacao', () => {
    const { container } = render(<FriendsView />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).toHaveClass('md:ml-64')

    const innerDiv = outerDiv.firstChild as HTMLElement
    expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
  })

  it('deve renderizar as abas de navegacao', () => {
    render(<FriendsView />)
    expect(screen.getByText(/Meus Amigos/)).toBeInTheDocument()
    expect(screen.getByText('Solicitações')).toBeInTheDocument()
    expect(screen.getByText('Buscar')).toBeInTheDocument()
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    const { container } = render(<FriendsView />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
