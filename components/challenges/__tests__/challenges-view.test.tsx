import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChallengesView } from '../challenges-view'

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
          gte: () => ({
            order: () =>
              Promise.resolve({
                data: [],
                error: null,
              }),
          }),
          single: () =>
            Promise.resolve({
              data: { count_required: 20 },
              error: null,
            }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
}))

describe('ChallengesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o título da página', () => {
    render(<ChallengesView />)
    expect(screen.getByText('Desafios Semanais')).toBeInTheDocument()
  })

  it('deve renderizar o subtítulo da página', () => {
    render(<ChallengesView />)
    expect(
      screen.getByText('Derrote os chefes completando desafios e ganhe recompensas épicas!')
    ).toBeInTheDocument()
  })

  it('deve renderizar o container com classes de centralização', () => {
    const { container } = render(<ChallengesView />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).toHaveClass('md:ml-64')

    const innerDiv = outerDiv.firstChild as HTMLElement
    expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    const { container } = render(<ChallengesView />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
