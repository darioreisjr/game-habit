import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Checkin } from '@/types/database.types'
import { HistoryCalendar } from '../history-calendar'

describe('HistoryCalendar', () => {
  const createMockCheckin = (date: string): Checkin => ({
    id: `checkin-${date}`,
    user_id: 'user-123',
    habit_id: 'habit-1',
    date,
    created_at: new Date().toISOString(),
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
  })

  it('should render weekday headers', () => {
    render(<HistoryCalendar checkins={[]} />)

    expect(screen.getByText('Dom')).toBeInTheDocument()
    expect(screen.getByText('Seg')).toBeInTheDocument()
    expect(screen.getByText('Ter')).toBeInTheDocument()
    expect(screen.getByText('Qua')).toBeInTheDocument()
    expect(screen.getByText('Qui')).toBeInTheDocument()
    expect(screen.getByText('Sex')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
  })

  it('should display current month and year', () => {
    render(<HistoryCalendar checkins={[]} />)

    expect(screen.getByText('Janeiro 2024')).toBeInTheDocument()
  })

  it('should navigate to previous month', () => {
    render(<HistoryCalendar checkins={[]} />)

    const prevButton = screen.getByLabelText('Mês anterior')
    fireEvent.click(prevButton)

    expect(screen.getByText('Dezembro 2023')).toBeInTheDocument()
  })

  it('should navigate to next month', () => {
    render(<HistoryCalendar checkins={[]} />)

    const nextButton = screen.getByLabelText('Próximo mês')
    fireEvent.click(nextButton)

    expect(screen.getByText('Fevereiro 2024')).toBeInTheDocument()
  })

  it('should show completion count for month', () => {
    const checkins = [
      createMockCheckin('2024-01-10'),
      createMockCheckin('2024-01-11'),
      createMockCheckin('2024-01-12'),
    ]
    render(<HistoryCalendar checkins={checkins} />)

    expect(screen.getByText('3 conclusões')).toBeInTheDocument()
  })

  it('should show singular text for one completion', () => {
    const checkins = [createMockCheckin('2024-01-10')]
    render(<HistoryCalendar checkins={checkins} />)

    expect(screen.getByText('1 conclusão')).toBeInTheDocument()
  })

  it('should render legend items', () => {
    render(<HistoryCalendar checkins={[]} />)

    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('Não concluído')).toBeInTheDocument()
    expect(screen.getByText('Hoje')).toBeInTheDocument()
  })

  it('should render day numbers', () => {
    render(<HistoryCalendar checkins={[]} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })
})
