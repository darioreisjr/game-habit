'use client'

import { Archive, Filter, Search, X } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Area } from '@/types/database.types'

interface HabitFilterBarProps {
  areas: Area[]
  selectedArea: string
  onAreaChange: (areaId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  showArchived: boolean
  onArchivedChange: (show: boolean) => void
  activeFiltersCount: number
  onClearFilters: () => void
}

export function HabitFilterBar({
  areas,
  selectedArea,
  onAreaChange,
  searchQuery,
  onSearchChange,
  showArchived,
  onArchivedChange,
  activeFiltersCount,
  onClearFilters,
}: HabitFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleClearSearch = useCallback(() => {
    onSearchChange('')
    searchInputRef.current?.focus()
  }, [onSearchChange])

  return (
    <Card className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar hábitos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Buscar hábitos"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Limpar busca"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Area Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={18} className="text-text-secondary" />

        <button
          type="button"
          onClick={() => onAreaChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            selectedArea === 'all'
              ? 'bg-mario-red text-white shadow-sm'
              : 'bg-background-light text-text-secondary hover:bg-border'
          )}
          aria-pressed={selectedArea === 'all'}
        >
          Todos
        </button>

        {areas.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => onAreaChange(area.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1',
              selectedArea === area.id
                ? 'bg-mario-red text-white shadow-sm'
                : 'bg-background-light text-text-secondary hover:bg-border'
            )}
            aria-pressed={selectedArea === area.id}
          >
            <span>{area.icon}</span>
            <span>{area.name}</span>
          </button>
        ))}

        {/* Archived Toggle */}
        <div className="ml-auto flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-2 py-1 text-sm text-mario-red hover:underline flex items-center gap-1"
              aria-label="Limpar todos os filtros"
            >
              <X size={14} />
              Limpar ({activeFiltersCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => onArchivedChange(!showArchived)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              showArchived
                ? 'bg-mario-blue text-white shadow-sm'
                : 'bg-background-light text-text-secondary hover:bg-border'
            )}
            aria-pressed={showArchived}
          >
            <Archive size={16} />
            {showArchived ? 'Ver ativos' : 'Ver arquivados'}
          </button>
        </div>
      </div>
    </Card>
  )
}
