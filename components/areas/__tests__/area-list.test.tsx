import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaList } from '../area-list'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('AreaList', () => {
  const mockAreas = [
    {
      id: 'area-1',
      user_id: 'user-123',
      name: 'Saúde',
      color: '#23C55E',
      icon: '💪',
      order_index: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'area-2',
      user_id: 'user-123',
      name: 'Trabalho',
      color: '#1E5BD8',
      icon: '💼',
      order_index: 1,
      created_at: new Date().toISOString(),
    },
  ]

  const mockHabitCounts = {
    'area-1': 3,
    'area-2': 5,
  }

  const defaultProps = {
    areas: mockAreas,
    habitCounts: mockHabitCounts,
    mutatingId: null,
    deleteConfirm: {
      isOpen: false,
      areaId: null,
      areaName: '',
      isLoading: false,
    },
    onEdit: vi.fn(),
    onDeleteRequest: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onDeleteCancel: vi.fn(),
    onCreateArea: vi.fn(),
  }

  it('should render list of areas', () => {
    render(<AreaList {...defaultProps} />)

    expect(screen.getByText('Saúde')).toBeInTheDocument()
    expect(screen.getByText('Trabalho')).toBeInTheDocument()
  })

  it('should render habit counts for each area', () => {
    render(<AreaList {...defaultProps} />)

    expect(screen.getByText('3 hábito(s)')).toBeInTheDocument()
    expect(screen.getByText('5 hábito(s)')).toBeInTheDocument()
  })

  it('should show empty state when no areas', () => {
    render(<AreaList {...defaultProps} areas={[]} />)

    expect(screen.getByText('Nenhuma área ainda')).toBeInTheDocument()
    expect(screen.getByText('Criar primeira área')).toBeInTheDocument()
  })

  it('should call onCreateArea when empty state button is clicked', () => {
    const onCreateArea = vi.fn()
    render(<AreaList {...defaultProps} areas={[]} onCreateArea={onCreateArea} />)

    fireEvent.click(screen.getByText('Criar primeira área'))

    expect(onCreateArea).toHaveBeenCalled()
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<AreaList {...defaultProps} onEdit={onEdit} />)

    const editButtons = screen.getAllByLabelText('Editar área')
    fireEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith(mockAreas[0])
  })

  it('should call onDeleteRequest when delete button is clicked', () => {
    const onDeleteRequest = vi.fn()
    render(<AreaList {...defaultProps} onDeleteRequest={onDeleteRequest} />)

    const deleteButtons = screen.getAllByLabelText('Excluir área')
    fireEvent.click(deleteButtons[0])

    expect(onDeleteRequest).toHaveBeenCalledWith('area-1', 'Saúde')
  })

  it('should show confirm dialog when deleteConfirm is open', () => {
    render(
      <AreaList
        {...defaultProps}
        deleteConfirm={{
          isOpen: true,
          areaId: 'area-1',
          areaName: 'Saúde',
          isLoading: false,
        }}
      />
    )

    expect(screen.getByText('Excluir área')).toBeInTheDocument()
    expect(screen.getByText(/Tem certeza que deseja excluir "Saúde"\?/)).toBeInTheDocument()
  })

  it('should call onDeleteConfirm when confirm button is clicked in dialog', () => {
    const onDeleteConfirm = vi.fn()
    render(
      <AreaList
        {...defaultProps}
        onDeleteConfirm={onDeleteConfirm}
        deleteConfirm={{
          isOpen: true,
          areaId: 'area-1',
          areaName: 'Saúde',
          isLoading: false,
        }}
      />
    )

    fireEvent.click(screen.getByText('Excluir'))

    expect(onDeleteConfirm).toHaveBeenCalled()
  })

  it('should call onDeleteCancel when cancel button is clicked in dialog', () => {
    const onDeleteCancel = vi.fn()
    render(
      <AreaList
        {...defaultProps}
        onDeleteCancel={onDeleteCancel}
        deleteConfirm={{
          isOpen: true,
          areaId: 'area-1',
          areaName: 'Saúde',
          isLoading: false,
        }}
      />
    )

    fireEvent.click(screen.getByText('Cancelar'))

    expect(onDeleteCancel).toHaveBeenCalled()
  })

  it('should show loading state for specific area', () => {
    const { container } = render(<AreaList {...defaultProps} mutatingId="area-1" />)

    // The first area should have loading state
    const cards = container.querySelectorAll('.opacity-50')
    expect(cards.length).toBe(1)
  })
})
