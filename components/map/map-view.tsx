'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsDisplay } from '@/components/ui/stats-display';
import { Badge } from '@/components/ui/badge';
import { Flag, Check, Plus } from 'lucide-react';
import type { Stats, Profile, Habit, Checkin } from '@/types/database.types';
import { getXPForDifficulty } from '@/lib/utils';

interface MapViewProps {
  stats: Stats;
  profile: Profile;
  habits: Habit[];
  checkins: Checkin[];
}

export function MapView({ stats, profile, habits, checkins }: MapViewProps) {
  const router = useRouter();
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);
  const [localCheckins, setLocalCheckins] = useState(checkins);

  useEffect(() => {
    setLocalCheckins(checkins);
  }, [checkins]);

  const completedHabitIds = new Set(localCheckins.map((c) => c.habit_id));
  const completedCount = completedHabitIds.size;
  const totalCount = habits.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleCompleteHabit = async (habitId: string, difficulty: string) => {
    setCompletingHabit(habitId);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const today = new Date().toISOString().split('T')[0];

    if (!user) {
      alert('Sessao expirada. Faça login novamente.');
      setCompletingHabit(null);
      return;
    }

    const optimisticCheckin = {
      id: crypto.randomUUID(),
      habit_id: habitId,
      user_id: user.id,
      date: today,
      created_at: new Date().toISOString(),
    };

    setLocalCheckins((prev) => {
      if (prev.some((c) => c.habit_id === habitId && c.date === today)) {
        return prev;
      }
      return [...prev, optimisticCheckin];
    });

    const { error } = await supabase.from('checkins').insert({
      habit_id: habitId,
      user_id: user.id,
      date: today,
    });

    if (error && error.code !== '23505') {
      console.error('Erro ao salvar checkin:', error);
      alert(`Nao foi possivel salvar o checkin: ${error.message}`);
      setLocalCheckins((prev) =>
        prev.filter((c) => !(c.habit_id === habitId && c.date === today))
      );
    }

    setCompletingHabit(null);
    router.refresh();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            {getGreeting()}, {profile.name}!
          </h1>
          <p className="text-text-secondary mt-1">Mundo 1-1: Hoje</p>
        </div>

        <StatsDisplay
          level={stats.level}
          xp={stats.xp}
          coins={stats.coins}
          variant="compact"
        />
      </div>

      {/* Progress Banner */}
      <Card className="bg-gradient-to-r from-mario-red/10 to-mario-blue/10 border-mario-red/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-semibold text-lg">Missão do Dia</h3>
              <p className="text-sm text-text-secondary">
                {completedCount} de {totalCount} fases concluídas
              </p>
            </div>
            <div className="text-4xl">
              {progress === 100 ? <Flag className="text-mario-yellow" size={40} /> : '🎯'}
            </div>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-mario-red to-mario-blue transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Habits List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold">Fases de Hoje</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/habits?new=1')}
            className="gap-2"
          >
            <Plus size={16} />
            Novo
          </Button>
        </div>

        {habits.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary mb-4">
              Você ainda não tem hábitos configurados.
            </p>
            <Button onClick={() => router.push('/habits?new=1')}>Criar primeiro hábito</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const isCompleted = completedHabitIds.has(habit.id);
              const isLoading = completingHabit === habit.id;

              return (
                <Card
                  key={habit.id}
                  className={`transition-all duration-quick ${
                    isCompleted ? 'bg-mario-green/5 border-mario-green/30' : ''
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <button
                      onClick={() => !isCompleted && handleCompleteHabit(habit.id, habit.difficulty)}
                      disabled={isCompleted || isLoading}
                      className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-mario-green border-mario-green text-white'
                          : 'border-border hover:border-mario-red hover:scale-110'
                      }`}
                    >
                      {isCompleted ? <Check size={24} /> : <div className="w-6 h-6 rounded-full bg-background-light" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-medium truncate ${
                            isCompleted ? 'line-through text-text-secondary' : ''
                          }`}
                        >
                          {habit.name}
                        </h3>
                        {isCompleted && <Badge variant="success">Completo!</Badge>}
                      </div>
                      {habit.area && (
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <span>{habit.area.icon}</span>
                          <span>{habit.area.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          habit.difficulty === 'easy'
                            ? 'success'
                            : habit.difficulty === 'medium'
                            ? 'blue'
                            : 'warning'
                        }
                      >
                        +{getXPForDifficulty(habit.difficulty)} XP
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {progress === 100 && habits.length > 0 && (
        <Card className="bg-gradient-to-r from-mario-yellow/20 to-mario-green/20 border-mario-green">
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-display font-bold mb-2">Parabéns!</h3>
            <p className="text-text-secondary">
              Você completou todas as fases de hoje! Continue assim!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
