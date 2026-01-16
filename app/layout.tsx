import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Inter, Press_Start_2P, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

// Fontes otimizadas com next/font (preload automático, sem render blocking)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-press-start',
})

export const metadata: Metadata = {
  title: 'Game Habit - Transforme hábitos em aventura',
  description: 'App de gerenciamento de hábitos gamificado com tema Mario',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} ${pressStart2P.variable}`}
    >
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
