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
})
