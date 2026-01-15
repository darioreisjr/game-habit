import { cn } from '@/lib/utils'

interface CoinIconProps {
  className?: string
  size?: number
}

export function CoinIcon({ className, size = 20 }: CoinIconProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-mario-yellow border-2 border-yellow-600',
        className
      )}
      style={{ width: size, height: size }}
    >
      <span className="text-yellow-800 font-bold" style={{ fontSize: size * 0.5 }}>
        C
      </span>
    </div>
  )
}
