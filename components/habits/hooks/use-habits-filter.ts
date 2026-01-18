'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Area } from '@/types/database.types'
import type { HabitWithArea } from './use-habit-mutations'

interface UseHabitsFilterOptions {
  habits: HabitWithArea[]
  areas: Area[]
}

interface UseHabitsFilterReturn {
  filteredHabits: HabitWithArea[]
  selectedArea: string
  setSelectedArea: (area: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  showArchived: boolean
  setShowArchived: (show: boolean) => void
  activeFiltersCount: number
  clearFilters: () => void
}

export function useHabitsFilter({ habits, areas }: UseHabitsFilterOptions): UseHabitsFilterReturn {
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showArchived, setShowArchived] = useState<boolean>(false)

  const filteredHabits = useMemo(() => {
    let result = habits

    // Filter by area
    if (selectedArea !== 'all') {
      result = result.filter((habit) => habit.area_id === selectedArea)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((habit) => {
        const nameMatch = habit.name.toLowerCase().includes(query)
        const areaMatch = habit.area?.name?.toLowerCase().includes(query)
        return nameMatch || areaMatch
      })
    }

    return result
  }, [habits, selectedArea, searchQuery])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedArea !== 'all') count++
    if (searchQuery.trim()) count++
    return count
  }, [selectedArea, searchQuery])

  const clearFilters = useCallback(() => {
    setSelectedArea('all')
    setSearchQuery('')
  }, [])

  return {
    filteredHabits,
    selectedArea,
    setSelectedArea,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    activeFiltersCount,
    clearFilters,
  }
}
