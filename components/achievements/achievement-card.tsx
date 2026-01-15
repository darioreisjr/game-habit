'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Achievement, UserAchievement } from '@/types/database.types'

interface AchievementCardProps {
  achievement: Achievement
  userAchievement?: UserAchievement
  onShare?: (userAchievementId: string) => void
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-100 text-gray-700',
  rare: 'bg-blue-100 text-blue-700',
  epic: 'bg-purple-100 text-purple-700',
  legendary: 'bg-yellow-100 text-yellow-700',
}

const rarityLabels: Record<string, string> = {
  common: 'Comum',
  rare: 'Rara',
  epic: 'Épica',
  legendary: 'Lendária',
}

export function AchievementCard({ achievement, userAchievement, onShare }: AchievementCardProps) {
  const isUnlocked = !!userAchievement
  const unlockedTime = userAchievement
    ? formatDistanceToNow(new Date(userAchievement.unlocked_at), {
        locale: ptBR,
        addSuffix: true,
      })
    : null

  return (
    <Card
      className={`p-6 transition-all ${
        isUnlocked ? 'hover:shadow-lg' : 'opacity-50 grayscale hover:opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-5xl ${!isUnlocked && 'opacity-30'}`}>{achievement.icon}</div>
          <div>
            <h3 className="font-display text-xl font-bold text-gray-900">{achievement.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
          </div>
        </div>
        <Badge className={rarityColors[achievement.rarity]}>
          {rarityLabels[achievement.rarity]}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-2xl">⭐</span>
            <span className="font-medium text-gray-700">+{achievement.xp_reward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">💰</span>
            <span className="font-medium text-gray-700">+{achievement.coin_reward}</span>
          </div>
        </div>

        {isUnlocked ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Desbloqueado {unlockedTime}</span>
            {onShare && userAchievement && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShare(userAchievement.id)}
                className="flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            )}
          </div>
        ) : (
          <Badge className="bg-gray-100 text-gray-700">🔒 Bloqueado</Badge>
        )}
      </div>
    </Card>
  )
}
