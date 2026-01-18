'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { TIME_PERIODS, type TimePeriod } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface HabitPeriodGroupProps {
  period: TimePeriod
  children: React.ReactNode
  count: number
  completedCount: number
  defaultExpanded?: boolean
}

export function HabitPeriodGroup({
  period,
  children,
  count,
  completedCount,
  defaultExpanded = true,
}: HabitPeriodGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const periodConfig = TIME_PERIODS[period]
  const allCompleted = count > 0 && completedCount === count

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all',
          'hover:bg-background-light',
          allCompleted && 'bg-mario-green/5'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{periodConfig.icon}</span>
          <span className="font-medium text-sm">{periodConfig.label}</span>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              allCompleted
                ? 'bg-mario-green/10 text-mario-green'
                : 'bg-background-light text-text-secondary'
            )}
          >
            {completedCount}/{count}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={cn('text-text-secondary transition-transform', isExpanded && 'rotate-180')}
        />
      </button>

      {isExpanded && <div className="space-y-2">{children}</div>}
    </div>
  )
}
