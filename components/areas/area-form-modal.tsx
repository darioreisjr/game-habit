'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Area } from '@/types/database.types'
import { AreaForm } from './area-form'

interface AreaFormModalProps {
  isOpen: boolean
  area?: Area | null
  onClose: () => void
  onSuccess: () => void
}

export function AreaFormModal({ isOpen, area, onClose, onSuccess }: AreaFormModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const handleSuccess = useCallback(() => {
    onSuccess()
    onClose()
  }, [onSuccess, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="area-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg mb-20"
          >
            <Card className="p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 id="area-modal-title" className="text-2xl font-display font-semibold">
                  {area ? 'Editar Área' : 'Nova Área'}
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  aria-label="Fechar modal"
                  className="h-8 w-8"
                >
                  <X size={20} />
                </Button>
              </div>

              <AreaForm area={area || undefined} onSuccess={handleSuccess} onCancel={onClose} />
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
