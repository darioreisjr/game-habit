'use client'

import { Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Area, Habit } from '@/types/database.types'
import { HabitFilterBar } from './habit-filter-bar'
import { HabitFormModal } from './habit-form-modal'
import { HabitList } from './habit-list'
import { HabitsPageSkeleton } from './habit-skeleton'
import { type HabitWithArea, useHabitMutations } from './hooks/use-habit-mutations'
import { useHabitsFilter } from './hooks/use-habits-filter'

interface HabitsViewProps {
  initialHabits: HabitWithArea[]
  initialAreas: Area[]
}

interface DeleteConfirmState {
  isOpen: boolean
  habitId: string | null
  habitName: string
  isLoading: boolean
}

export function HabitsView({ initialHabits, initialAreas }: HabitsViewProps) {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [areas] = useState<Area[]>(initialAreas)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    habitId: null,
    habitName: '',
    isLoading: false,
  })

  const {
    habits,
    setHabits,
    mutatingId,
    createHabit,
    updateHabit,
    archiveHabit,
    restoreHabit,
    deleteHabit,
  } = useHabitMutations()

  const {
    filteredHabits,
    selectedArea,
    setSelectedArea,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    activeFiltersCount,
    clearFilters,
  } = useHabitsFilter({ habits, areas })

  // Initialize habits from server
  useEffect(() => {
    setHabits(initialHabits)
  }, [initialHabits, setHabits])

  // Handle URL param for opening new habit form
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingHabit(null)
      setShowForm(true)
      // Clean URL without page reload
      window.history.replaceState({}, '', '/habits')
    }
  }, [searchParams])

  // Filter habits by archived status
  const displayedHabits = useMemo(() => {
    return filteredHabits.filter((h) => h.is_archived === showArchived)
  }, [filteredHabits, showArchived])

  // Determine empty state variant
  const emptyStateVariant = useMemo(() => {
    if (showArchived) return 'no-archived'
    if (searchQuery.trim() || selectedArea !== 'all') {
      return activeFiltersCount > 0 ? 'no-results' : 'filtered'
    }
    return 'no-habits'
  }, [showArchived, searchQuery, selectedArea, activeFiltersCount])

  // Handlers
  const handleOpenForm = useCallback(() => {
    setEditingHabit(null)
    setShowForm(true)
  }, [])

  const handleEditHabit = useCallback((habit: HabitWithArea) => {
    setEditingHabit(habit)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingHabit(null)
  }, [])

  const handleFormSuccess = useCallback(() => {
    // Form modal will close itself
    // Data is already updated via optimistic updates
  }, [])

  const handleArchive = useCallback(
    async (id: string) => {
      await archiveHabit(id)
    },
    [archiveHabit]
  )

  const handleRestore = useCallback(
    async (id: string) => {
      await restoreHabit(id)
    },
    [restoreHabit]
  )

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      habitId: id,
      habitName: name,
      isLoading: false,
    })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.habitId) return

    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }))

    const success = await deleteHabit(deleteConfirm.habitId)

    if (success) {
      setDeleteConfirm({
        isOpen: false,
        habitId: null,
        habitName: '',
        isLoading: false,
      })
    } else {
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }))
    }
  }, [deleteConfirm.habitId, deleteHabit])

  const handleDeleteCancel = useCallback(() => {
    if (deleteConfirm.isLoading) return

    setDeleteConfirm({
      isOpen: false,
      habitId: null,
      habitName: '',
      isLoading: false,
    })
  }, [deleteConfirm.isLoading])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-display font-bold">Hábitos</h1>
        </div>
        <HabitsPageSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-bold">Hábitos</h1>
        <Button onClick={handleOpenForm} className="gap-2">
          <Plus size={20} />
          Novo hábito
        </Button>
      </div>

      <HabitFilterBar
        areas={areas}
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showArchived={showArchived}
        onArchivedChange={setShowArchived}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
      />

      <HabitFormModal
        isOpen={showForm}
        habit={editingHabit}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      <HabitList
        habits={displayedHabits}
        mutatingId={mutatingId}
        isArchived={showArchived}
        groupByPeriod={false}
        deleteConfirm={deleteConfirm}
        onEdit={handleEditHabit}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onDeleteRequest={handleDeleteRequest}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={handleDeleteCancel}
        onCreateHabit={handleOpenForm}
        onClearFilters={clearFilters}
        emptyStateVariant={emptyStateVariant}
      />
    </div>
  )
}
