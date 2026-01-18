'use client'

import { motion } from 'framer-motion'
import { Archive, Plus, Search, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type EmptyStateVariant = 'no-habits' | 'no-results' | 'no-archived' | 'filtered'

interface HabitEmptyStateProps {
  variant: EmptyStateVariant
  onCreateHabit?: () => void
  onClearFilters?: () => void
}

const EMPTY_STATE_CONFIG: Record<
  EmptyStateVariant,
  {
    icon: React.ReactNode
    title: string
    description: string
    actionLabel?: string
    actionType?: 'create' | 'clear'
  }
> = {
  'no-habits': {
    icon: <Target size={48} className="text-mario-red" />,
    title: 'Nenhum hábito ainda',
    description:
      'Comece sua jornada criando seu primeiro hábito. Pequenos passos levam a grandes conquistas!',
    actionLabel: 'Criar primeiro hábito',
    actionType: 'create',
  },
  'no-results': {
    icon: <Search size={48} className="text-text-secondary" />,
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar sua busca ou limpar os filtros para ver mais hábitos.',
    actionLabel: 'Limpar filtros',
    actionType: 'clear',
  },
  'no-archived': {
    icon: <Archive size={48} className="text-text-secondary" />,
    title: 'Nenhum hábito arquivado',
    description:
      'Quando você arquivar um hábito, ele aparecerá aqui. Arquivar é útil para pausar temporariamente um hábito.',
  },
  filtered: {
    icon: <Target size={48} className="text-text-secondary" />,
    title: 'Nenhum hábito nesta área',
    description: 'Esta área ainda não possui hábitos. Crie um novo ou selecione outra área.',
    actionLabel: 'Criar hábito',
    actionType: 'create',
  },
}

export function HabitEmptyState({ variant, onCreateHabit, onClearFilters }: HabitEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[variant]

  const handleAction = () => {
    if (config.actionType === 'create' && onCreateHabit) {
      onCreateHabit()
    } else if (config.actionType === 'clear' && onClearFilters) {
      onClearFilters()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{config.icon}</div>
          <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
          <p className="text-text-secondary mb-6 max-w-md">{config.description}</p>
          {config.actionLabel && (
            <Button onClick={handleAction} className="gap-2">
              {config.actionType === 'create' && <Plus size={20} />}
              {config.actionLabel}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
