import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Habit } from '@/types/database.types'
import { RoutineHabitsList } from '../routine-habits-list'

describe('RoutineHabitsList', () => {
  const mockHabits: (Habit & { area?: { id: string; name: string; icon: string } })[] = [
    {
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
    },
    {
      id: 'habit-2',
      user_id: 'user-123',
      name: 'Ler 30 minutos',
      type: 'boolean',
      difficulty: 'easy',
      frequency: { type: 'daily' },
      preferred_time: '20:00',
      is_archived: false,
      created_at: new Date().toISOString(),
    },
  ]

  const mockWeekDays = [
    new Date('2024-01-14'),
    new Date('2024-01-15'),
    new Date('2024-01-16'),
    new Date('2024-01-17'),
    new Date('2024-01-18'),
    new Date('2024-01-19'),
    new Date('2024-01-20'),
  ]

  const mockStreaksByHabit = new Map([
    ['habit-1', 5],
    ['habit-2', 0],
  ])

  const mockIsHabitCompletedOnDate = vi.fn().mockReturnValue(false)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
    mockIsHabitCompletedOnDate.mockReset()
    mockIsHabitCompletedOnDate.mockReturnValue(false)
  })

  it('should render section title', () => {
    render(
      <RoutineHabitsList
        habits={mockHabits}
        weekDays={mockWeekDays}
        streaksByHabit={mockStreaksByHabit}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText('Hábitos da Semana')).toBeInTheDocument()
  })

  it('should render empty message when no habits', () => {
    render(
      <RoutineHabitsList
        habits={[]}
        weekDays={mockWeekDays}
        streaksByHabit={new Map()}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText('Você ainda não tem hábitos configurados.')).toBeInTheDocument()
  })

  it('should render all habits', () => {
    render(
      <RoutineHabitsList
        habits={mockHabits}
        weekDays={mockWeekDays}
        streaksByHabit={mockStreaksByHabit}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
    expect(screen.getByText('Ler 30 minutos')).toBeInTheDocument()
  })

  it('should pass correct streak to each habit card', () => {
    render(
      <RoutineHabitsList
        habits={mockHabits}
        weekDays={mockWeekDays}
        streaksByHabit={mockStreaksByHabit}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.getByText(/🔥 5 dias/)).toBeInTheDocument()
  })

  it('should not render empty message when habits exist', () => {
    render(
      <RoutineHabitsList
        habits={mockHabits}
        weekDays={mockWeekDays}
        streaksByHabit={mockStreaksByHabit}
        isHabitCompletedOnDate={mockIsHabitCompletedOnDate}
      />
    )
    expect(screen.queryByText('Você ainda não tem hábitos configurados.')).not.toBeInTheDocument()
  })
})
