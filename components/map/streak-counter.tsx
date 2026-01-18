'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakCounterProps {
  currentStreak: number
  className?: string
}

export function StreakCounter({ currentStreak, className }: StreakCounterProps) {
  const isOnFire = currentStreak >= 7
  const isBurning = currentStreak >= 30

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300',
        currentStreak > 0
          ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20'
          : 'bg-background-light border border-border',
        className
      )}
    >
      <div className={cn('relative', isOnFire && 'animate-pulse')}>
        <Flame
          size={20}
          className={cn(
            'transition-colors',
            currentStreak === 0 && 'text-text-secondary',
            currentStreak > 0 && currentStreak < 7 && 'text-orange-500',
            isOnFire && !isBurning && 'text-orange-600',
            isBurning && 'text-red-500'
          )}
        />
        {isBurning && (
          <Flame size={12} className="absolute -top-1 -right-1 text-yellow-500 animate-bounce" />
        )}
      </div>
      <span
        className={cn(
          'font-semibold text-sm',
          currentStreak === 0 && 'text-text-secondary',
          currentStreak > 0 && 'text-orange-600'
        )}
      >
        {currentStreak}
      </span>
      {currentStreak > 0 && (
        <span className="text-xs text-text-secondary hidden sm:inline">
          {currentStreak === 1 ? 'dia' : 'dias'}
        </span>
      )}
    </div>
  )
}
