'use client'

import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Area } from '@/types/database.types'
import { AreaFormModal } from './area-form-modal'
import { AreaList } from './area-list'

interface AreasViewProps {
  initialAreas: Area[]
  initialHabitCounts: Record<string, number>
}

interface DeleteConfirmState {
  isOpen: boolean
  areaId: string | null
  areaName: string
  isLoading: boolean
}

export function AreasView({ initialAreas, initialHabitCounts }: AreasViewProps) {
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [habitCounts, setHabitCounts] = useState<Record<string, number>>(initialHabitCounts)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    areaId: null,
    areaName: '',
    isLoading: false,
  })

  // Sync with initial data
  useEffect(() => {
    setAreas(initialAreas)
    setHabitCounts(initialHabitCounts)
  }, [initialAreas, initialHabitCounts])

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const [areasResult, habitsResult] = await Promise.all([
      supabase.from('areas').select('*').order('order_index'),
      supabase.from('habits').select('area_id').eq('is_archived', false),
    ])

    if (areasResult.data) {
      setAreas(areasResult.data)

      const counts: Record<string, number> = {}
      if (habitsResult.data) {
        for (const habit of habitsResult.data) {
          if (habit.area_id) {
            counts[habit.area_id] = (counts[habit.area_id] || 0) + 1
          }
        }
      }
      setHabitCounts(counts)
    }
  }, [])

  // Handlers
  const handleOpenForm = useCallback(() => {
    setEditingArea(null)
    setShowForm(true)
  }, [])

  const handleEditArea = useCallback((area: Area) => {
    setEditingArea(area)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingArea(null)
  }, [])

  const handleFormSuccess = useCallback(() => {
    loadData()
  }, [loadData])

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      areaId: id,
      areaName: name,
      isLoading: false,
    })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.areaId) return

    const areaId = deleteConfirm.areaId
    const habitCount = habitCounts[areaId] || 0

    if (habitCount > 0) {
      toast.warning(
        `Esta área possui ${habitCount} hábito(s) vinculado(s). Remova ou mova os hábitos antes de excluir.`
      )
      setDeleteConfirm({
        isOpen: false,
        areaId: null,
        areaName: '',
        isLoading: false,
      })
      return
    }

    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }))
    setMutatingId(areaId)

    const supabase = createClient()
    const { error } = await supabase.from('areas').delete().eq('id', areaId)

    if (error) {
      toast.error('Erro ao excluir área')
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }))
      setMutatingId(null)
      return
    }

    // Optimistic update
    setAreas((prev) => prev.filter((a) => a.id !== areaId))
    toast.success('Área excluída com sucesso')

    setDeleteConfirm({
      isOpen: false,
      areaId: null,
      areaName: '',
      isLoading: false,
    })
    setMutatingId(null)
  }, [deleteConfirm.areaId, habitCounts])

  const handleDeleteCancel = useCallback(() => {
    if (deleteConfirm.isLoading) return

    setDeleteConfirm({
      isOpen: false,
      areaId: null,
      areaName: '',
      isLoading: false,
    })
  }, [deleteConfirm.isLoading])

  return (
    <div className="md:ml-64">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Áreas</h1>
            <p className="text-text-secondary mt-2">Organize seus hábitos em áreas da sua vida</p>
          </div>
          <Button onClick={handleOpenForm} className="gap-2">
            <Plus size={20} />
            Nova área
          </Button>
        </div>

        <AreaFormModal
          isOpen={showForm}
          area={editingArea}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />

        <AreaList
          areas={areas}
          habitCounts={habitCounts}
          mutatingId={mutatingId}
          deleteConfirm={deleteConfirm}
          onEdit={handleEditArea}
          onDeleteRequest={handleDeleteRequest}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={handleDeleteCancel}
          onCreateArea={handleOpenForm}
        />

        {/* Info Card */}
        {areas.length > 0 && (
          <Card className="p-4 bg-background-light">
            <p className="text-sm text-text-secondary">
              💡 <strong>Dica:</strong> As áreas ajudam você a organizar seus hábitos por temas como
              Saúde, Estudos, Trabalho, etc. Você não pode excluir uma área que possui hábitos
              vinculados.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
