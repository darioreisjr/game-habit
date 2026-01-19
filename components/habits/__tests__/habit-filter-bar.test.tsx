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

  it('should render area dropdown button with default text', () => {
    render(<HabitFilterBar {...defaultProps} />)

    expect(screen.getByText('Todas as áreas')).toBeInTheDocument()
  })

  it('should render segmented control tabs', () => {
    render(<HabitFilterBar {...defaultProps} />)

    expect(screen.getByText('Ativos')).toBeInTheDocument()
    expect(screen.getByText('Arquivados')).toBeInTheDocument()
  })

  it('should show area options when dropdown is clicked', () => {
    render(<HabitFilterBar {...defaultProps} />)

    // Click the dropdown button
    fireEvent.click(screen.getByText('Todas as áreas'))

    // Check that areas are visible in the dropdown
    expect(screen.getByText('💪')).toBeInTheDocument()
    expect(screen.getByText('Saúde')).toBeInTheDocument()
    expect(screen.getByText('💼')).toBeInTheDocument()
    expect(screen.getByText('Trabalho')).toBeInTheDocument()
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

  it('should call onAreaChange when area is selected from dropdown', () => {
    const onAreaChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} onAreaChange={onAreaChange} />)

    // Open dropdown
    fireEvent.click(screen.getByText('Todas as áreas'))

    // Click on Saúde
    fireEvent.click(screen.getByText('Saúde'))

    expect(onAreaChange).toHaveBeenCalledWith('area-1')
  })

  it('should call onAreaChange with "all" when Todas as áreas is clicked', () => {
    const onAreaChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} selectedArea="area-1" onAreaChange={onAreaChange} />)

    // When an area is selected, the dropdown shows the area name
    // Open dropdown by clicking the dropdown button
    fireEvent.click(screen.getByText('Saúde'))

    // Click on "Todas as áreas" option in dropdown
    fireEvent.click(screen.getByText('Todas as áreas'))

    expect(onAreaChange).toHaveBeenCalledWith('all')
  })

  it('should show selected area name in dropdown button', () => {
    render(<HabitFilterBar {...defaultProps} selectedArea="area-1" />)

    // The dropdown button should show the selected area name
    expect(screen.getByText('Saúde')).toBeInTheDocument()
  })

  it('should call onArchivedChange when Arquivados tab is clicked', () => {
    const onArchivedChange = vi.fn()
    render(<HabitFilterBar {...defaultProps} onArchivedChange={onArchivedChange} />)

    fireEvent.click(screen.getByText('Arquivados'))

    expect(onArchivedChange).toHaveBeenCalledWith(true)
  })

  it('should call onArchivedChange with false when Ativos tab is clicked', () => {
    const onArchivedChange = vi.fn()
    render(
      <HabitFilterBar {...defaultProps} showArchived={true} onArchivedChange={onArchivedChange} />
    )

    fireEvent.click(screen.getByText('Ativos'))

    expect(onArchivedChange).toHaveBeenCalledWith(false)
  })

  it('should show clear filters button when there are active filters', () => {
    render(<HabitFilterBar {...defaultProps} activeFiltersCount={2} />)

    expect(screen.getByText('Limpar filtros (2)')).toBeInTheDocument()
  })

  it('should not show clear filters button when no active filters', () => {
    render(<HabitFilterBar {...defaultProps} activeFiltersCount={0} />)

    expect(screen.queryByText(/Limpar filtros/)).not.toBeInTheDocument()
  })

  it('should call onClearFilters when clear filters is clicked', () => {
    const onClearFilters = vi.fn()
    render(
      <HabitFilterBar {...defaultProps} activeFiltersCount={1} onClearFilters={onClearFilters} />
    )

    fireEvent.click(screen.getByText('Limpar filtros (1)'))

    expect(onClearFilters).toHaveBeenCalled()
  })

  it('should have proper aria-pressed for active tab', () => {
    render(<HabitFilterBar {...defaultProps} showArchived={false} />)

    const ativosButton = screen.getByText('Ativos').closest('button')
    expect(ativosButton).toHaveAttribute('aria-pressed', 'true')

    const arquivadosButton = screen.getByText('Arquivados').closest('button')
    expect(arquivadosButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('should have proper aria-pressed for archived tab when selected', () => {
    render(<HabitFilterBar {...defaultProps} showArchived={true} />)

    const arquivadosButton = screen.getByText('Arquivados').closest('button')
    expect(arquivadosButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should have accessible search input', () => {
    render(<HabitFilterBar {...defaultProps} />)

    const searchInput = screen.getByLabelText('Buscar hábitos')
    expect(searchInput).toBeInTheDocument()
  })

  it('should have aria-expanded on dropdown button', () => {
    render(<HabitFilterBar {...defaultProps} />)

    const dropdownButton = screen.getByText('Todas as áreas').closest('button')
    expect(dropdownButton).toHaveAttribute('aria-expanded', 'false')

    // Open dropdown
    fireEvent.click(dropdownButton!)

    expect(dropdownButton).toHaveAttribute('aria-expanded', 'true')
  })
})
