'use client'

import { Gamepad2, Plus, Sparkles, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EmptyStateProps {
  variant: 'no-habits' | 'all-completed'
  userName?: string
}

const SUGGESTED_HABITS = [
  { name: 'Beber 2L de água', icon: '💧', difficulty: 'easy' },
  { name: 'Exercício 30min', icon: '🏃', difficulty: 'medium' },
  { name: 'Ler 20 páginas', icon: '📚', difficulty: 'easy' },
  { name: 'Meditar 10min', icon: '🧘', difficulty: 'easy' },
]

export function EmptyState({ variant, userName }: EmptyStateProps) {
  const router = useRouter()

  if (variant === 'all-completed') {
    return (
      <Card className="bg-gradient-to-r from-mario-yellow/20 to-mario-green/20 border-mario-green">
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-2xl font-display font-bold mb-2">Parabéns!</h3>
          <p className="text-text-secondary mb-4">
            Você completou todas as fases de hoje! Continue assim!
          </p>

          <div className="mt-6 pt-4 border-t border-mario-green/20">
            <p className="text-sm text-text-secondary mb-3">Quer adicionar mais desafios?</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/habits?new=1')}>
              <Plus size={16} className="mr-1" />
              Novo hábito
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-mario-red/10 to-mario-blue/10 rounded-full flex items-center justify-center">
          <Gamepad2 size={32} className="text-mario-red" />
        </div>

        <div>
          <h3 className="text-xl font-display font-semibold mb-2">
            {userName ? `Olá, ${userName}!` : 'Bem-vindo!'}
          </h3>
          <p className="text-text-secondary">Comece sua jornada criando seu primeiro hábito.</p>
        </div>

        <Button onClick={() => router.push('/habits?new=1')} className="gap-2">
          <Plus size={18} />
          Criar primeiro hábito
        </Button>

        <div className="pt-6 border-t border-border mt-6">
          <div className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-4">
            <Sparkles size={16} className="text-mario-yellow" />
            <span>Sugestões para começar</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_HABITS.map((habit) => (
              <button
                key={habit.name}
                type="button"
                onClick={() =>
                  router.push(
                    `/habits?new=1&name=${encodeURIComponent(habit.name)}&difficulty=${habit.difficulty}`
                  )
                }
                className="flex items-center gap-2 p-3 rounded-lg bg-background-light hover:bg-background-light/80 transition-colors text-left text-sm group"
              >
                <span className="text-lg">{habit.icon}</span>
                <span className="flex-1 truncate text-text-primary group-hover:text-mario-blue transition-colors">
                  {habit.name}
                </span>
                <Target
                  size={14}
                  className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
