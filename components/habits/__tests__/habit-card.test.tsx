import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HabitCard } from '../habit-card'
import type { HabitWithArea } from '../hooks/use-habit-mutations'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('HabitCard', () => {
  const mockHabit: HabitWithArea = {
    id: 'habit-1',
    user_id: 'user-123',
    name: 'Fazer exercício',
    type: 'boolean',
    difficulty: 'medium',
    frequency: { type: 'daily' },
    area_id: 'area-1',
    preferred_time: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    isLoading: false,
    isArchived: false,
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onDelete: vi.fn(),
  }

  it('should render habit name', () => {
    render(<HabitCard {...defaultProps} />)

    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
  })

  it('should render area badge with icon and name', () => {
    render(<HabitCard {...defaultProps} />)

    expect(screen.getByText(/💪/)).toBeInTheDocument()
    expect(screen.getByText(/Saúde/)).toBeInTheDocument()
  })

  it('should render difficulty badge', () => {
    render(<HabitCard {...defaultProps} />)

    expect(screen.getByText(/Médio/)).toBeInTheDocument()
    expect(screen.getByText(/\+20 XP/)).toBeInTheDocument()
  })

  it('should render frequency badge for daily habit', () => {
    render(<HabitCard {...defaultProps} />)

    expect(screen.getByText('Diário')).toBeInTheDocument()
  })

  it('should render frequency badge for custom habit', () => {
    const customHabit = {
      ...mockHabit,
      frequency: { type: 'custom' as const, days: [1, 3, 5] },
    }

    render(<HabitCard {...defaultProps} habit={customHabit} />)

    expect(screen.getByText('3 dias/semana')).toBeInTheDocument()
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<HabitCard {...defaultProps} onEdit={onEdit} />)

    const editButton = screen.getByLabelText('Editar hábito')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockHabit)
  })

  it('should call onArchive when archive button is clicked', () => {
    const onArchive = vi.fn()
    render(<HabitCard {...defaultProps} onArchive={onArchive} />)

    const archiveButton = screen.getByLabelText('Arquivar hábito')
    fireEvent.click(archiveButton)

    expect(onArchive).toHaveBeenCalledWith(mockHabit.id)
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<HabitCard {...defaultProps} onDelete={onDelete} />)

    const deleteButton = screen.getByLabelText('Excluir hábito')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(mockHabit.id)
  })

  it('should show restore button when habit is archived', () => {
    render(<HabitCard {...defaultProps} isArchived={true} />)

    expect(screen.getByLabelText('Restaurar hábito')).toBeInTheDocument()
    expect(screen.queryByLabelText('Arquivar hábito')).not.toBeInTheDocument()
  })

  it('should call onRestore when restore button is clicked', () => {
    const onRestore = vi.fn()
    render(<HabitCard {...defaultProps} isArchived={true} onRestore={onRestore} />)

    const restoreButton = screen.getByLabelText('Restaurar hábito')
    fireEvent.click(restoreButton)

    expect(onRestore).toHaveBeenCalledWith(mockHabit.id)
  })

  it('should disable buttons when loading', () => {
    render(<HabitCard {...defaultProps} isLoading={true} />)

    const editButton = screen.getByLabelText('Editar hábito')
    const archiveButton = screen.getByLabelText('Arquivar hábito')
    const deleteButton = screen.getByLabelText('Excluir hábito')

    expect(editButton).toBeDisabled()
    expect(archiveButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
  })

  it('should render easy difficulty correctly', () => {
    const easyHabit = { ...mockHabit, difficulty: 'easy' as const }
    render(<HabitCard {...defaultProps} habit={easyHabit} />)

    expect(screen.getByText(/Fácil/)).toBeInTheDocument()
    expect(screen.getByText(/\+10 XP/)).toBeInTheDocument()
  })

  it('should render hard difficulty correctly', () => {
    const hardHabit = { ...mockHabit, difficulty: 'hard' as const }
    render(<HabitCard {...defaultProps} habit={hardHabit} />)

    expect(screen.getByText(/Difícil/)).toBeInTheDocument()
    expect(screen.getByText(/\+30 XP/)).toBeInTheDocument()
  })

  it('should render habit without area', () => {
    const habitWithoutArea = { ...mockHabit, area: undefined, area_id: null }
    render(<HabitCard {...defaultProps} habit={habitWithoutArea} />)

    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
    expect(screen.queryByText('💪')).not.toBeInTheDocument()
  })

  it('should apply loading styles when loading', () => {
    const { container } = render(<HabitCard {...defaultProps} isLoading={true} />)

    const card = container.querySelector('.opacity-50')
    expect(card).toBeInTheDocument()
  })
})
