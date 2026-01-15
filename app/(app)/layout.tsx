import { redirect } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <main className="pb-20 md:pb-0">{children}</main>
      <Navigation />
    </div>
  )
}
