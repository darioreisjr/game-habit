import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDefaultProfile,
  createDefaultStats,
  createDefaultStreak,
  getCurrentDayOfWeek,
  getTodayDate,
} from '../defaults'

describe('defaults', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createDefaultStats', () => {
    it('should create stats with correct user_id', () => {
      const stats = createDefaultStats('user-123')
      expect(stats.user_id).toBe('user-123')
    })

    it('should initialize with level 1', () => {
      const stats = createDefaultStats('user-123')
      expect(stats.level).toBe(1)
    })

    it('should initialize with 0 XP', () => {
      const stats = createDefaultStats('user-123')
      expect(stats.xp).toBe(0)
    })

    it('should initialize with 0 coins', () => {
      const stats = createDefaultStats('user-123')
      expect(stats.coins).toBe(0)
    })

    it('should have updated_at timestamp', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
      const stats = createDefaultStats('user-123')
      expect(stats.updated_at).toBe('2024-01-15T10:00:00.000Z')
    })
  })

  describe('createDefaultProfile', () => {
    it('should create profile with correct id', () => {
      const profile = createDefaultProfile('user-123')
      expect(profile.id).toBe('user-123')
    })

    it('should use default name "Aventureiro"', () => {
      const profile = createDefaultProfile('user-123')
      expect(profile.name).toBe('Aventureiro')
    })

    it('should use custom name when provided', () => {
      const profile = createDefaultProfile('user-123', 'João')
      expect(profile.name).toBe('João')
    })

    it('should have created_at timestamp', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
      const profile = createDefaultProfile('user-123')
      expect(profile.created_at).toBe('2024-01-15T10:00:00.000Z')
    })
  })

  describe('createDefaultStreak', () => {
    it('should create streak with correct user_id', () => {
      const streak = createDefaultStreak('user-123')
      expect(streak.user_id).toBe('user-123')
    })

    it('should initialize with 0 current streak', () => {
      const streak = createDefaultStreak('user-123')
      expect(streak.current_streak).toBe(0)
    })

    it('should initialize with 0 longest streak', () => {
      const streak = createDefaultStreak('user-123')
      expect(streak.longest_streak).toBe(0)
    })

    it('should have updated_at timestamp', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
      const streak = createDefaultStreak('user-123')
      expect(streak.updated_at).toBe('2024-01-15T10:00:00.000Z')
    })
  })

  describe('getTodayDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'))
      expect(getTodayDate()).toBe('2024-01-15')
    })

    it('should handle different dates', () => {
      vi.setSystemTime(new Date('2024-12-25T23:59:59.000Z'))
      expect(getTodayDate()).toBe('2024-12-25')
    })
  })

  describe('getCurrentDayOfWeek', () => {
    it('should return 0 for Sunday', () => {
      vi.setSystemTime(new Date('2024-01-14T10:00:00')) // Sunday
      expect(getCurrentDayOfWeek()).toBe(0)
    })

    it('should return 1 for Monday', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00')) // Monday
      expect(getCurrentDayOfWeek()).toBe(1)
    })

    it('should return 6 for Saturday', () => {
      vi.setSystemTime(new Date('2024-01-20T10:00:00')) // Saturday
      expect(getCurrentDayOfWeek()).toBe(6)
    })
  })
})
