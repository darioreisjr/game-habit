'use client'

import { motion } from 'framer-motion'
import { Edit2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Area } from '@/types/database.types'

interface AreaCardProps {
  area: Area
  habitCount: number
  isLoading: boolean
  onEdit: (area: Area) => void
  onDelete: (id: string) => void
}

export function AreaCard({ area, habitCount, isLoading, onEdit, onDelete }: AreaCardProps) {
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
          isLoading && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon and Color */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${area.color}20` }}
            >
              {area.icon}
            </div>

            {/* Area Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">{area.name}</h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${area.color}20`,
                    color: area.color,
                  }}
                >
                  {habitCount} hábito(s)
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(area)}
                disabled={isLoading}
                aria-label="Editar área"
                className="h-9 w-9"
              >
                <Edit2 size={18} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(area.id)}
                disabled={isLoading}
                aria-label="Excluir área"
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
