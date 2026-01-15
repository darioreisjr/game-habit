import { ChallengesList } from '@/components/challenges/challenges-list';

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            Desafios Semanais
          </h1>
          <p className="text-lg text-gray-600">
            Derrote os chefes completando desafios e ganhe recompensas épicas!
          </p>
        </div>

        <ChallengesList />
      </div>
    </div>
  );
}
