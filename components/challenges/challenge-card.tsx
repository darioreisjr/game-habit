'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Challenge, UserChallenge } from '@/types/database.types'

interface ChallengeCardProps {
  challenge: Challenge
  userChallenge?: UserChallenge
}

const bossEmojis: Record<string, string> = {
  bowser: '👹',
  koopa: '🐢',
  goomba: '🍄',
  boo: '👻',
  hammer_bro: '🔨',
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
  legendary: 'bg-purple-100 text-purple-700',
}

export function ChallengeCard({ challenge, userChallenge }: ChallengeCardProps) {
  const progress = userChallenge ? (userChallenge.progress / userChallenge.goal) * 100 : 0
  const isCompleted = userChallenge?.is_completed || false
  const timeLeft = formatDistanceToNow(new Date(challenge.end_date), {
    locale: ptBR,
    addSuffix: true,
  })

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{bossEmojis[challenge.boss_type] || '👾'}</div>
          <div>
            <h3 className="font-display text-xl font-bold text-gray-900">{challenge.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
          </div>
        </div>
        <Badge className={difficultyColors[challenge.difficulty]}>
          {challenge.difficulty.toUpperCase()}
        </Badge>
      </div>

      {userChallenge && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Progresso: {userChallenge.progress} / {userChallenge.goal}
            </span>
            <span className="font-medium text-mario-red">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-2xl">⭐</span>
            <span className="font-medium text-gray-700">+{challenge.xp_reward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">💰</span>
            <span className="font-medium text-gray-700">+{challenge.coin_reward}</span>
          </div>
        </div>

        {isCompleted ? (
          <Badge className="bg-green-100 text-green-700">✅ Completo</Badge>
        ) : (
          <span className="text-sm text-gray-500">Termina {timeLeft}</span>
        )}
      </div>
    </Card>
  )
}
