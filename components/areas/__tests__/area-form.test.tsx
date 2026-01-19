import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AreaForm } from '../area-form'

// Mock supabase client
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === 'areas') {
        return {
          insert: mockInsert,
          update: () => ({
            eq: () => mockUpdate(),
          }),
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => mockSelect(),
              }),
            }),
          }),
        }
      }
      return {}
    },
  }),
}))

describe('AreaForm', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockInsert.mockResolvedValue({ error: null })
    mockUpdate.mockResolvedValue({ error: null })
    mockSelect.mockResolvedValue({ data: [{ order_index: 0 }] })
  })

  it('should render empty form for new area', () => {
    render(<AreaForm {...defaultProps} />)

    expect(screen.getByLabelText('Nome da área')).toHaveValue('')
  })

  it('should populate form when editing existing area', () => {
    const existingArea = {
      id: 'area-1',
      user_id: 'user-123',
      name: 'Saúde',
      color: '#23C55E',
      icon: '💪',
      order_index: 0,
      created_at: new Date().toISOString(),
    }

    render(<AreaForm {...defaultProps} area={existingArea} />)

    expect(screen.getByLabelText('Nome da área')).toHaveValue('Saúde')
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<AreaForm {...defaultProps} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Cancelar'))

    expect(onCancel).toHaveBeenCalled()
  })

  it('should show color selection buttons', () => {
    render(<AreaForm {...defaultProps} />)

    // Should render 8 color buttons
    const colorButtons = screen.getAllByRole('button').filter((btn) => {
      const style = btn.getAttribute('style')
      return style?.includes('background-color')
    })

    expect(colorButtons.length).toBe(8)
  })

  it('should show icon selection buttons', () => {
    render(<AreaForm {...defaultProps} />)

    // Check for some of the icon emojis
    expect(screen.getByText('💪')).toBeInTheDocument()
    expect(screen.getByText('📚')).toBeInTheDocument()
    expect(screen.getByText('💼')).toBeInTheDocument()
  })

  it('should select color when clicked', () => {
    render(<AreaForm {...defaultProps} />)

    const colorButtons = screen.getAllByRole('button').filter((btn) => {
      const style = btn.getAttribute('style')
      return style?.includes('background-color')
    })

    // Click the second color
    fireEvent.click(colorButtons[1])

    // The button should have the selected class (ring)
    expect(colorButtons[1].className).toContain('ring')
  })

  it('should select icon when clicked', () => {
    render(<AreaForm {...defaultProps} />)

    const iconButton = screen.getByText('📚')
    fireEvent.click(iconButton)

    // The button should have the selected class (border-text-primary)
    expect(iconButton.className).toContain('border-text-primary')
  })

  it('should show loading state during submit', async () => {
    mockInsert.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<AreaForm {...defaultProps} />)

    const nameInput = screen.getByLabelText('Nome da área')
    fireEvent.change(nameInput, { target: { value: 'Nova área' } })

    fireEvent.click(screen.getByText('Criar área'))

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeInTheDocument()
    })
  })

  it('should call onSuccess after successful creation', async () => {
    const onSuccess = vi.fn()
    render(<AreaForm {...defaultProps} onSuccess={onSuccess} />)

    const nameInput = screen.getByLabelText('Nome da área')
    fireEvent.change(nameInput, { target: { value: 'Nova área' } })

    fireEvent.click(screen.getByText('Criar área'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show update button when editing', () => {
    const existingArea = {
      id: 'area-1',
      user_id: 'user-123',
      name: 'Saúde',
      color: '#23C55E',
      icon: '💪',
      order_index: 0,
      created_at: new Date().toISOString(),
    }

    render(<AreaForm {...defaultProps} area={existingArea} />)

    expect(screen.getByText('Atualizar')).toBeInTheDocument()
  })

  it('should disable cancel button during loading', async () => {
    mockInsert.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<AreaForm {...defaultProps} />)

    const nameInput = screen.getByLabelText('Nome da área')
    fireEvent.change(nameInput, { target: { value: 'Nova área' } })

    fireEvent.click(screen.getByText('Criar área'))

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeDisabled()
    })
  })

  it('should require name field', () => {
    render(<AreaForm {...defaultProps} />)

    const nameInput = screen.getByLabelText('Nome da área')
    expect(nameInput).toBeRequired()
  })
})
