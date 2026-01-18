import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Checkin, Habit } from '@/types/database.types'
import { HistoryView } from '../history-view'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}))

describe('HistoryView', () => {
  const mockHabit: Habit = {
    id: 'habit-1',
    user_id: 'user-123',
    name: 'Fazer exercício',
    type: 'boolean',
    difficulty: 'medium',
    frequency: { type: 'daily' },
    preferred_time: '08:00',
    is_archived: false,
    created_at: new Date().toISOString(),
    area: {
      id: 'area-1',
      user_id: 'user-123',
      name: 'Saúde',
      color: '#FF0000',
      icon: '💪',
      order_index: 0,
      created_at: new Date().toISOString(),
    },
  }

  const createMockCheckin = (date: string): Checkin => ({
    id: `checkin-${date}`,
    user_id: 'user-123',
    habit_id: 'habit-1',
    date,
    created_at: new Date().toISOString(),
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
  })

  it('should render habit name', () => {
    render(<HistoryView habit={mockHabit} checkins={[]} />)
    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
  })

  it('should render area badge', () => {
    render(<HistoryView habit={mockHabit} checkins={[]} />)
    expect(screen.getByText(/💪.*Saúde/)).toBeInTheDocument()
  })

  it('should render XP badge based on difficulty', () => {
    render(<HistoryView habit={mockHabit} checkins={[]} />)
    expect(screen.getByText('+20 XP')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<HistoryView habit={mockHabit} checkins={[]} />)
    expect(screen.getByLabelText('Voltar')).toBeInTheDocument()
  })

  it('should render section titles', () => {
    render(<HistoryView habit={mockHabit} checkins={[]} />)
    expect(screen.getByText('Calendário de Conclusões')).toBeInTheDocument()
    expect(screen.getByText('Histórico Recente')).toBeInTheDocument()
  })

  it('should show empty message when no checkins', () => {
    render(<HistoryView habit={mockHabit} checkins={[]} />)
    expect(screen.getByText('Nenhuma conclusão registrada ainda.')).toBeInTheDocument()
  })

  it('should render recent checkins', () => {
    const checkins = [createMockCheckin('2024-01-15'), createMockCheckin('2024-01-14')]
    render(<HistoryView habit={mockHabit} checkins={checkins} />)

    const completeBadges = screen.getAllByText('Completo')
    expect(completeBadges.length).toBe(2)
  })

  it('should render without area', () => {
    const habitWithoutArea = { ...mockHabit, area: undefined }
    render(<HistoryView habit={habitWithoutArea} checkins={[]} />)

    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
    expect(screen.queryByText('💪')).not.toBeInTheDocument()
  })

  it('should show count of additional checkins when more than 10', () => {
    const checkins = Array.from({ length: 15 }, (_, i) => {
      const date = new Date('2024-01-15')
      date.setDate(date.getDate() - i)
      return createMockCheckin(date.toISOString().split('T')[0])
    })
    render(<HistoryView habit={mockHabit} checkins={checkins} />)

    expect(screen.getByText('E mais 5 conclusões anteriores')).toBeInTheDocument()
  })

  it('should render different XP for easy difficulty', () => {
    const easyHabit = { ...mockHabit, difficulty: 'easy' as const }
    render(<HistoryView habit={easyHabit} checkins={[]} />)
    expect(screen.getByText('+10 XP')).toBeInTheDocument()
  })

  it('should render different XP for hard difficulty', () => {
    const hardHabit = { ...mockHabit, difficulty: 'hard' as const }
    render(<HistoryView habit={hardHabit} checkins={[]} />)
    expect(screen.getByText('+30 XP')).toBeInTheDocument()
  })
})
