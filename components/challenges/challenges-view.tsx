'use client'

import { ChallengesList } from './challenges-list'

export function ChallengesView() {
  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Desafios Semanais</h1>
          <p className="text-text-secondary mt-1">
            Derrote os chefes completando desafios e ganhe recompensas épicas!
          </p>
        </div>

        <ChallengesList />
      </div>
    </div>
  )
}
