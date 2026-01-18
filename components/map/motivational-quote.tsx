'use client'

import { Quote } from 'lucide-react'
import { useMemo } from 'react'
import { MOTIVATIONAL_QUOTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface MotivationalQuoteProps {
  className?: string
}

export function MotivationalQuote({ className }: MotivationalQuoteProps) {
  const quote = useMemo(() => {
    const today = new Date()
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]
  }, [])

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-mario-blue/5 to-mario-green/5 border border-mario-blue/10',
        className
      )}
    >
      <Quote size={18} className="text-mario-blue flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary italic leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs text-text-secondary mt-1">— {quote.author}</p>
      </div>
    </div>
  )
}
