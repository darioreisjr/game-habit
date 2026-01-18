'use client'

import { AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { getTimePeriodFromTime, TIME_PERIODS, type TimePeriod } from '@/lib/constants'
import { ConfirmDialog } from './confirm-dialog'
import { HabitCard } from './habit-card'
import { HabitEmptyState } from './habit-empty-state'
import type { HabitWithArea } from './hooks/use-habit-mutations'

interface HabitListProps {
  habits: HabitWithArea[]
  mutatingId: string | null
  isArchived: boolean
  groupByPeriod?: boolean
  deleteConfirm: {
    isOpen: boolean
    habitId: string | null
    habitName: string
    isLoading: boolean
  }
  onEdit: (habit: HabitWithArea) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDeleteRequest: (id: string, name: string) => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  onCreateHabit: () => void
  onClearFilters: () => void
  emptyStateVariant: 'no-habits' | 'no-results' | 'no-archived' | 'filtered'
}

interface GroupedHabits {
  morning: HabitWithArea[]
  afternoon: HabitWithArea[]
  evening: HabitWithArea[]
}

function HabitPeriodSection({
  period,
  habits,
  mutatingId,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
  onDeleteRequest,
}: {
  period: TimePeriod
  habits: HabitWithArea[]
  mutatingId: string | null
  isArchived: boolean
  onEdit: (habit: HabitWithArea) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDeleteRequest: (id: string, name: string) => void
}) {
  const periodConfig = TIME_PERIODS[period]

  if (habits.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>{periodConfig.icon}</span>
        <span className="font-medium">{periodConfig.label}</span>
        <span className="text-xs">({habits.length})</span>
      </div>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isLoading={mutatingId === habit.id}
              isArchived={isArchived}
              onEdit={onEdit}
              onArchive={onArchive}
              onRestore={onRestore}
              onDelete={(id) => onDeleteRequest(id, habit.name)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function HabitList({
  habits,
  mutatingId,
  isArchived,
  groupByPeriod = false,
  deleteConfirm,
  onEdit,
  onArchive,
  onRestore,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onCreateHabit,
  onClearFilters,
  emptyStateVariant,
}: HabitListProps) {
  const groupedHabits = useMemo(() => {
    if (!groupByPeriod) return null

    const groups: GroupedHabits = {
      morning: [],
      afternoon: [],
      evening: [],
    }

    habits.forEach((habit) => {
      const period = getTimePeriodFromTime(habit.preferred_time)
      groups[period].push(habit)
    })

    return groups
  }, [habits, groupByPeriod])

  const hasMultiplePeriods = useMemo(() => {
    if (!groupedHabits) return false
    const nonEmptyPeriods = Object.values(groupedHabits).filter((g) => g.length > 0)
    return nonEmptyPeriods.length > 1
  }, [groupedHabits])

  if (habits.length === 0) {
    return (
      <>
        <HabitEmptyState
          variant={emptyStateVariant}
          onCreateHabit={onCreateHabit}
          onClearFilters={onClearFilters}
        />
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Excluir hábito"
          description={`Tem certeza que deseja excluir "${deleteConfirm.habitName}"? Esta ação não pode ser desfeita e todos os check-ins serão perdidos.`}
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
      {groupByPeriod && hasMultiplePeriods && groupedHabits ? (
        <div className="space-y-6">
          {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((period) => (
            <HabitPeriodSection
              key={period}
              period={period}
              habits={groupedHabits[period]}
              mutatingId={mutatingId}
              isArchived={isArchived}
              onEdit={onEdit}
              onArchive={onArchive}
              onRestore={onRestore}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isLoading={mutatingId === habit.id}
                isArchived={isArchived}
                onEdit={onEdit}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={(id) => onDeleteRequest(id, habit.name)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir hábito"
        description={`Tem certeza que deseja excluir "${deleteConfirm.habitName}"? Esta ação não pode ser desfeita e todos os check-ins serão perdidos.`}
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
