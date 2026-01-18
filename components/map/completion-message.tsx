'use client'

import { EmptyState } from '@/components/map/empty-state'

interface CompletionMessageProps {
  isVisible: boolean
}

export function CompletionMessage({ isVisible }: CompletionMessageProps) {
  if (!isVisible) return null

  return <EmptyState variant="all-completed" />
}
