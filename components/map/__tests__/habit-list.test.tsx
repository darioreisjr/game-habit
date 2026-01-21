import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Habit } from '@/types/database.types'
import { HabitList } from '../habit-list'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}))

// Mock HabitFormModal
vi.mock('@/components/habits/habit-form-modal', () => ({
  HabitFormModal: ({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
  }) =>
    isOpen ? (
      <div data-testid="habit-form-modal">
        <button type="button" onClick={onClose}>
          Fechar
        </button>
        <button type="button" onClick={onSuccess}>
          Salvar
        </button>
      </div>
    ) : null,
}))

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
    },
  }),
}))

describe('HabitList (Map)', () => {
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
    habits: [mockHabit],
    completedHabitIds: new Set<string>(),
    completingHabit: null,
    recentCheckins: [],
    userName: 'Test User',
    onCompleteHabit: vi.fn(),
    onArchiveHabit: vi.fn(),
    onHabitCreated: vi.fn(),
  }

  it('should render habit list with title', () => {
    render(<HabitList {...defaultProps} />)
    expect(screen.getByText('Fases de Hoje')).toBeInTheDocument()
  })

  it('should render "Novo" button', () => {
    render(<HabitList {...defaultProps} />)
    expect(screen.getByRole('button', { name: /novo/i })).toBeInTheDocument()
  })

  it('should open modal when "Novo" button is clicked', async () => {
    render(<HabitList {...defaultProps} />)

    const novoButton = screen.getByRole('button', { name: /novo/i })
    fireEvent.click(novoButton)

    await waitFor(() => {
      expect(screen.getByTestId('habit-form-modal')).toBeInTheDocument()
    })
  })

  it('should close modal when close button is clicked', async () => {
    render(<HabitList {...defaultProps} />)

    // Open modal
    const novoButton = screen.getByRole('button', { name: /novo/i })
    fireEvent.click(novoButton)

    await waitFor(() => {
      expect(screen.getByTestId('habit-form-modal')).toBeInTheDocument()
    })

    // Close modal
    const closeButton = screen.getByRole('button', { name: /fechar/i })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByTestId('habit-form-modal')).not.toBeInTheDocument()
    })
  })

  it('should call onHabitCreated and close modal on success', async () => {
    const onHabitCreated = vi.fn()
    render(<HabitList {...defaultProps} onHabitCreated={onHabitCreated} />)

    // Open modal
    const novoButton = screen.getByRole('button', { name: /novo/i })
    fireEvent.click(novoButton)

    await waitFor(() => {
      expect(screen.getByTestId('habit-form-modal')).toBeInTheDocument()
    })

    // Click save
    const saveButton = screen.getByRole('button', { name: /salvar/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onHabitCreated).toHaveBeenCalled()
      expect(screen.queryByTestId('habit-form-modal')).not.toBeInTheDocument()
    })
  })

  it('should render empty state when no habits', () => {
    render(<HabitList {...defaultProps} habits={[]} />)
    expect(screen.queryByText('Fazer exercício')).not.toBeInTheDocument()
  })

  it('should render habits', () => {
    render(<HabitList {...defaultProps} />)
    expect(screen.getByText('Fazer exercício')).toBeInTheDocument()
  })

  it('should group habits by period when multiple periods exist', () => {
    const morningHabit: Habit = {
      ...mockHabit,
      id: 'habit-morning',
      name: 'Exercício matinal',
      preferred_time: '08:00',
    }
    const eveningHabit: Habit = {
      ...mockHabit,
      id: 'habit-evening',
      name: 'Leitura noturna',
      preferred_time: '20:00',
    }

    render(<HabitList {...defaultProps} habits={[morningHabit, eveningHabit]} />)

    // Check that both habits are rendered
    expect(screen.getByText('Exercício matinal')).toBeInTheDocument()
    expect(screen.getByText('Leitura noturna')).toBeInTheDocument()

    // Check that period groups are rendered (Manhã and Noite)
    expect(screen.getByText('Manhã')).toBeInTheDocument()
    expect(screen.getByText('Noite')).toBeInTheDocument()
  })

  describe('Sorting by completion status', () => {
    it('should render completed habits after pending habits in single period', () => {
      const habit1: Habit = {
        ...mockHabit,
        id: 'habit-1',
        name: 'Hábito Pendente 1',
        preferred_time: '08:00',
      }
      const habit2: Habit = {
        ...mockHabit,
        id: 'habit-2',
        name: 'Hábito Completo',
        preferred_time: '08:00',
      }
      const habit3: Habit = {
        ...mockHabit,
        id: 'habit-3',
        name: 'Hábito Pendente 2',
        preferred_time: '08:00',
      }

      const completedHabitIds = new Set(['habit-2'])

      render(
        <HabitList
          {...defaultProps}
          habits={[habit1, habit2, habit3]}
          completedHabitIds={completedHabitIds}
        />
      )

      const habitNames = screen.getAllByRole('heading', { level: 3 })
      const names = habitNames.map((el) => el.textContent)

      // Pending habits should come before completed habits
      expect(names.indexOf('Hábito Pendente 1')).toBeLessThan(names.indexOf('Hábito Completo'))
      expect(names.indexOf('Hábito Pendente 2')).toBeLessThan(names.indexOf('Hábito Completo'))
    })

    it('should render completed habits after pending habits in grouped periods', () => {
      const morningHabit1: Habit = {
        ...mockHabit,
        id: 'habit-m1',
        name: 'Manhã Pendente',
        preferred_time: '08:00',
      }
      const morningHabit2: Habit = {
        ...mockHabit,
        id: 'habit-m2',
        name: 'Manhã Completo',
        preferred_time: '09:00',
      }
      const eveningHabit: Habit = {
        ...mockHabit,
        id: 'habit-e1',
        name: 'Noite Pendente',
        preferred_time: '20:00',
      }

      const completedHabitIds = new Set(['habit-m2'])

      render(
        <HabitList
          {...defaultProps}
          habits={[morningHabit1, morningHabit2, eveningHabit]}
          completedHabitIds={completedHabitIds}
        />
      )

      const habitNames = screen.getAllByRole('heading', { level: 3 })
      const names = habitNames.map((el) => el.textContent)

      // Within morning period, pending should come before completed
      expect(names.indexOf('Manhã Pendente')).toBeLessThan(names.indexOf('Manhã Completo'))
    })

    it('should keep all pending habits at top when none are completed', () => {
      const habit1: Habit = {
        ...mockHabit,
        id: 'habit-1',
        name: 'Primeiro Hábito',
        preferred_time: '08:00',
      }
      const habit2: Habit = {
        ...mockHabit,
        id: 'habit-2',
        name: 'Segundo Hábito',
        preferred_time: '08:00',
      }

      render(
        <HabitList {...defaultProps} habits={[habit1, habit2]} completedHabitIds={new Set()} />
      )

      const habitNames = screen.getAllByRole('heading', { level: 3 })
      expect(habitNames).toHaveLength(2)
      expect(habitNames[0].textContent).toBe('Primeiro Hábito')
      expect(habitNames[1].textContent).toBe('Segundo Hábito')
    })

    it('should move all habits to bottom when all are completed', () => {
      const habit1: Habit = {
        ...mockHabit,
        id: 'habit-1',
        name: 'Hábito 1',
        preferred_time: '08:00',
      }
      const habit2: Habit = {
        ...mockHabit,
        id: 'habit-2',
        name: 'Hábito 2',
        preferred_time: '08:00',
      }

      const completedHabitIds = new Set(['habit-1', 'habit-2'])

      render(
        <HabitList
          {...defaultProps}
          habits={[habit1, habit2]}
          completedHabitIds={completedHabitIds}
        />
      )

      // Both should be rendered with "Completo!" badge
      expect(screen.getAllByText('Completo!')).toHaveLength(2)
    })

    it('should maintain relative order of pending habits among themselves', () => {
      const habit1: Habit = {
        ...mockHabit,
        id: 'habit-1',
        name: 'Pendente A',
        preferred_time: '08:00',
      }
      const habit2: Habit = {
        ...mockHabit,
        id: 'habit-2',
        name: 'Completo X',
        preferred_time: '08:00',
      }
      const habit3: Habit = {
        ...mockHabit,
        id: 'habit-3',
        name: 'Pendente B',
        preferred_time: '08:00',
      }
      const habit4: Habit = {
        ...mockHabit,
        id: 'habit-4',
        name: 'Completo Y',
        preferred_time: '08:00',
      }

      const completedHabitIds = new Set(['habit-2', 'habit-4'])

      render(
        <HabitList
          {...defaultProps}
          habits={[habit1, habit2, habit3, habit4]}
          completedHabitIds={completedHabitIds}
        />
      )

      const habitNames = screen.getAllByRole('heading', { level: 3 })
      const names = habitNames.map((el) => el.textContent)

      // Pending habits should maintain their relative order
      expect(names.indexOf('Pendente A')).toBeLessThan(names.indexOf('Pendente B'))
      // Completed habits should maintain their relative order
      expect(names.indexOf('Completo X')).toBeLessThan(names.indexOf('Completo Y'))
      // All pending should come before all completed
      expect(names.indexOf('Pendente B')).toBeLessThan(names.indexOf('Completo X'))
    })
  })
})
