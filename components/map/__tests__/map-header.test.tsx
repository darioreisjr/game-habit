import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile, Stats, Streak } from '@/types/database.types'
import { MapHeader } from '../map-header'

describe('MapHeader', () => {
  const mockProfile: Profile = {
    id: 'user-123',
    name: 'João',
    created_at: new Date().toISOString(),
  }

  const mockStats: Stats = {
    user_id: 'user-123',
    level: 5,
    xp: 450,
    coins: 10,
    updated_at: new Date().toISOString(),
  }

  const mockStreak: Streak = {
    user_id: 'user-123',
    current_streak: 7,
    longest_streak: 14,
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    // Mock Date to control greeting
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render user name', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={mockStreak} />)
    expect(screen.getByText(/João/)).toBeInTheDocument()
  })

  it('should show "Bom dia" greeting in the morning', () => {
    vi.setSystemTime(new Date('2024-01-15T09:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={mockStreak} />)
    expect(screen.getByText(/Bom dia/)).toBeInTheDocument()
  })

  it('should show "Boa tarde" greeting in the afternoon', () => {
    vi.setSystemTime(new Date('2024-01-15T14:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={mockStreak} />)
    expect(screen.getByText(/Boa tarde/)).toBeInTheDocument()
  })

  it('should show "Boa noite" greeting in the evening', () => {
    vi.setSystemTime(new Date('2024-01-15T20:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={mockStreak} />)
    expect(screen.getByText(/Boa noite/)).toBeInTheDocument()
  })

  it('should show "Mundo 1-1: Hoje" subtitle', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={mockStreak} />)
    expect(screen.getByText('Mundo 1-1: Hoje')).toBeInTheDocument()
  })

  it('should render with null streak', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={null} />)
    expect(screen.getByText(/João/)).toBeInTheDocument()
  })

  it('should render with undefined streak', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00'))
    render(<MapHeader profile={mockProfile} stats={mockStats} streak={undefined} />)
    expect(screen.getByText(/João/)).toBeInTheDocument()
  })
})
