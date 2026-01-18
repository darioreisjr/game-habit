import type { Profile, Stats, Streak } from '@/types/database.types'

/**
 * Factory function to create default Stats object
 */
export function createDefaultStats(userId: string): Stats {
  return {
    user_id: userId,
    level: 1,
    xp: 0,
    coins: 0,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Factory function to create default Profile object
 */
export function createDefaultProfile(userId: string, name = 'Aventureiro'): Profile {
  return {
    id: userId,
    name,
    created_at: new Date().toISOString(),
  }
}

/**
 * Factory function to create default Streak object
 */
export function createDefaultStreak(userId: string): Streak {
  return {
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get the current day of week (0 = Sunday, 6 = Saturday)
 */
export function getCurrentDayOfWeek(): number {
  return new Date().getDay()
}
