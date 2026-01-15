import { MapView } from '@/components/map/map-view'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user stats
  const { data: stats } = await supabase.from('stats').select('*').eq('user_id', user.id).single()

  // Fetch user profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Fetch today's habits
  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()

  const { data: allHabits } = await supabase
    .from('habits')
    .select('*, area:areas(*)')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at')

  // Filter habits for today
  const todayHabits = allHabits?.filter((habit) => {
    if (habit.frequency.type === 'daily') return true
    if (habit.frequency.type === 'custom' && habit.frequency.days) {
      return habit.frequency.days.includes(dayOfWeek)
    }
    return false
  })

  // Fetch today's check-ins
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)

  const displayName =
    profile?.name ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0
      ? user.user_metadata.name
      : user.email || 'Usuario')

  return (
    <MapView
      stats={
        stats || {
          user_id: user.id,
          level: 1,
          xp: 0,
          coins: 0,
          updated_at: new Date().toISOString(),
        }
      }
      profile={{
        id: user.id,
        name: displayName,
        created_at: profile?.created_at || new Date().toISOString(),
      }}
      habits={todayHabits || []}
      checkins={checkins || []}
    />
  )
}
