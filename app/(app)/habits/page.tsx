import { HabitsView } from '@/components/habits/habits-view'
import { createClient } from '@/lib/supabase/server'

export default async function HabitsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch all data in parallel for better performance
  const [{ data: habits }, { data: areas }] = await Promise.all([
    supabase
      .from('habits')
      .select('*, area:areas(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('areas').select('*').eq('user_id', user.id).order('order_index'),
  ])

  return <HabitsView initialHabits={habits || []} initialAreas={areas || []} />
}
