'use client'

import { motion } from 'framer-motion'
import { FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AreaEmptyStateProps {
  onCreateArea: () => void
}

export function AreaEmptyState({ onCreateArea }: AreaEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <FolderOpen size={48} className="text-mario-blue" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma área ainda</h3>
          <p className="text-text-secondary mb-6 max-w-md">
            Crie sua primeira área para organizar seus hábitos. Áreas ajudam você a agrupar hábitos
            por temas como Saúde, Estudos, Trabalho, etc.
          </p>
          <Button onClick={onCreateArea} className="gap-2">
            <Plus size={20} />
            Criar primeira área
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
