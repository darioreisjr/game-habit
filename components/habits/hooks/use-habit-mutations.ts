'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Area, Habit, HabitDifficulty } from '@/types/database.types'

export type HabitWithArea = Habit & { area?: Area }

interface HabitFormData {
  name: string
  area_id: string | null
  difficulty: HabitDifficulty
  frequency: {
    type: 'daily' | 'weekly' | 'custom'
    days?: number[]
  }
}

interface UseHabitMutationsOptions {
  onMutationSuccess?: () => void
}

interface UseHabitMutationsReturn {
  habits: HabitWithArea[]
  setHabits: React.Dispatch<React.SetStateAction<HabitWithArea[]>>
  mutatingId: string | null
  createHabit: (data: HabitFormData) => Promise<boolean>
  updateHabit: (id: string, data: HabitFormData) => Promise<boolean>
  archiveHabit: (id: string) => Promise<boolean>
  restoreHabit: (id: string) => Promise<boolean>
  deleteHabit: (id: string) => Promise<boolean>
}

export function useHabitMutations({
  onMutationSuccess,
}: UseHabitMutationsOptions = {}): UseHabitMutationsReturn {
  const [habits, setHabits] = useState<HabitWithArea[]>([])
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const createHabit = useCallback(
    async (data: HabitFormData): Promise<boolean> => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.')
        return false
      }

      const optimisticId = crypto.randomUUID()
      setMutatingId(optimisticId)

      // Optimistic update - add to list immediately
      const optimisticHabit: HabitWithArea = {
        id: optimisticId,
        user_id: user.id,
        name: data.name,
        type: 'boolean',
        difficulty: data.difficulty,
        frequency: data.frequency,
        area_id: data.area_id || undefined,
        preferred_time: undefined,
        is_archived: false,
        created_at: new Date().toISOString(),
      }

      setHabits((prev) => [optimisticHabit, ...prev])

      const { data: newHabit, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: data.name,
          type: 'boolean',
          difficulty: data.difficulty,
          frequency: data.frequency,
          area_id: data.area_id || null,
        })
        .select('*, area:areas(*)')
        .single()

      if (error) {
        // Rollback optimistic update
        setHabits((prev) => prev.filter((h) => h.id !== optimisticId))
        toast.error(`Erro ao criar hábito: ${error.message}`)
        setMutatingId(null)
        return false
      }

      // Replace optimistic habit with real one
      setHabits((prev) =>
        prev.map((h) => (h.id === optimisticId ? (newHabit as HabitWithArea) : h))
      )

      toast.success('Hábito criado com sucesso!')
      setMutatingId(null)
      onMutationSuccess?.()
      return true
    },
    [onMutationSuccess]
  )

  const updateHabit = useCallback(
    async (id: string, data: HabitFormData): Promise<boolean> => {
      const supabase = createClient()
      setMutatingId(id)

      // Store previous state for rollback
      const previousHabits = [...habits]
      const habitIndex = habits.findIndex((h) => h.id === id)

      if (habitIndex === -1) {
        setMutatingId(null)
        return false
      }

      // Optimistic update
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                name: data.name,
                difficulty: data.difficulty,
                frequency: data.frequency,
                area_id: data.area_id || undefined,
              }
            : h
        )
      )

      const { data: updatedHabit, error } = await supabase
        .from('habits')
        .update({
          name: data.name,
          difficulty: data.difficulty,
          frequency: data.frequency,
          area_id: data.area_id || null,
        })
        .eq('id', id)
        .select('*, area:areas(*)')
        .single()

      if (error) {
        // Rollback
        setHabits(previousHabits)
        toast.error(`Erro ao atualizar hábito: ${error.message}`)
        setMutatingId(null)
        return false
      }

      // Update with server response (includes area relation)
      setHabits((prev) => prev.map((h) => (h.id === id ? (updatedHabit as HabitWithArea) : h)))

      toast.success('Hábito atualizado com sucesso!')
      setMutatingId(null)
      onMutationSuccess?.()
      return true
    },
    [habits, onMutationSuccess]
  )

  const archiveHabit = useCallback(
    async (id: string): Promise<boolean> => {
      const supabase = createClient()
      setMutatingId(id)

      // Store previous state for rollback
      const previousHabits = [...habits]
      const habit = habits.find((h) => h.id === id)

      if (!habit) {
        setMutatingId(null)
        return false
      }

      // Optimistic update - remove from list
      setHabits((prev) => prev.filter((h) => h.id !== id))

      const { error } = await supabase.from('habits').update({ is_archived: true }).eq('id', id)

      if (error) {
        // Rollback
        setHabits(previousHabits)
        toast.error(`Erro ao arquivar hábito: ${error.message}`)
        setMutatingId(null)
        return false
      }

      toast.success('Hábito arquivado com sucesso!')
      setMutatingId(null)
      onMutationSuccess?.()
      return true
    },
    [habits, onMutationSuccess]
  )

  const restoreHabit = useCallback(
    async (id: string): Promise<boolean> => {
      const supabase = createClient()
      setMutatingId(id)

      // Store previous state for rollback
      const previousHabits = [...habits]

      // Optimistic update - remove from archived list
      setHabits((prev) => prev.filter((h) => h.id !== id))

      const { error } = await supabase.from('habits').update({ is_archived: false }).eq('id', id)

      if (error) {
        // Rollback
        setHabits(previousHabits)
        toast.error(`Erro ao restaurar hábito: ${error.message}`)
        setMutatingId(null)
        return false
      }

      toast.success('Hábito restaurado com sucesso!')
      setMutatingId(null)
      onMutationSuccess?.()
      return true
    },
    [habits, onMutationSuccess]
  )

  const deleteHabit = useCallback(
    async (id: string): Promise<boolean> => {
      const supabase = createClient()
      setMutatingId(id)

      // Store previous state for rollback
      const previousHabits = [...habits]
      const habit = habits.find((h) => h.id === id)

      if (!habit) {
        setMutatingId(null)
        return false
      }

      // Optimistic update - remove from list
      setHabits((prev) => prev.filter((h) => h.id !== id))

      const { error } = await supabase.from('habits').delete().eq('id', id)

      if (error) {
        // Rollback
        setHabits(previousHabits)
        toast.error(`Erro ao excluir hábito: ${error.message}`)
        setMutatingId(null)
        return false
      }

      toast.success('Hábito excluído permanentemente!')
      setMutatingId(null)
      onMutationSuccess?.()
      return true
    },
    [habits, onMutationSuccess]
  )

  return {
    habits,
    setHabits,
    mutatingId,
    createHabit,
    updateHabit,
    archiveHabit,
    restoreHabit,
    deleteHabit,
  }
}
