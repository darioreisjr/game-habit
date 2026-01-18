'use client'

import { motion } from 'framer-motion'
import { Archive, Edit2, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { HabitDifficulty } from '@/types/database.types'
import type { HabitWithArea } from './hooks/use-habit-mutations'

interface HabitCardProps {
  habit: HabitWithArea
  isLoading: boolean
  isArchived: boolean
  onEdit: (habit: HabitWithArea) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  custom: 'Personalizado',
}

export function HabitCard({
  habit,
  isLoading,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: HabitCardProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[habit.difficulty as HabitDifficulty]
  const frequencyLabel =
    habit.frequency.type === 'custom'
      ? `${habit.frequency.days?.length || 0} dias/semana`
      : FREQUENCY_LABELS[habit.frequency.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          isLoading && 'opacity-50 pointer-events-none',
          isArchived && 'bg-background-light/50'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={cn('font-semibold text-lg mb-2', isArchived && 'text-text-secondary')}>
                {habit.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {habit.area && (
                  <Badge variant="secondary">
                    {habit.area.icon} {habit.area.name}
                  </Badge>
                )}
                <Badge variant={difficultyConfig.variant}>
                  {habit.difficulty === 'easy' && 'Fácil'}
                  {habit.difficulty === 'medium' && 'Médio'}
                  {habit.difficulty === 'hard' && 'Difícil'}
                  <span className="ml-1 opacity-75">+{difficultyConfig.xp} XP</span>
                </Badge>
                <Badge variant="secondary">{frequencyLabel}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(habit)}
                disabled={isLoading}
                aria-label="Editar hábito"
                className="h-9 w-9"
              >
                <Edit2 size={18} />
              </Button>

              {isArchived ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRestore(habit.id)}
                  disabled={isLoading}
                  aria-label="Restaurar hábito"
                  className="h-9 w-9 text-mario-green hover:text-mario-green"
                >
                  <RotateCcw size={18} />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onArchive(habit.id)}
                  disabled={isLoading}
                  aria-label="Arquivar hábito"
                  className="h-9 w-9"
                >
                  <Archive size={18} />
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(habit.id)}
                disabled={isLoading}
                aria-label="Excluir hábito"
                className="h-9 w-9 text-mario-red hover:text-mario-red hover:bg-mario-red/10"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
