'use client'

import { Zap } from 'lucide-react'
import { CoinIcon } from '@/components/ui/coin-icon'
import { Progress } from '@/components/ui/progress'
import { getXPProgress } from '@/lib/utils'

interface StatsDisplayProps {
  level: number
  xp: number
  coins: number
  variant?: 'compact' | 'full'
  hideCoins?: boolean
}

export function StatsDisplay({
  level,
  xp,
  coins,
  variant = 'compact',
  hideCoins = false,
}: StatsDisplayProps) {
  const { current, total, percentage } = getXPProgress(xp)

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-mario-red flex items-center justify-center">
            <span className="text-white text-xs font-pixel">{level}</span>
          </div>
          <div className="w-24">
            <Progress value={current} max={total} color="bg-mario-red" />
          </div>
        </div>
        {!hideCoins && (
          <div className="flex items-center gap-1.5">
            <CoinIcon size={20} />
            <span className="font-medium text-sm">{coins}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mario-red to-mario-red/80 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-white text-xl font-pixel">{level}</span>
          </div>
          <div>
            <div className="text-sm text-text-secondary font-medium">LEVEL</div>
            <div className="text-2xl font-display font-bold">{level}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CoinIcon size={32} />
          <span className="text-3xl font-display font-bold">{coins}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-mario-red">
            <Zap size={16} />
            <span className="font-medium">XP</span>
          </div>
          <span className="text-text-secondary font-medium">
            {current} / {total}
          </span>
        </div>
        <Progress value={current} max={total} color="bg-mario-red" className="h-4" />
        <div className="text-xs text-text-secondary text-center">
          {Math.round(percentage)}% para o próximo nível
        </div>
      </div>
    </div>
  )
}
