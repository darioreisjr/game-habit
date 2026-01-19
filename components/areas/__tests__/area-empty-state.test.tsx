import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaEmptyState } from '../area-empty-state'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

describe('AreaEmptyState', () => {
  const defaultProps = {
    onCreateArea: vi.fn(),
  }

  it('should render empty state title', () => {
    render(<AreaEmptyState {...defaultProps} />)

    expect(screen.getByText('Nenhuma área ainda')).toBeInTheDocument()
  })

  it('should render empty state description', () => {
    render(<AreaEmptyState {...defaultProps} />)

    expect(
      screen.getByText(/Crie sua primeira área para organizar seus hábitos/)
    ).toBeInTheDocument()
  })

  it('should render create button', () => {
    render(<AreaEmptyState {...defaultProps} />)

    expect(screen.getByText('Criar primeira área')).toBeInTheDocument()
  })

  it('should call onCreateArea when button is clicked', () => {
    const onCreateArea = vi.fn()
    render(<AreaEmptyState onCreateArea={onCreateArea} />)

    fireEvent.click(screen.getByText('Criar primeira área'))

    expect(onCreateArea).toHaveBeenCalled()
  })
})
