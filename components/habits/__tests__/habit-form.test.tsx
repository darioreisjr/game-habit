import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitForm } from '../habit-form'

// Mock supabase client
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSelectAreas = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === 'areas') {
        return {
          select: () => ({
            order: () => mockSelectAreas(),
          }),
        }
      }
      if (table === 'habits') {
        return {
          insert: mockInsert,
          update: () => ({
            eq: () => mockUpdate(),
          }),
        }
      }
      return {}
    },
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('HabitForm', () => {
  const mockAreas = [
    {
      id: 'area-1',
      user_id: 'user-123',
      name: 'Saúde',
      color: '#FF0000',
      icon: '💪',
      order_index: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'area-2',
      user_id: 'user-123',
      name: 'Trabalho',
      color: '#0000FF',
      icon: '💼',
      order_index: 1,
      created_at: new Date().toISOString(),
    },
  ]

  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockSelectAreas.mockResolvedValue({ data: mockAreas })
    mockInsert.mockResolvedValue({ error: null })
    mockUpdate.mockResolvedValue({ error: null })
  })

  it('should render empty form for new habit', () => {
    render(<HabitForm {...defaultProps} />)

    expect(screen.getByLabelText('Nome do hábito')).toHaveValue('')
    expect(screen.getByLabelText('Área')).toHaveValue('')
  })

  it('should populate form when editing existing habit', async () => {
    const existingHabit = {
      id: 'habit-1',
      user_id: 'user-123',
      name: 'Fazer exercício',
      type: 'boolean' as const,
      difficulty: 'hard' as const,
      frequency: { type: 'daily' as const },
      area_id: 'area-1',
      preferred_time: undefined,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    render(<HabitForm {...defaultProps} habit={existingHabit} />)

    expect(screen.getByLabelText('Nome do hábito')).toHaveValue('Fazer exercício')
  })

  it('should load areas on mount', async () => {
    render(<HabitForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/💪 Saúde/)).toBeInTheDocument()
      expect(screen.getByText(/💼 Trabalho/)).toBeInTheDocument()
    })
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<HabitForm {...defaultProps} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Cancelar'))

    expect(onCancel).toHaveBeenCalled()
  })

  it('should show difficulty buttons', () => {
    render(<HabitForm {...defaultProps} />)

    expect(screen.getByText('Fácil')).toBeInTheDocument()
    expect(screen.getByText('Médio')).toBeInTheDocument()
    expect(screen.getByText('Difícil')).toBeInTheDocument()
  })

  it('should show XP values for each difficulty', () => {
    render(<HabitForm {...defaultProps} />)

    expect(screen.getByText('+10 XP')).toBeInTheDocument()
    expect(screen.getByText('+20 XP')).toBeInTheDocument()
    expect(screen.getByText('+30 XP')).toBeInTheDocument()
  })

  it('should show frequency buttons', () => {
    render(<HabitForm {...defaultProps} />)

    expect(screen.getByText('Diário')).toBeInTheDocument()
    expect(screen.getByText('Personalizado')).toBeInTheDocument()
  })

  it('should show day selector when custom frequency is selected', async () => {
    render(<HabitForm {...defaultProps} />)

    fireEvent.click(screen.getByText('Personalizado'))

    await waitFor(() => {
      expect(screen.getByText('Dom')).toBeInTheDocument()
      expect(screen.getByText('Seg')).toBeInTheDocument()
      expect(screen.getByText('Ter')).toBeInTheDocument()
      expect(screen.getByText('Qua')).toBeInTheDocument()
      expect(screen.getByText('Qui')).toBeInTheDocument()
      expect(screen.getByText('Sex')).toBeInTheDocument()
      expect(screen.getByText('Sáb')).toBeInTheDocument()
    })
  })

  it('should toggle days when clicked', async () => {
    render(<HabitForm {...defaultProps} />)

    fireEvent.click(screen.getByText('Personalizado'))

    const segButton = await screen.findByText('Seg')
    fireEvent.click(segButton)

    expect(segButton).toHaveAttribute('aria-pressed', 'true')

    // Click again to deselect
    fireEvent.click(segButton)
    expect(segButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('should show loading state during submit', async () => {
    mockInsert.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<HabitForm {...defaultProps} />)

    // Fill required field using fireEvent
    const nameInput = screen.getByLabelText('Nome do hábito')
    fireEvent.change(nameInput, { target: { value: 'Novo hábito' } })

    fireEvent.click(screen.getByText('Criar hábito'))

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeInTheDocument()
    })
  })

  it('should call onSuccess after successful creation', async () => {
    const onSuccess = vi.fn()
    render(<HabitForm {...defaultProps} onSuccess={onSuccess} />)

    // Fill required field using fireEvent
    const nameInput = screen.getByLabelText('Nome do hábito')
    fireEvent.change(nameInput, { target: { value: 'Novo hábito' } })

    fireEvent.click(screen.getByText('Criar hábito'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show update button when editing', () => {
    const existingHabit = {
      id: 'habit-1',
      user_id: 'user-123',
      name: 'Fazer exercício',
      type: 'boolean' as const,
      difficulty: 'medium' as const,
      frequency: { type: 'daily' as const },
      area_id: undefined,
      preferred_time: undefined,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    render(<HabitForm {...defaultProps} habit={existingHabit} />)

    expect(screen.getByText('Atualizar')).toBeInTheDocument()
  })

  it('should disable cancel button during loading', async () => {
    mockInsert.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<HabitForm {...defaultProps} />)

    // Fill required field using fireEvent
    const nameInput = screen.getByLabelText('Nome do hábito')
    fireEvent.change(nameInput, { target: { value: 'Novo hábito' } })

    fireEvent.click(screen.getByText('Criar hábito'))

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeDisabled()
    })
  })

  it('should require at least one day for custom frequency', async () => {
    const { toast } = await import('sonner')

    render(<HabitForm {...defaultProps} />)

    // Fill required field using fireEvent
    const nameInput = screen.getByLabelText('Nome do hábito')
    fireEvent.change(nameInput, { target: { value: 'Novo hábito' } })

    fireEvent.click(screen.getByText('Personalizado'))
    // Don't select any day

    fireEvent.click(screen.getByText('Criar hábito'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Selecione pelo menos um dia da semana')
    })
  })
})
