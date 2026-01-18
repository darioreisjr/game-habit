import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type HabitWithArea, useHabitMutations } from '../hooks/use-habit-mutations'

// Mock supabase client
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: mockSelect,
    }),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useHabitMutations', () => {
  const mockUser = { id: 'user-123' }

  const mockHabit: HabitWithArea = {
    id: 'habit-1',
    user_id: 'user-123',
    name: 'Test Habit',
    type: 'boolean',
    difficulty: 'medium',
    frequency: { type: 'daily' },
    area_id: null,
    preferred_time: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
    })

    // Setup chain for insert
    mockInsert.mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: mockHabit, error: null }),
      }),
    })

    // Setup chain for update
    mockUpdate.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockHabit, error: null }),
        }),
      }),
    })

    // Setup chain for delete
    mockDelete.mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    })
  })

  it('should initialize with empty habits list', () => {
    const { result } = renderHook(() => useHabitMutations())

    expect(result.current.habits).toEqual([])
    expect(result.current.mutatingId).toBeNull()
  })

  it('should set habits via setHabits', () => {
    const { result } = renderHook(() => useHabitMutations())

    act(() => {
      result.current.setHabits([mockHabit])
    })

    expect(result.current.habits).toHaveLength(1)
    expect(result.current.habits[0].name).toBe('Test Habit')
  })

  it('should create habit optimistically', async () => {
    const { result } = renderHook(() => useHabitMutations())

    await act(async () => {
      await result.current.createHabit({
        name: 'New Habit',
        area_id: null,
        difficulty: 'easy',
        frequency: { type: 'daily' },
      })
    })

    // Habit should be added to list
    expect(result.current.habits.length).toBeGreaterThanOrEqual(1)
  })

  it('should rollback on create error', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          }),
      }),
    })

    const { result } = renderHook(() => useHabitMutations())

    await act(async () => {
      const success = await result.current.createHabit({
        name: 'New Habit',
        area_id: null,
        difficulty: 'easy',
        frequency: { type: 'daily' },
      })

      expect(success).toBe(false)
    })

    // Habit should be removed after rollback
    await waitFor(() => {
      expect(result.current.habits).toHaveLength(0)
    })
  })

  it('should archive habit optimistically', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial habit
    act(() => {
      result.current.setHabits([mockHabit])
    })

    expect(result.current.habits).toHaveLength(1)

    // Mock successful update
    mockUpdate.mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    })

    await act(async () => {
      await result.current.archiveHabit(mockHabit.id)
    })

    // Habit should be removed from list (archived)
    expect(result.current.habits).toHaveLength(0)
  })

  it('should rollback on archive error', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial habit
    act(() => {
      result.current.setHabits([mockHabit])
    })

    // Mock failed update
    mockUpdate.mockReturnValue({
      eq: () => Promise.resolve({ error: { message: 'Archive error' } }),
    })

    await act(async () => {
      const success = await result.current.archiveHabit(mockHabit.id)
      expect(success).toBe(false)
    })

    // Habit should be restored after rollback
    await waitFor(() => {
      expect(result.current.habits).toHaveLength(1)
    })
  })

  it('should restore habit optimistically', async () => {
    const archivedHabit = { ...mockHabit, is_archived: true }
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial archived habit
    act(() => {
      result.current.setHabits([archivedHabit])
    })

    // Mock successful update
    mockUpdate.mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    })

    await act(async () => {
      await result.current.restoreHabit(archivedHabit.id)
    })

    // Habit should be removed from archived list
    expect(result.current.habits).toHaveLength(0)
  })

  it('should delete habit optimistically', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial habit
    act(() => {
      result.current.setHabits([mockHabit])
    })

    expect(result.current.habits).toHaveLength(1)

    await act(async () => {
      await result.current.deleteHabit(mockHabit.id)
    })

    // Habit should be deleted
    expect(result.current.habits).toHaveLength(0)
  })

  it('should rollback on delete error', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial habit
    act(() => {
      result.current.setHabits([mockHabit])
    })

    // Mock failed delete
    mockDelete.mockReturnValue({
      eq: () => Promise.resolve({ error: { message: 'Delete error' } }),
    })

    await act(async () => {
      const success = await result.current.deleteHabit(mockHabit.id)
      expect(success).toBe(false)
    })

    // Habit should be restored after rollback
    await waitFor(() => {
      expect(result.current.habits).toHaveLength(1)
    })
  })

  it('should handle expired session on create', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const { result } = renderHook(() => useHabitMutations())

    await act(async () => {
      const success = await result.current.createHabit({
        name: 'New Habit',
        area_id: null,
        difficulty: 'easy',
        frequency: { type: 'daily' },
      })

      expect(success).toBe(false)
    })

    expect(result.current.habits).toHaveLength(0)
  })

  it('should set mutatingId during operations', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial habit
    act(() => {
      result.current.setHabits([mockHabit])
    })

    // Mock slow delete
    mockDelete.mockReturnValue({
      eq: () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 100)
        }),
    })

    // Start delete but don't await
    const deletePromise = act(async () => {
      await result.current.deleteHabit(mockHabit.id)
    })

    // mutatingId should be null after completion
    await deletePromise
    expect(result.current.mutatingId).toBeNull()
  })

  it('should call onMutationSuccess callback after successful create', async () => {
    const onMutationSuccess = vi.fn()
    const { result } = renderHook(() => useHabitMutations({ onMutationSuccess }))

    await act(async () => {
      await result.current.createHabit({
        name: 'New Habit',
        area_id: null,
        difficulty: 'easy',
        frequency: { type: 'daily' },
      })
    })

    expect(onMutationSuccess).toHaveBeenCalledTimes(1)
  })

  it('should handle update habit with new data', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // Setup initial habit
    act(() => {
      result.current.setHabits([mockHabit])
    })

    const updatedHabit = { ...mockHabit, name: 'Updated Habit' }
    mockUpdate.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: updatedHabit, error: null }),
        }),
      }),
    })

    await act(async () => {
      await result.current.updateHabit(mockHabit.id, {
        name: 'Updated Habit',
        area_id: null,
        difficulty: 'hard',
        frequency: { type: 'daily' },
      })
    })

    // Habit should be updated
    expect(result.current.habits[0].name).toBe('Updated Habit')
  })

  it('should handle non-existent habit on archive', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // No habits in list
    await act(async () => {
      const success = await result.current.archiveHabit('non-existent-id')
      expect(success).toBe(false)
    })
  })

  it('should handle non-existent habit on delete', async () => {
    const { result } = renderHook(() => useHabitMutations())

    // No habits in list
    await act(async () => {
      const success = await result.current.deleteHabit('non-existent-id')
      expect(success).toBe(false)
    })
  })
})
