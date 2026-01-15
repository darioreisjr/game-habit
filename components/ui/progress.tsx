import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  color?: string
}

function Progress({
  value,
  max = 100,
  color = 'bg-mario-red',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full bg-background-light border border-border',
        className
      )}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-300 ease-in-out', color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
