'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HabitSkeletonProps {
  count?: number
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border/50', className)} />
}

function SingleHabitSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <SkeletonPulse className="h-6 w-48 mb-3" />
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonPulse className="h-5 w-20" />
            <SkeletonPulse className="h-5 w-16" />
            <SkeletonPulse className="h-5 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <SkeletonPulse className="h-9 w-9 rounded-md" />
          <SkeletonPulse className="h-9 w-9 rounded-md" />
          <SkeletonPulse className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </Card>
  )
}

export function HabitSkeleton({ count = 3 }: HabitSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <SingleHabitSkeleton key={index} />
      ))}
    </div>
  )
}

export function FilterBarSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2 items-center">
        <SkeletonPulse className="h-5 w-5 rounded" />
        <SkeletonPulse className="h-8 w-16 rounded-lg" />
        <SkeletonPulse className="h-8 w-24 rounded-lg" />
        <SkeletonPulse className="h-8 w-20 rounded-lg" />
        <SkeletonPulse className="h-8 w-28 rounded-lg" />
        <div className="ml-auto">
          <SkeletonPulse className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </Card>
  )
}

export function HabitsPageSkeleton() {
  return (
    <div className="space-y-6">
      <FilterBarSkeleton />
      <HabitSkeleton count={5} />
    </div>
  )
}
