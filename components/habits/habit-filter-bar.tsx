'use client'

import { Archive, ChevronDown, Search, Sparkles, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
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
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClearSearch = useCallback(() => {
    onSearchChange('')
    searchInputRef.current?.focus()
  }, [onSearchChange])

  const selectedAreaData = areas.find((a) => a.id === selectedArea)

  const handleAreaSelect = useCallback(
    (areaId: string) => {
      onAreaChange(areaId)
      setIsAreaDropdownOpen(false)
    },
    [onAreaChange]
  )

  // Close dropdown when clicking outside
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setIsAreaDropdownOpen(false)
    }
  }, [])

  return (
    <Card className="p-4 space-y-4">
      {/* Top Row: Tabs for Active/Archived + Clear Filters */}
      <div className="flex items-center justify-between">
        {/* Segmented Control for Active/Archived */}
        <div className="inline-flex p-1 bg-background-light rounded-xl">
          <button
            type="button"
            onClick={() => onArchivedChange(false)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              !showArchived
                ? 'bg-white text-mario-red shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
            aria-pressed={!showArchived}
          >
            <Sparkles size={16} />
            Ativos
          </button>
          <button
            type="button"
            onClick={() => onArchivedChange(true)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              showArchived
                ? 'bg-white text-mario-blue shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
            aria-pressed={showArchived}
          >
            <Archive size={16} />
            Arquivados
          </button>
        </div>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-3 py-1.5 text-sm text-mario-red hover:bg-mario-red/10 rounded-lg transition-colors flex items-center gap-1.5"
            aria-label="Limpar todos os filtros"
          >
            <X size={14} />
            Limpar filtros ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Bottom Row: Search + Area Dropdown */}
      <div className="flex gap-3">
        {/* Search Input - Takes more space */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar hábitos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11"
            aria-label="Buscar hábitos"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-background-light"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Area Dropdown */}
        <div className="relative" ref={dropdownRef} onBlur={handleBlur}>
          <button
            type="button"
            onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
            className={cn(
              'h-11 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-2 min-w-40 justify-between border',
              selectedArea !== 'all'
                ? 'bg-mario-red/10 border-mario-red/30 text-mario-red'
                : 'bg-white border-border text-text-primary hover:border-mario-red/50'
            )}
            aria-expanded={isAreaDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="flex items-center gap-2 truncate">
              {selectedArea === 'all' ? (
                <>
                  <span className="text-base">📋</span>
                  <span>Todas as áreas</span>
                </>
              ) : (
                <>
                  <span className="text-base">{selectedAreaData?.icon}</span>
                  <span className="truncate">{selectedAreaData?.name}</span>
                </>
              )}
            </span>
            <ChevronDown
              size={16}
              className={cn('transition-transform shrink-0', isAreaDropdownOpen && 'rotate-180')}
            />
          </button>

          {/* Dropdown Menu */}
          {isAreaDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => handleAreaSelect('all')}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors',
                  selectedArea === 'all'
                    ? 'bg-mario-red/10 text-mario-red'
                    : 'hover:bg-background-light text-text-primary'
                )}
                role="option"
                aria-selected={selectedArea === 'all'}
              >
                <span className="text-lg">📋</span>
                <span className="font-medium">Todas as áreas</span>
              </button>

              <div className="h-px bg-border my-1 mx-3" />

              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleAreaSelect(area.id)}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors',
                    selectedArea === area.id
                      ? 'bg-mario-red/10 text-mario-red'
                      : 'hover:bg-background-light text-text-primary'
                  )}
                  role="option"
                  aria-selected={selectedArea === area.id}
                >
                  <span className="text-lg">{area.icon}</span>
                  <span className="font-medium">{area.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
