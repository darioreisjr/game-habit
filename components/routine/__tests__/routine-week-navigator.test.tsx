import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Checkin, Habit } from '@/types/database.types'
import { RoutineWeekNavigator } from '../routine-week-navigator'

describe('RoutineWeekNavigator', () => {
  const mockCurrentWeek = new Date('2024-01-15')
  const mockWeekStart = new Date('2024-01-14')
  const mockWeekDays = [
    new Date('2024-01-14'),
    new Date('2024-01-15'),
    new Date('2024-01-16'),
    new Date('2024-01-17'),
    new Date('2024-01-18'),
    new Date('2024-01-19'),
    new Date('2024-01-20'),
  ]

  const mockHabits: Habit[] = [
    {
      id: 'habit-1',
      user_id: 'user-123',
      name: 'Exercício',
      type: 'boolean',
      difficulty: 'medium',
      frequency: { type: 'daily' },
      preferred_time: '08:00',
      is_archived: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'habit-2',
      user_id: 'user-123',
      name: 'Leitura',
      type: 'boolean',
      difficulty: 'easy',
      frequency: { type: 'daily' },
      preferred_time: '20:00',
      is_archived: false,
      created_at: new Date().toISOString(),
    },
  ]

  const mockCheckins: Checkin[] = [
    {
      id: 'checkin-1',
      user_id: 'user-123',
      habit_id: 'habit-1',
      date: '2024-01-15',
      created_at: new Date().toISOString(),
    },
  ]

  const mockCheckinsByDate = new Map([['2024-01-15', mockCheckins]])

  const mockOnPreviousWeek = vi.fn()
  const mockOnNextWeek = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
    mockOnPreviousWeek.mockReset()
    mockOnNextWeek.mockReset()
  })

  it('should render month and year', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    expect(screen.getByText('janeiro 2024')).toBeInTheDocument()
  })

  it('should render week date range', () => {
    const { container } = render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    const dateRangeEl = container.querySelector('.text-sm.text-text-secondary')
    expect(dateRangeEl?.textContent).toMatch(/\d{2}\/01 - \d{2}\/01/)
  })

  it('should render navigation buttons', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Próxima semana')).toBeInTheDocument()
  })

  it('should call onPreviousWeek when previous button is clicked', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    fireEvent.click(screen.getByLabelText('Semana anterior'))
    expect(mockOnPreviousWeek).toHaveBeenCalledTimes(1)
  })

  it('should call onNextWeek when next button is clicked', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    fireEvent.click(screen.getByLabelText('Próxima semana'))
    expect(mockOnNextWeek).toHaveBeenCalledTimes(1)
  })

  it('should render 7 day columns', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    const dayNumbers = screen.getAllByText(/^\d+$/)
    expect(dayNumbers.length).toBe(7)
  })

  it('should show completion rate for each day', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={mockHabits}
        checkinsByDate={mockCheckinsByDate}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getAllByText('0/2').length).toBeGreaterThan(0)
  })

  it('should handle empty habits list', () => {
    render(
      <RoutineWeekNavigator
        currentWeek={mockCurrentWeek}
        weekStart={mockWeekStart}
        weekDays={mockWeekDays}
        habits={[]}
        checkinsByDate={new Map()}
        onPreviousWeek={mockOnPreviousWeek}
        onNextWeek={mockOnNextWeek}
      />
    )
    expect(screen.getAllByText('0/0').length).toBe(7)
  })
})
