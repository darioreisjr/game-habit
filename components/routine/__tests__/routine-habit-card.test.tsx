import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Habit } from '@/types/database.types'
import { RoutineHabitCard } from '../routine-habit-card'

describe('RoutineHabitCard', () => {
  const mockHabit: Habit & { area?: { id: string; name: string; icon: string } } = {
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
      name: 'Saúde',
      icon: '💪',
    },
  }

  const mockWeekDays = [
    new Date('2024-01-14'),
    new Date('2024-01-15'),
    new Date('2024-01-16'),
    new Date('2024-01-17'),
    new Date('2024-01-18'),
    new Date('2024-01-19'),
    new Date('2024-01-20'),
  ]

  const mockIsHabitCompletedOnDate = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
    mockIsHabitCompletedOnDate.mockReset()
  })

  it('should render habit name', () => {
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
  })

  it('should render area badge when area exists', () => {
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText(/💪.*Saúde/)).toBeInTheDocument()
  })

  it('should not render area badge when area is undefined', () => {
    const habitWithoutArea = { ...mockHabit, area: undefined }
    render(
      <RoutineHabitCard
        habit={habitWithoutArea}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.queryByText('💪')).not.toBeInTheDocument()
  })

  it('should render streak badge when streak is greater than 0', () => {
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={5}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText(/🔥 5 dias/)).toBeInTheDocument()
  })

  it('should render singular day text when streak is 1', () => {
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={1}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText(/🔥 1 dia/)).toBeInTheDocument()
  })

  it('should not render streak badge when streak is 0', () => {
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument()
  })

  it('should render 7 day cells', () => {
    mockIsHabitCompletedOnDate.mockReturnValue(false)
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    const dayCells = screen.getAllByText(/^\d+$/)
    expect(dayCells.length).toBe(7)
  })

  it('should render checkmark for completed days', () => {
    mockIsHabitCompletedOnDate.mockImplementation((habitId, date) => {
      return date.toISOString() === mockWeekDays[0].toISOString()
    })
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('should call isHabitCompletedOnDate for each day', () => {
    mockIsHabitCompletedOnDate.mockReturnValue(false)
    render(
      <RoutineHabitCard
        habit={mockHabit}
        weekDays={mockWeekDays}
        streak={0}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(mockIsHabitCompletedOnDate).toHaveBeenCalledTimes(7)
  })
})
