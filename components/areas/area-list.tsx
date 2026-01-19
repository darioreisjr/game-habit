'use client'

import { AnimatePresence } from 'framer-motion'
import { ConfirmDialog } from '@/components/habits/confirm-dialog'
import type { Area } from '@/types/database.types'
import { AreaCard } from './area-card'
import { AreaEmptyState } from './area-empty-state'

interface AreaListProps {
  areas: Area[]
  habitCounts: Record<string, number>
  mutatingId: string | null
  deleteConfirm: {
    isOpen: boolean
    areaId: string | null
    areaName: string
    isLoading: boolean
  }
  onEdit: (area: Area) => void
  onDeleteRequest: (id: string, name: string) => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  onCreateArea: () => void
}

export function AreaList({
  areas,
  habitCounts,
  mutatingId,
  deleteConfirm,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onCreateArea,
}: AreaListProps) {
  if (areas.length === 0) {
    return (
      <>
        <AreaEmptyState onCreateArea={onCreateArea} />
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Excluir área"
          description={`Tem certeza que deseja excluir "${deleteConfirm.areaName}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          isLoading={deleteConfirm.isLoading}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {areas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              habitCount={habitCounts[area.id] || 0}
              isLoading={mutatingId === area.id}
              onEdit={onEdit}
              onDelete={(id) => onDeleteRequest(id, area.name)}
            />
          ))}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir área"
        description={`Tem certeza que deseja excluir "${deleteConfirm.areaName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteConfirm.isLoading}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </>
  )
}
