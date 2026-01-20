import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaCard } from '../area-card'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('AreaCard', () => {
  const mockArea = {
    id: 'area-1',
    user_id: 'user-123',
    name: 'Saúde',
    color: '#23C55E',
    icon: '💪',
    order_index: 0,
    created_at: new Date().toISOString(),
  }

  const defaultProps = {
    area: mockArea,
    habitCount: 5,
    isLoading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('should render area name', () => {
    render(<AreaCard {...defaultProps} />)

    expect(screen.getByText('Saúde')).toBeInTheDocument()
  })

  it('should render area icon', () => {
    render(<AreaCard {...defaultProps} />)

    expect(screen.getByText('💪')).toBeInTheDocument()
  })

  it('should render habit count', () => {
    render(<AreaCard {...defaultProps} />)

    expect(screen.getByText('5 hábito(s)')).toBeInTheDocument()
  })

  it('should render zero habit count', () => {
    render(<AreaCard {...defaultProps} habitCount={0} />)

    expect(screen.getByText('0 hábito(s)')).toBeInTheDocument()
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<AreaCard {...defaultProps} onEdit={onEdit} />)

    const editButton = screen.getByLabelText('Editar área')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockArea)
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<AreaCard {...defaultProps} onDelete={onDelete} />)

    const deleteButton = screen.getByLabelText('Excluir área')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith('area-1')
  })

  it('should show loading state', () => {
    const { container } = render(<AreaCard {...defaultProps} isLoading={true} />)

    // Find the card element
    const card = container.querySelector('.opacity-50')
    expect(card).toBeInTheDocument()
  })

  it('should disable buttons when loading', () => {
    render(<AreaCard {...defaultProps} isLoading={true} />)

    const editButton = screen.getByLabelText('Editar área')
    const deleteButton = screen.getByLabelText('Excluir área')

    expect(editButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
  })

  it('should apply area color to badge', () => {
    render(<AreaCard {...defaultProps} />)

    const badge = screen.getByText('5 hábito(s)')
    expect(badge).toHaveStyle({ color: '#23C55E' })
  })

  it('should apply area color to icon background', () => {
    const { container } = render(<AreaCard {...defaultProps} />)

    const iconContainer = container.querySelector('[style*="background-color"]')
    expect(iconContainer).toHaveStyle({ backgroundColor: '#23C55E20' })
  })
})
