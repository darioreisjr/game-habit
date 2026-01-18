import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Checkin, Stats } from '@/types/database.types'
import { useCompleteHabit } from '../hooks/use-complete-habit'

// Mock supabase client
const mockInsert = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      insert: mockInsert,
    }),
  }),
}))

describe('useCompleteHabit', () => {
  const mockStats: Stats = {
    user_id: 'user-123',
    level: 1,
    xp: 50,
    coins: 1,
    updated_at: new Date().toISOString(),
  }

  const mockCheckins: Checkin[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('should initialize with correct state', () => {
    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: mockStats,
        totalHabits: 3,
      })
    )

    expect(result.current.localStats).toEqual(mockStats)
    expect(result.current.localCheckins).toEqual(mockCheckins)
    expect(result.current.completingHabit).toBeNull()
    expect(result.current.completedHabitIds.size).toBe(0)
  })

  it('should complete a habit and update stats optimistically', async () => {
    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: mockStats,
        totalHabits: 3,
      })
    )

    await act(async () => {
      await result.current.completeHabit('habit-1', 'easy')
    })

    // XP should increase by 10 (easy difficulty)
    expect(result.current.localStats.xp).toBe(60)
    expect(result.current.localCheckins).toHaveLength(1)
    expect(result.current.localCheckins[0].habit_id).toBe('habit-1')
  })

  it('should calculate coins correctly based on XP threshold', async () => {
    const statsNearCoinThreshold: Stats = {
      ...mockStats,
      xp: 45, // 5 XP away from next coin
      coins: 0,
    }

    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: statsNearCoinThreshold,
        totalHabits: 3,
      })
    )

    await act(async () => {
      await result.current.completeHabit('habit-1', 'easy') // +10 XP = 55 total
    })

    // Should have gained 1 coin (crossed 50 XP threshold)
    expect(result.current.localStats.coins).toBe(1)
  })

  it('should not complete already completed habit', async () => {
    const existingCheckins: Checkin[] = [
      {
        id: 'checkin-1',
        habit_id: 'habit-1',
        user_id: 'user-123',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      },
    ]

    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: existingCheckins,
        initialStats: mockStats,
        totalHabits: 3,
      })
    )

    const initialXp = result.current.localStats.xp

    await act(async () => {
      await result.current.completeHabit('habit-1', 'easy')
    })

    // XP should not change
    expect(result.current.localStats.xp).toBe(initialXp)
    expect(result.current.localCheckins).toHaveLength(1)
  })

  it('should call onAllCompleted when all habits are done', async () => {
    const onAllCompleted = vi.fn()

    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: mockStats,
        totalHabits: 1, // Only 1 habit
        onAllCompleted,
      })
    )

    await act(async () => {
      await result.current.completeHabit('habit-1', 'easy')
    })

    expect(onAllCompleted).toHaveBeenCalledTimes(1)
  })

  it('should handle XP correctly for different difficulties', async () => {
    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: { ...mockStats, xp: 0 },
        totalHabits: 3,
      })
    )

    // Test medium difficulty (+20 XP)
    await act(async () => {
      await result.current.completeHabit('habit-1', 'medium')
    })

    expect(result.current.localStats.xp).toBe(20)
  })

  it('should rollback on API error', async () => {
    mockInsert.mockResolvedValue({
      error: { code: 'UNKNOWN', message: 'Database error' },
    })

    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: mockStats,
        totalHabits: 3,
      })
    )

    const initialXp = result.current.localStats.xp

    await act(async () => {
      await result.current.completeHabit('habit-1', 'easy')
    })

    // Should rollback to initial state
    await waitFor(() => {
      expect(result.current.localStats.xp).toBe(initialXp)
      expect(result.current.localCheckins).toHaveLength(0)
    })
  })

  it('should handle expired session', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: mockCheckins,
        initialStats: mockStats,
        totalHabits: 3,
      })
    )

    await act(async () => {
      await result.current.completeHabit('habit-1', 'easy')
    })

    // Should not modify state when session expired
    expect(result.current.localCheckins).toHaveLength(0)
    expect(result.current.localStats.xp).toBe(mockStats.xp)
  })

  it('should track completedHabitIds correctly', async () => {
    const existingCheckins: Checkin[] = [
      {
        id: 'checkin-1',
        habit_id: 'habit-1',
        user_id: 'user-123',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      },
    ]

    const { result } = renderHook(() =>
      useCompleteHabit({
        initialCheckins: existingCheckins,
        initialStats: mockStats,
        totalHabits: 3,
      })
    )

    expect(result.current.completedHabitIds.has('habit-1')).toBe(true)
    expect(result.current.completedHabitIds.has('habit-2')).toBe(false)
  })
})
