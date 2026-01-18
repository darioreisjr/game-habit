'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isLoading, onCancel])

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
      if (e.target === e.currentTarget && !isLoading) {
        onCancel()
      }
    },
    [isLoading, onCancel]
  )

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-mario-red',
          button: 'bg-mario-red hover:bg-mario-red/90',
        }
      case 'warning':
        return {
          icon: 'text-mario-yellow',
          button: 'bg-mario-yellow hover:bg-mario-yellow/90 text-black',
        }
      default:
        return {
          icon: 'text-mario-blue',
          button: 'bg-mario-blue hover:bg-mario-blue/90',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={handleOverlayClick}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md"
          >
            <Card className="p-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full bg-background-light flex items-center justify-center ${styles.icon}`}
                >
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 id="confirm-dialog-title" className="text-lg font-semibold mb-2">
                    {title}
                  </h3>
                  <p id="confirm-dialog-description" className="text-text-secondary text-sm">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  {cancelLabel}
                </Button>
                <Button onClick={onConfirm} disabled={isLoading} className={styles.button}>
                  {isLoading ? 'Aguarde...' : confirmLabel}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
