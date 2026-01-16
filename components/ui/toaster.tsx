'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'var(--font-inter)',
        },
        classNames: {
          toast: 'rounded-xl shadow-lg border',
          title: 'font-semibold',
          description: 'text-sm',
          success: 'bg-mario-green text-white border-mario-green',
          error: 'bg-mario-red text-white border-mario-red',
          warning: 'bg-mario-yellow text-black border-mario-yellow',
          info: 'bg-mario-blue text-white border-mario-blue',
        },
      }}
    />
  )
}
