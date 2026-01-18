'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Archive, Edit3, History, MoreVertical, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface HabitContextMenuProps {
  habitId: string
  habitName: string
  onArchive?: (habitId: string) => void
  className?: string
}

export function HabitContextMenu({
  habitId,
  habitName,
  onArchive,
  className,
}: HabitContextMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleEdit = () => {
    router.push(`/habits?edit=${habitId}`)
    setIsOpen(false)
  }

  const handleViewHistory = () => {
    router.push(`/habits/${habitId}/history`)
    setIsOpen(false)
  }

  const handleArchive = () => {
    if (onArchive) {
      onArchive(habitId)
    }
    setIsOpen(false)
  }

  const menuItems = [
    {
      icon: Edit3,
      label: 'Editar',
      onClick: handleEdit,
      variant: 'default' as const,
    },
    {
      icon: History,
      label: 'Ver histórico',
      onClick: handleViewHistory,
      variant: 'default' as const,
    },
    {
      icon: Archive,
      label: 'Arquivar',
      onClick: handleArchive,
      variant: 'danger' as const,
    },
  ]

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={cn(
          'p-1.5 rounded-full transition-colors',
          'hover:bg-background-light',
          'focus:outline-none focus:ring-2 focus:ring-mario-blue/20',
          isOpen && 'bg-background-light'
        )}
        aria-label={`Opções para ${habitName}`}
      >
        <MoreVertical size={18} className="text-text-secondary" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 min-w-[160px] py-1 bg-white rounded-lg shadow-lg border border-border"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-medium text-text-secondary truncate max-w-[100px]">
                  {habitName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-background-light rounded"
                >
                  <X size={14} className="text-text-secondary" />
                </button>
              </div>

              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    item.onClick()
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                    'hover:bg-background-light',
                    item.variant === 'danger' && 'text-mario-red hover:bg-mario-red/5'
                  )}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
