import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getXPForLevel(level: number): number {
  return level * 100;
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPProgress(xp: number): { current: number; total: number; percentage: number } {
  const level = getLevelFromXP(xp);
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const current = xp - xpForCurrentLevel;
  const total = xpForNextLevel - xpForCurrentLevel;
  const percentage = (current / total) * 100;

  return { current, total, percentage };
}

export function getXPForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): number {
  const xpMap = {
    easy: 10,
    medium: 20,
    hard: 30,
  };
  return xpMap[difficulty];
}
