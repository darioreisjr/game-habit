import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Habit } from '@/types/database.types'
import { HabitCard } from '../habit-card'

describe('HabitCard', () => {
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

  const defaultProps = {
    habit: mockHabit,
    isCompleted: false,
    isLoading: false,
    recentCheckins: [],
    onComplete: vi.fn(),
    onArchive: vi.fn(),
  }

  it('should render habit name', () => {
    render(<HabitCard {...defaultProps} />)
    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
  })

  it('should render area icon and name', () => {
    render(<HabitCard {...defaultProps} />)
    expect(screen.getByText('💪')).toBeInTheDocument()
    expect(screen.getByText('Saúde')).toBeInTheDocument()
  })

  it('should render XP badge based on difficulty', () => {
    render(<HabitCard {...defaultProps} />)
    expect(screen.getByText('+20 XP')).toBeInTheDocument() // medium = 20 XP
  })

  it('should call onComplete when button is clicked', () => {
    const onComplete = vi.fn()
    render(<HabitCard {...defaultProps} onComplete={onComplete} />)

    const completeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(completeButton)

    expect(onComplete).toHaveBeenCalledWith('habit-1', 'medium')
  })

  it('should not call onComplete when already completed', () => {
    const onComplete = vi.fn()
    render(<HabitCard {...defaultProps} isCompleted={true} onComplete={onComplete} />)

    const completeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(completeButton)

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('should show "Completo!" badge when completed', () => {
    render(<HabitCard {...defaultProps} isCompleted={true} />)
    expect(screen.getByText('Completo!')).toBeInTheDocument()
  })

  it('should apply strikethrough style when completed', () => {
    render(<HabitCard {...defaultProps} isCompleted={true} />)
    const habitName = screen.getByText('Fazer exercício')
    expect(habitName).toHaveClass('line-through')
  })

  it('should disable button when loading', () => {
    render(<HabitCard {...defaultProps} isLoading={true} />)
    const completeButton = screen.getByRole('button', { name: '' })
    expect(completeButton).toBeDisabled()
  })

  it('should render different XP for easy difficulty', () => {
    const easyHabit = { ...mockHabit, difficulty: 'easy' as const }
    render(<HabitCard {...defaultProps} habit={easyHabit} />)
    expect(screen.getByText('+10 XP')).toBeInTheDocument()
  })

  it('should render different XP for hard difficulty', () => {
    const hardHabit = { ...mockHabit, difficulty: 'hard' as const }
    render(<HabitCard {...defaultProps} habit={hardHabit} />)
    expect(screen.getByText('+30 XP')).toBeInTheDocument()
  })

  it('should not show area when habit has no area', () => {
    const habitWithoutArea = { ...mockHabit, area: undefined }
    render(<HabitCard {...defaultProps} habit={habitWithoutArea} />)
    expect(screen.queryByText('💪')).not.toBeInTheDocument()
    expect(screen.queryByText('Saúde')).not.toBeInTheDocument()
  })
})
