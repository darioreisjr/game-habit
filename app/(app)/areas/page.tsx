import { AreasView } from '@/components/areas/areas-view'
import { createClient } from '@/lib/supabase/server'

export default async function AreasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch all data in parallel for better performance
  const [{ data: areas }, { data: habits }] = await Promise.all([
    supabase.from('areas').select('*').eq('user_id', user.id).order('order_index'),
    supabase.from('habits').select('area_id').eq('user_id', user.id).eq('is_archived', false),
  ])

  // Calculate habit counts per area
  const habitCounts: Record<string, number> = {}
  if (habits) {
    for (const habit of habits) {
      if (habit.area_id) {
        habitCounts[habit.area_id] = (habitCounts[habit.area_id] || 0) + 1
      }
    }
  }

  return <AreasView initialAreas={areas || []} initialHabitCounts={habitCounts} />
}
