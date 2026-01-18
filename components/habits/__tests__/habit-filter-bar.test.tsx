import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Area } from '@/types/database.types'
import { HabitFilterBar } from '../habit-filter-bar'

describe('HabitFilterBar', () => {
  const mockAreas: Area[] = [
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
    areas: mockAreas,
    selectedArea: 'all',
    onAreaChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    showArchived: false,
    onArchivedChange: vi.fn(),
    activeFiltersCount: 0,
    onClearFilters: vi.fn(),
  }

  it('should render search input', () => {
    render(<HabitFilterBar {...defaultProps} />)

    expect(screen.getByPlaceholderText('Buscar hábitos...')).toBeInTheDocument()
  })

  it('should render area filter buttons', () => {
    render(<HabitFilterBar {...defaultProps} />)

    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText(/💪/)).toBeInTheDocument()
    expect(screen.getByText(/Saúde/)).toBeInTheDocument()
    expect(screen.getByText(/💼/)).toBeInTheDocument()
    expect(screen.getByText(/Trabalho/)).toBeInTheDocument()
  })

  it('should render archived toggle button', () => {
    render(<HabitFilterBar {...defaultProps} />)

    expect(screen.getByText('Ver arquivados')).toBeInTheDocument()
  })

  it('should show "Ver ativos" when showing archived', () => {
    render(<HabitFilterBar {...defaultProps} showArchived={true} />)

    expect(screen.getByText('Ver ativos')).toBeInTheDocument()
  })

  it('should call onSearchChange when typing in search', () => {
    const onSearchChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} onSearchChange={onSearchChange} />)

    const searchInput = screen.getByPlaceholderText('Buscar hábitos...')
    fireEvent.change(searchInput, { target: { value: 'exercício' } })

    expect(onSearchChange).toHaveBeenCalledWith('exercício')
  })

  it('should show clear search button when search has value', () => {
    render(<HabitFilterBar {...defaultProps} searchQuery="exercício" />)

    expect(screen.getByLabelText('Limpar busca')).toBeInTheDocument()
  })

  it('should clear search when clear button is clicked', () => {
    const onSearchChange = vi.fn()
    render(
      <HabitFilterBar {...defaultProps} searchQuery="exercício" onSearchChange={onSearchChange} />
    )

    fireEvent.click(screen.getByLabelText('Limpar busca'))

    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  it('should call onAreaChange when area button is clicked', () => {
    const onAreaChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} onAreaChange={onAreaChange} />)

    fireEvent.click(screen.getByText(/Saúde/))

    expect(onAreaChange).toHaveBeenCalledWith('area-1')
  })

  it('should call onAreaChange with "all" when Todos is clicked', () => {
    const onAreaChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} selectedArea="area-1" onAreaChange={onAreaChange} />)

    fireEvent.click(screen.getByText('Todos'))

    expect(onAreaChange).toHaveBeenCalledWith('all')
  })

  it('should highlight selected area', () => {
    render(<HabitFilterBar {...defaultProps} selectedArea="area-1" />)

    const saudeButton = screen.getByText(/Saúde/).closest('button')
    expect(saudeButton).toHaveClass('bg-mario-red')
  })

  it('should call onArchivedChange when archive toggle is clicked', () => {
    const onArchivedChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} onArchivedChange={onArchivedChange} />)

    fireEvent.click(screen.getByText('Ver arquivados'))

    expect(onArchivedChange).toHaveBeenCalledWith(true)
  })

  it('should toggle archived back to false', () => {
    const onArchivedChange = vi.fn()
    render(
      <HabitFilterBar {...defaultProps} showArchived={true} onArchivedChange={onArchivedChange} />
    )

    fireEvent.click(screen.getByText('Ver ativos'))

    expect(onArchivedChange).toHaveBeenCalledWith(false)
  })

  it('should show clear filters button when there are active filters', () => {
    render(<HabitFilterBar {...defaultProps} activeFiltersCount={2} />)

    expect(screen.getByText('Limpar (2)')).toBeInTheDocument()
  })

  it('should not show clear filters button when no active filters', () => {
    render(<HabitFilterBar {...defaultProps} activeFiltersCount={0} />)

    expect(screen.queryByText(/Limpar \(/)).not.toBeInTheDocument()
  })

  it('should call onClearFilters when clear filters is clicked', () => {
    const onClearFilters = vi.fn()
    render(
      <HabitFilterBar {...defaultProps} activeFiltersCount={1} onClearFilters={onClearFilters} />
    )

    fireEvent.click(screen.getByText('Limpar (1)'))

    expect(onClearFilters).toHaveBeenCalled()
  })

  it('should have proper aria-pressed for selected area', () => {
    render(<HabitFilterBar {...defaultProps} selectedArea="all" />)

    const todosButton = screen.getByText('Todos')
    expect(todosButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should have proper aria-pressed for archived toggle', () => {
    render(<HabitFilterBar {...defaultProps} showArchived={true} />)

    const archivedButton = screen.getByText('Ver ativos')
    expect(archivedButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should have accessible search input', () => {
    render(<HabitFilterBar {...defaultProps} />)

    const searchInput = screen.getByLabelText('Buscar hábitos')
    expect(searchInput).toBeInTheDocument()
  })
})
