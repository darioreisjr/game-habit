import { notFound } from 'next/navigation'
import { HistoryView } from '@/components/history/history-view'
import { createClient } from '@/lib/supabase/server'

interface HabitHistoryPageProps {
  params: Promise<{ id: string }>
}

export default async function HabitHistoryPage({ params }: HabitHistoryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: habit } = await supabase
    .from('habits')
    .select('*, area:areas(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    notFound()
  }

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return <HistoryView habit={habit} checkins={checkins || []} />
}
