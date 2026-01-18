import { describe, expect, it } from 'vitest'
import {
  DIFFICULTY_CONFIG,
  GAME_CONFIG,
  getTimePeriodFromHour,
  getTimePeriodFromTime,
  MOTIVATIONAL_QUOTES,
  STREAK_MILESTONES,
  TIME_PERIODS,
} from '../constants'

describe('constants', () => {
  describe('GAME_CONFIG', () => {
    it('should have XP_PER_COIN as 50', () => {
      expect(GAME_CONFIG.XP_PER_COIN).toBe(50)
    })

    it('should have ANIMATION_DURATION_MS as 500', () => {
      expect(GAME_CONFIG.ANIMATION_DURATION_MS).toBe(500)
    })

    it('should have TOAST_DURATION_MS as 3000', () => {
      expect(GAME_CONFIG.TOAST_DURATION_MS).toBe(3000)
    })
  })

  describe('DIFFICULTY_CONFIG', () => {
    it('should have easy difficulty with 10 XP', () => {
      expect(DIFFICULTY_CONFIG.easy.xp).toBe(10)
      expect(DIFFICULTY_CONFIG.easy.label).toBe('Fácil')
      expect(DIFFICULTY_CONFIG.easy.variant).toBe('success')
    })

    it('should have medium difficulty with 20 XP', () => {
      expect(DIFFICULTY_CONFIG.medium.xp).toBe(20)
      expect(DIFFICULTY_CONFIG.medium.label).toBe('Médio')
      expect(DIFFICULTY_CONFIG.medium.variant).toBe('blue')
    })

    it('should have hard difficulty with 30 XP', () => {
      expect(DIFFICULTY_CONFIG.hard.xp).toBe(30)
      expect(DIFFICULTY_CONFIG.hard.label).toBe('Difícil')
      expect(DIFFICULTY_CONFIG.hard.variant).toBe('warning')
    })
  })

  describe('TIME_PERIODS', () => {
    it('should have morning period from 5 to 12', () => {
      expect(TIME_PERIODS.morning.hours.start).toBe(5)
      expect(TIME_PERIODS.morning.hours.end).toBe(12)
      expect(TIME_PERIODS.morning.label).toBe('Manhã')
    })

    it('should have afternoon period from 12 to 18', () => {
      expect(TIME_PERIODS.afternoon.hours.start).toBe(12)
      expect(TIME_PERIODS.afternoon.hours.end).toBe(18)
      expect(TIME_PERIODS.afternoon.label).toBe('Tarde')
    })

    it('should have evening period from 18 to 5', () => {
      expect(TIME_PERIODS.evening.hours.start).toBe(18)
      expect(TIME_PERIODS.evening.hours.end).toBe(5)
      expect(TIME_PERIODS.evening.label).toBe('Noite')
    })
  })

  describe('MOTIVATIONAL_QUOTES', () => {
    it('should have at least 10 quotes', () => {
      expect(MOTIVATIONAL_QUOTES.length).toBeGreaterThanOrEqual(10)
    })

    it('should have text and author for each quote', () => {
      MOTIVATIONAL_QUOTES.forEach((quote) => {
        expect(quote.text).toBeDefined()
        expect(quote.author).toBeDefined()
        expect(quote.text.length).toBeGreaterThan(0)
        expect(quote.author.length).toBeGreaterThan(0)
      })
    })
  })

  describe('STREAK_MILESTONES', () => {
    it('should have expected milestones', () => {
      expect(STREAK_MILESTONES).toContain(3)
      expect(STREAK_MILESTONES).toContain(7)
      expect(STREAK_MILESTONES).toContain(30)
      expect(STREAK_MILESTONES).toContain(365)
    })

    it('should be in ascending order', () => {
      for (let i = 1; i < STREAK_MILESTONES.length; i++) {
        expect(STREAK_MILESTONES[i]).toBeGreaterThan(STREAK_MILESTONES[i - 1])
      }
    })
  })

  describe('getTimePeriodFromHour', () => {
    it('should return morning for hours 5-11', () => {
      expect(getTimePeriodFromHour(5)).toBe('morning')
      expect(getTimePeriodFromHour(8)).toBe('morning')
      expect(getTimePeriodFromHour(11)).toBe('morning')
    })

    it('should return afternoon for hours 12-17', () => {
      expect(getTimePeriodFromHour(12)).toBe('afternoon')
      expect(getTimePeriodFromHour(14)).toBe('afternoon')
      expect(getTimePeriodFromHour(17)).toBe('afternoon')
    })

    it('should return evening for hours 18-23 and 0-4', () => {
      expect(getTimePeriodFromHour(18)).toBe('evening')
      expect(getTimePeriodFromHour(21)).toBe('evening')
      expect(getTimePeriodFromHour(0)).toBe('evening')
      expect(getTimePeriodFromHour(4)).toBe('evening')
    })
  })

  describe('getTimePeriodFromTime', () => {
    it('should return morning for time strings in morning', () => {
      expect(getTimePeriodFromTime('08:00')).toBe('morning')
      expect(getTimePeriodFromTime('06:30')).toBe('morning')
    })

    it('should return afternoon for time strings in afternoon', () => {
      expect(getTimePeriodFromTime('14:00')).toBe('afternoon')
      expect(getTimePeriodFromTime('17:30')).toBe('afternoon')
    })

    it('should return evening for time strings in evening', () => {
      expect(getTimePeriodFromTime('20:00')).toBe('evening')
      expect(getTimePeriodFromTime('23:30')).toBe('evening')
    })

    it('should return morning for null or undefined', () => {
      expect(getTimePeriodFromTime(null)).toBe('morning')
      expect(getTimePeriodFromTime(undefined)).toBe('morning')
    })

    it('should return morning for empty string', () => {
      expect(getTimePeriodFromTime('')).toBe('morning')
    })
  })
})
