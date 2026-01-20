import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoutineView } from '../routine-view'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [],
              error: null,
            }),
        }),
        gte: () => ({
          lte: () =>
            Promise.resolve({
              data: [],
              error: null,
            }),
        }),
      }),
    }),
  }),
}))

describe('RoutineView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
    vi.clearAllMocks()
  })

  it('should render page title', () => {
    render(<RoutineView />)
    expect(screen.getByText('Rotina')).toBeInTheDocument()
  })

  it('should render page subtitle', () => {
    render(<RoutineView />)
    expect(screen.getByText('Acompanhe seu progresso semanal')).toBeInTheDocument()
  })

  it('should render week navigator', () => {
    render(<RoutineView />)
    expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Próxima semana')).toBeInTheDocument()
  })

  it('should render habits section title', () => {
    render(<RoutineView />)
    expect(screen.getByText('Hábitos da Semana')).toBeInTheDocument()
  })

  it('should show empty state initially', () => {
    render(<RoutineView />)
    expect(screen.getByText('Você ainda não tem hábitos configurados.')).toBeInTheDocument()
  })

  it('should render month and year in header', () => {
    render(<RoutineView />)
    expect(screen.getByText('janeiro 2024')).toBeInTheDocument()
  })
})
