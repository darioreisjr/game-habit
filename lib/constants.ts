import type { HabitDifficulty } from '@/types/database.types'

// Game Configuration
export const GAME_CONFIG = {
  XP_PER_COIN: 50,
  ANIMATION_DURATION_MS: 500,
  TOAST_DURATION_MS: 3000,
} as const

// Difficulty Configuration
export const DIFFICULTY_CONFIG: Record<
  HabitDifficulty,
  { variant: 'success' | 'blue' | 'warning'; label: string; xp: number }
> = {
  easy: { variant: 'success', label: 'Fácil', xp: 10 },
  medium: { variant: 'blue', label: 'Médio', xp: 20 },
  hard: { variant: 'warning', label: 'Difícil', xp: 30 },
} as const

// Time Period Configuration
export const TIME_PERIODS = {
  morning: { label: 'Manhã', icon: '🌅', hours: { start: 5, end: 12 } },
  afternoon: { label: 'Tarde', icon: '☀️', hours: { start: 12, end: 18 } },
  evening: { label: 'Noite', icon: '🌙', hours: { start: 18, end: 5 } },
} as const

export type TimePeriod = keyof typeof TIME_PERIODS

// Motivational Quotes
export const MOTIVATIONAL_QUOTES = [
  { text: 'Cada hábito completado é um bloco a mais no seu castelo.', author: 'Game Habit' },
  { text: 'Pequenos passos diários levam a grandes conquistas.', author: 'Game Habit' },
  { text: 'A consistência é a chave para desbloquear seu potencial.', author: 'Game Habit' },
  { text: 'Hoje é um novo dia para subir de level!', author: 'Game Habit' },
  { text: 'Seus hábitos de hoje constroem o herói de amanhã.', author: 'Game Habit' },
  { text: 'Não desista! Até Mario precisou de várias tentativas.', author: 'Game Habit' },
  { text: 'A jornada de mil milhas começa com um único passo.', author: 'Lao Tzu' },
  { text: 'Discipline é a ponte entre metas e realizações.', author: 'Jim Rohn' },
  {
    text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
    author: 'Robert Collier',
  },
  { text: 'Você é o que você faz repetidamente.', author: 'Aristóteles' },
] as const

// Streak Milestones
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365] as const

// Helper to get period from hour
export function getTimePeriodFromHour(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

// Helper to get period from preferred_time string (e.g., "08:00")
export function getTimePeriodFromTime(time: string | undefined | null): TimePeriod {
  if (!time) return 'morning'
  const hour = parseInt(time.split(':')[0], 10)
  return getTimePeriodFromHour(hour)
}
