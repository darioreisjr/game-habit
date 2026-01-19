import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaFormModal } from '../area-form-modal'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock supabase client
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      insert: mockInsert,
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => mockSelect(),
          }),
        }),
      }),
    }),
  }),
}))

describe('AreaFormModal', () => {
  const defaultProps = {
    isOpen: true,
    area: null,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockInsert.mockResolvedValue({ error: null })
    mockSelect.mockResolvedValue({ data: [{ order_index: 0 }] })
  })

  it('should not render when closed', () => {
    render(<AreaFormModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Nova Área')).not.toBeInTheDocument()
  })

  it('should render when open', () => {
    render(<AreaFormModal {...defaultProps} />)

    expect(screen.getByText('Nova Área')).toBeInTheDocument()
  })

  it('should show edit title when area is provided', () => {
    const existingArea = {
      id: 'area-1',
      user_id: 'user-123',
      name: 'Saúde',
      color: '#23C55E',
      icon: '💪',
      order_index: 0,
      created_at: new Date().toISOString(),
    }

    render(<AreaFormModal {...defaultProps} area={existingArea} />)

    expect(screen.getByText('Editar Área')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<AreaFormModal {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByLabelText('Fechar modal')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when escape key is pressed', () => {
    const onClose = vi.fn()
    render(<AreaFormModal {...defaultProps} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<AreaFormModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Cancelar'))

    expect(onClose).toHaveBeenCalled()
  })

  it('should have correct aria attributes', () => {
    render(<AreaFormModal {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'area-modal-title')
  })

  it('should contain the AreaForm component', () => {
    render(<AreaFormModal {...defaultProps} />)

    expect(screen.getByLabelText('Nome da área')).toBeInTheDocument()
  })
})
