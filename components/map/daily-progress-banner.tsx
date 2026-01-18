'use client'

import { Flag } from 'lucide-react'
import { DailyXPPreview } from '@/components/map/daily-xp-preview'
import { Card } from '@/components/ui/card'
import type { Habit } from '@/types/database.types'

interface DailyProgressBannerProps {
  habits: Habit[]
  completedHabitIds: Set<string>
}

export function DailyProgressBanner({ habits, completedHabitIds }: DailyProgressBannerProps) {
  const completedCount = completedHabitIds.size
  const totalCount = habits.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Card className="bg-gradient-to-r from-mario-red/10 to-mario-blue/10 border-mario-red/20">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-semibold text-lg">Missão do Dia</h3>
            <p className="text-sm text-text-secondary">
              {completedCount} de {totalCount} fases concluídas
            </p>
          </div>
          <div className="text-4xl">
            {progress === 100 ? <Flag className="text-mario-yellow" size={40} /> : '🎯'}
          </div>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mario-red to-mario-blue transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3">
          <DailyXPPreview habits={habits} completedHabitIds={completedHabitIds} />
        </div>
      </div>
    </Card>
  )
}
