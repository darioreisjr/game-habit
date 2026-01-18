import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HabitList } from '../habit-list'
import type { HabitWithArea } from '../hooks/use-habit-mutations'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('HabitList', () => {
  const mockHabits: HabitWithArea[] = [
    {
      id: 'habit-1',
      user_id: 'user-123',
      name: 'Fazer exercício',
      type: 'boolean',
      difficulty: 'medium',
      frequency: { type: 'daily' },
      area_id: 'area-1',
      preferred_time: 'morning',
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
    },
    {
      id: 'habit-2',
      user_id: 'user-123',
      name: 'Ler livro',
      type: 'boolean',
      difficulty: 'easy',
      frequency: { type: 'daily' },
      area_id: 'area-2',
      preferred_time: 'evening',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      area: {
        id: 'area-2',
        user_id: 'user-123',
        name: 'Educação',
        color: '#0000FF',
        icon: '📚',
        order_index: 1,
        created_at: new Date().toISOString(),
      },
    },
  ]

  const defaultProps = {
    habits: mockHabits,
    mutatingId: null,
    isArchived: false,
    groupByPeriod: false,
    deleteConfirm: {
      isOpen: false,
      habitId: null,
      habitName: '',
      isLoading: false,
    },
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onDeleteRequest: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onDeleteCancel: vi.fn(),
    onCreateHabit: vi.fn(),
    onClearFilters: vi.fn(),
    emptyStateVariant: 'no-habits' as const,
  }

  it('should render list of habits', () => {
    render(<HabitList {...defaultProps} />)

    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
    expect(screen.getByText('Ler livro')).toBeInTheDocument()
  })

  it('should show empty state when no habits', () => {
    render(<HabitList {...defaultProps} habits={[]} />)

    expect(screen.getByText('Nenhum hábito ainda')).toBeInTheDocument()
  })

  it('should show correct empty state for archived', () => {
    render(<HabitList {...defaultProps} habits={[]} emptyStateVariant="no-archived" />)

    expect(screen.getByText('Nenhum hábito arquivado')).toBeInTheDocument()
  })

  it('should show correct empty state for no results', () => {
    render(<HabitList {...defaultProps} habits={[]} emptyStateVariant="no-results" />)

    expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument()
  })

  it('should show correct empty state for filtered', () => {
    render(<HabitList {...defaultProps} habits={[]} emptyStateVariant="filtered" />)

    expect(screen.getByText('Nenhum hábito nesta área')).toBeInTheDocument()
  })

  it('should call onEdit when edit is triggered', () => {
    const onEdit = vi.fn()
    render(<HabitList {...defaultProps} onEdit={onEdit} />)

    const editButtons = screen.getAllByLabelText('Editar hábito')
    fireEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith(mockHabits[0])
  })

  it('should call onArchive when archive is triggered', () => {
    const onArchive = vi.fn()
    render(<HabitList {...defaultProps} onArchive={onArchive} />)

    const archiveButtons = screen.getAllByLabelText('Arquivar hábito')
    fireEvent.click(archiveButtons[0])

    expect(onArchive).toHaveBeenCalledWith(mockHabits[0].id)
  })

  it('should call onDeleteRequest when delete is triggered', () => {
    const onDeleteRequest = vi.fn()
    render(<HabitList {...defaultProps} onDeleteRequest={onDeleteRequest} />)

    const deleteButtons = screen.getAllByLabelText('Excluir hábito')
    fireEvent.click(deleteButtons[0])

    expect(onDeleteRequest).toHaveBeenCalledWith(mockHabits[0].id, mockHabits[0].name)
  })

  it('should show confirm dialog when deleteConfirm is open', () => {
    render(
      <HabitList
        {...defaultProps}
        deleteConfirm={{
          isOpen: true,
          habitId: 'habit-1',
          habitName: 'Fazer exercício',
          isLoading: false,
        }}
      />
    )

    expect(screen.getByText('Excluir hábito')).toBeInTheDocument()
    expect(screen.getByText(/Tem certeza que deseja excluir "Fazer exercício"/)).toBeInTheDocument()
  })

  it('should call onDeleteConfirm when confirm button is clicked', () => {
    const onDeleteConfirm = vi.fn()
    render(
      <HabitList
        {...defaultProps}
        onDeleteConfirm={onDeleteConfirm}
        deleteConfirm={{
          isOpen: true,
          habitId: 'habit-1',
          habitName: 'Fazer exercício',
          isLoading: false,
        }}
      />
    )

    fireEvent.click(screen.getByText('Excluir'))

    expect(onDeleteConfirm).toHaveBeenCalled()
  })

  it('should call onDeleteCancel when cancel button is clicked', () => {
    const onDeleteCancel = vi.fn()
    render(
      <HabitList
        {...defaultProps}
        onDeleteCancel={onDeleteCancel}
        deleteConfirm={{
          isOpen: true,
          habitId: 'habit-1',
          habitName: 'Fazer exercício',
          isLoading: false,
        }}
      />
    )

    fireEvent.click(screen.getByText('Cancelar'))

    expect(onDeleteCancel).toHaveBeenCalled()
  })

  it('should show restore button when isArchived is true', () => {
    render(<HabitList {...defaultProps} isArchived={true} />)

    const restoreButtons = screen.getAllByLabelText('Restaurar hábito')
    expect(restoreButtons).toHaveLength(2)
  })

  it('should call onRestore when restore is triggered', () => {
    const onRestore = vi.fn()
    render(<HabitList {...defaultProps} isArchived={true} onRestore={onRestore} />)

    const restoreButtons = screen.getAllByLabelText('Restaurar hábito')
    fireEvent.click(restoreButtons[0])

    expect(onRestore).toHaveBeenCalledWith(mockHabits[0].id)
  })

  it('should call onCreateHabit from empty state', () => {
    const onCreateHabit = vi.fn()
    render(
      <HabitList
        {...defaultProps}
        habits={[]}
        onCreateHabit={onCreateHabit}
        emptyStateVariant="no-habits"
      />
    )

    fireEvent.click(screen.getByText('Criar primeiro hábito'))

    expect(onCreateHabit).toHaveBeenCalled()
  })

  it('should call onClearFilters from empty state', () => {
    const onClearFilters = vi.fn()
    render(
      <HabitList
        {...defaultProps}
        habits={[]}
        onClearFilters={onClearFilters}
        emptyStateVariant="no-results"
      />
    )

    fireEvent.click(screen.getByText('Limpar filtros'))

    expect(onClearFilters).toHaveBeenCalled()
  })

  it('should show loading state for specific habit', () => {
    const { container } = render(<HabitList {...defaultProps} mutatingId="habit-1" />)

    // First habit card should have loading styles
    const loadingCard = container.querySelector('.opacity-50')
    expect(loadingCard).toBeInTheDocument()
  })
})
