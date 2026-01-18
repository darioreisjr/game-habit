import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Habit } from '@/types/database.types'
import { DailyProgressBanner } from '../daily-progress-banner'

describe('DailyProgressBanner', () => {
  const createMockHabit = (id: string): Habit => ({
    id,
    user_id: 'user-123',
    name: `Habit ${id}`,
    type: 'boolean',
    difficulty: 'medium',
    frequency: { type: 'daily' },
    is_archived: false,
    created_at: new Date().toISOString(),
  })

  it('should show correct progress text', () => {
    const habits = [createMockHabit('1'), createMockHabit('2'), createMockHabit('3')]
    const completedHabitIds = new Set(['1'])

    render(<DailyProgressBanner habits={habits} completedHabitIds={completedHabitIds} />)

    expect(screen.getByText('1 de 3 fases concluídas')).toBeInTheDocument()
  })

  it('should show "Missão do Dia" title', () => {
    render(<DailyProgressBanner habits={[]} completedHabitIds={new Set()} />)
    expect(screen.getByText('Missão do Dia')).toBeInTheDocument()
  })

  it('should show target emoji when not complete', () => {
    const habits = [createMockHabit('1')]
    const completedHabitIds = new Set<string>()

    render(<DailyProgressBanner habits={habits} completedHabitIds={completedHabitIds} />)
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('should show 0 of 0 when no habits', () => {
    render(<DailyProgressBanner habits={[]} completedHabitIds={new Set()} />)
    expect(screen.getByText('0 de 0 fases concluídas')).toBeInTheDocument()
  })

  it('should show all completed progress', () => {
    const habits = [createMockHabit('1'), createMockHabit('2')]
    const completedHabitIds = new Set(['1', '2'])

    render(<DailyProgressBanner habits={habits} completedHabitIds={completedHabitIds} />)
    expect(screen.getByText('2 de 2 fases concluídas')).toBeInTheDocument()
  })
})
