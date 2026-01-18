import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Checkin } from '@/types/database.types'
import { HistoryStats } from '../history-stats'

describe('HistoryStats', () => {
  const createMockCheckin = (date: string): Checkin => ({
    id: `checkin-${date}`,
    user_id: 'user-123',
    habit_id: 'habit-1',
    date,
    created_at: new Date().toISOString(),
  })

  it('should render all stat cards', () => {
    const checkins = [createMockCheckin('2024-01-15')]
    render(<HistoryStats checkins={checkins} />)

    expect(screen.getByText('Total de Conclusões')).toBeInTheDocument()
    expect(screen.getByText('Sequência Atual')).toBeInTheDocument()
    expect(screen.getByText('Maior Sequência')).toBeInTheDocument()
    expect(screen.getByText('Taxa de Conclusão')).toBeInTheDocument()
  })

  it('should show zero values when no checkins', () => {
    render(<HistoryStats checkins={[]} />)

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getAllByText('0d')).toHaveLength(2)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('should calculate total completions correctly', () => {
    const checkins = [
      createMockCheckin('2024-01-15'),
      createMockCheckin('2024-01-14'),
      createMockCheckin('2024-01-13'),
    ]
    render(<HistoryStats checkins={checkins} />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should calculate current streak when checkins are consecutive', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const dayBefore = new Date(today)
    dayBefore.setDate(dayBefore.getDate() - 2)

    const checkins = [
      createMockCheckin(today.toISOString().split('T')[0]),
      createMockCheckin(yesterday.toISOString().split('T')[0]),
      createMockCheckin(dayBefore.toISOString().split('T')[0]),
    ]
    render(<HistoryStats checkins={checkins} />)

    expect(screen.getAllByText('3d')).toHaveLength(2)
  })

  it('should show longest streak', () => {
    const checkins = [
      createMockCheckin('2024-01-01'),
      createMockCheckin('2024-01-02'),
      createMockCheckin('2024-01-03'),
      createMockCheckin('2024-01-04'),
      createMockCheckin('2024-01-05'),
    ]
    render(<HistoryStats checkins={checkins} />)

    const streakElements = screen.getAllByText(/5d/)
    expect(streakElements.length).toBeGreaterThanOrEqual(1)
  })
})
