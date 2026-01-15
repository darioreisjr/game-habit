import { AchievementsList } from '@/components/achievements/achievements-list'

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Conquistas</h1>
          <p className="text-lg text-gray-600">Desbloqueie conquistas e mostre suas habilidades!</p>
        </div>

        <AchievementsList />
      </div>
    </div>
  )
}
