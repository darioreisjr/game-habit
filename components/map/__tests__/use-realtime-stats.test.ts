import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stats } from '@/types/database.types'
import { useRealtimeStats } from '../hooks/use-realtime-stats'

// Mock supabase client
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
let channelCallback: ((payload: { new: Stats }) => void) | null = null

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      on: (_event: string, _config: object, callback: (payload: { new: Stats }) => void) => {
        channelCallback = callback
        return {
          subscribe: mockSubscribe,
        }
      },
    }),
    removeChannel: mockRemoveChannel,
  }),
}))

describe('useRealtimeStats', () => {
  const mockStats: Stats = {
    user_id: 'user-123',
    level: 1,
    xp: 50,
    coins: 1,
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    channelCallback = null
    mockSubscribe.mockReturnValue(undefined)
  })

  it('should subscribe to realtime updates on mount', () => {
    const onStatsUpdate = vi.fn()

    renderHook(() =>
      useRealtimeStats({
        userId: 'user-123',
        onStatsUpdate,
        currentStats: mockStats,
      })
    )

    expect(mockSubscribe).toHaveBeenCalled()
  })

  it('should call onStatsUpdate when XP increases', () => {
    const onStatsUpdate = vi.fn()

    renderHook(() =>
      useRealtimeStats({
        userId: 'user-123',
        onStatsUpdate,
        currentStats: mockStats,
      })
    )

    // Simulate realtime update with increased XP
    const newStats: Stats = {
      ...mockStats,
      xp: 100, // Increased from 50
    }

    if (channelCallback) {
      channelCallback({ new: newStats })
    }

    expect(onStatsUpdate).toHaveBeenCalledWith(newStats)
  })

  it('should call onStatsUpdate when coins increase', () => {
    const onStatsUpdate = vi.fn()

    renderHook(() =>
      useRealtimeStats({
        userId: 'user-123',
        onStatsUpdate,
        currentStats: mockStats,
      })
    )

    // Simulate realtime update with increased coins
    const newStats: Stats = {
      ...mockStats,
      coins: 5, // Increased from 1
    }

    if (channelCallback) {
      channelCallback({ new: newStats })
    }

    expect(onStatsUpdate).toHaveBeenCalledWith(newStats)
  })

  it('should NOT call onStatsUpdate when stats are lower (prevents overwriting optimistic updates)', () => {
    const onStatsUpdate = vi.fn()

    renderHook(() =>
      useRealtimeStats({
        userId: 'user-123',
        onStatsUpdate,
        currentStats: mockStats,
      })
    )

    // Simulate realtime update with lower stats
    const lowerStats: Stats = {
      ...mockStats,
      xp: 30, // Lower than current 50
      coins: 0, // Lower than current 1
    }

    if (channelCallback) {
      channelCallback({ new: lowerStats })
    }

    expect(onStatsUpdate).not.toHaveBeenCalled()
  })

  it('should cleanup subscription on unmount', () => {
    const onStatsUpdate = vi.fn()

    const { unmount } = renderHook(() =>
      useRealtimeStats({
        userId: 'user-123',
        onStatsUpdate,
        currentStats: mockStats,
      })
    )

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
