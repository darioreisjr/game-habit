import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ShopView } from '../shop-view'

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
          order: () => ({
            order: () =>
              Promise.resolve({
                data: [],
                error: null,
              }),
          }),
          single: () =>
            Promise.resolve({
              data: { coins: 100 },
              error: null,
            }),
        }),
      }),
    }),
  }),
}))

describe('ShopView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o titulo da pagina', () => {
    render(<ShopView />)
    expect(screen.getByText('Loja do Mario')).toBeInTheDocument()
  })

  it('deve renderizar o subtitulo da pagina', () => {
    render(<ShopView />)
    expect(
      screen.getByText('Use suas moedas para comprar power-ups, temas e itens especiais!')
    ).toBeInTheDocument()
  })

  it('deve renderizar o container com classes de centralizacao', () => {
    const { container } = render(<ShopView />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).toHaveClass('md:ml-64')

    const innerDiv = outerDiv.firstChild as HTMLElement
    expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    const { container } = render(<ShopView />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
