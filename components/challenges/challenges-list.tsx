'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Challenge, UserChallenge } from '@/types/database.types'
import { ChallengeCard } from './challenge-card'

export function ChallengesList() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  async function loadChallenges() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('difficulty', { ascending: true })

      if (challengesError) throw challengesError

      // Load user's progress on challenges
      const { data: userChallengesData, error: userChallengesError } = await supabase
        .from('user_challenges')
        .select('*, challenge:challenges(*)')
        .eq('user_id', user.id)

      if (userChallengesError) throw userChallengesError

      setChallenges(challengesData || [])
      setUserChallenges(userChallengesData || [])

      // Auto-enroll user in new challenges
      if (challengesData) {
        for (const challenge of challengesData) {
          const alreadyEnrolled = userChallengesData?.some((uc) => uc.challenge_id === challenge.id)

          if (!alreadyEnrolled) {
            // Get the goal from challenge requirements
            const { data: requirements } = await supabase
              .from('challenge_requirements')
              .select('count_required')
              .eq('challenge_id', challenge.id)
              .single()

            await supabase.from('user_challenges').insert({
              user_id: user.id,
              challenge_id: challenge.id,
              goal: requirements?.count_required || 20,
              progress: 0,
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Nenhum desafio ativo</h3>
        <p className="text-gray-600">Novos desafios semanais aparecem em breve!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {challenges.map((challenge) => {
        const userChallenge = userChallenges.find((uc) => uc.challenge_id === challenge.id)

        return (
          <ChallengeCard key={challenge.id} challenge={challenge} userChallenge={userChallenge} />
        )
      })}
    </div>
  )
}
