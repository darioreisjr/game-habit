'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Dumbbell, BookOpen, Briefcase, Wallet, Users } from 'lucide-react';

const SUGGESTED_AREAS = [
  { name: 'Saude', icon: 'Dumbbell', color: '#23C55E' },
  { name: 'Estudos', icon: 'BookOpen', color: '#1E5BD8' },
  { name: 'Carreira', icon: 'Briefcase', color: '#E52521' },
  { name: 'Casa', icon: 'Home', color: '#F7C600' },
  { name: 'Financas', icon: 'Wallet', color: '#10B981' },
  { name: 'Social', icon: 'Users', color: '#8B5CF6' },
];

const SUGGESTED_HABITS = {
  Saude: [
    { name: 'Beber 2L de agua', difficulty: 'easy' as const },
    { name: 'Exercicio 30min', difficulty: 'medium' as const },
    { name: 'Dormir 8h', difficulty: 'medium' as const },
  ],
  Estudos: [
    { name: 'Ler 20 paginas', difficulty: 'easy' as const },
    { name: 'Estudar 1h', difficulty: 'medium' as const },
    { name: 'Praticar ingles', difficulty: 'easy' as const },
  ],
  Casa: [
    { name: 'Arrumar a cama', difficulty: 'easy' as const },
    { name: 'Lavar louca', difficulty: 'easy' as const },
    { name: 'Organizar 15min', difficulty: 'easy' as const },
  ],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Saude', 'Estudos', 'Casa']);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleHabit = (habit: string) => {
    setSelectedHabits(prev =>
      prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Criar areas
    const areasToCreate = SUGGESTED_AREAS
      .filter(area => selectedAreas.includes(area.name))
      .map((area, index) => ({
        user_id: user.id,
        name: area.name,
        color: area.color,
        icon: area.icon,
        order_index: index,
      }));

    const { data: createdAreas } = await supabase
      .from('areas')
      .insert(areasToCreate)
      .select();

    if (createdAreas) {
      // Criar habitos
      const habitsToCreate = selectedHabits.map(habitName => {
        const areaName = Object.keys(SUGGESTED_HABITS).find(area =>
          SUGGESTED_HABITS[area as keyof typeof SUGGESTED_HABITS].some(h => h.name === habitName)
        );
        const habitData = areaName
          ? SUGGESTED_HABITS[areaName as keyof typeof SUGGESTED_HABITS].find(h => h.name === habitName)
          : null;

        const area = createdAreas.find(a => a.name === areaName);

        return {
          user_id: user.id,
          area_id: area?.id,
          name: habitName,
          type: 'boolean',
          difficulty: habitData?.difficulty || 'easy',
          frequency: { type: 'daily' },
        };
      });

      await supabase.from('habits').insert(habitsToCreate);
    }

    router.push('/');
    router.refresh();
  };

  const getAvailableHabits = () => {
    return selectedAreas.flatMap(area => {
      const areaHabits = SUGGESTED_HABITS[area as keyof typeof SUGGESTED_HABITS];
      return areaHabits || [];
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mario-red/10 to-mario-blue/10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-display">Bem-vindo ao Game Habit!</CardTitle>
          <CardDescription>
            {step === 1 && 'Escolha as areas que voce quer trabalhar'}
            {step === 2 && 'Escolha alguns habitos para comecar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUGGESTED_AREAS.map(area => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => toggleArea(area.name)}
                    className={`p-4 rounded-xl border-2 transition-all duration-quick ${
                      selectedAreas.includes(area.name)
                        ? 'border-mario-red bg-mario-red/5'
                        : 'border-border hover:border-mario-red/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: area.color + '20' }}
                      >
                        <span className="text-2xl">
                          {area.icon === 'Dumbbell' && '💪'}
                          {area.icon === 'BookOpen' && '📚'}
                          {area.icon === 'Briefcase' && '💼'}
                          {area.icon === 'Home' && '🏠'}
                          {area.icon === 'Wallet' && '💰'}
                          {area.icon === 'Users' && '👥'}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{area.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedAreas.length === 0}
                >
                  Proximo
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {getAvailableHabits().map((habit, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleHabit(habit.name)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-quick text-left ${
                      selectedHabits.includes(habit.name)
                        ? 'border-mario-red bg-mario-red/5'
                        : 'border-border hover:border-mario-red/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{habit.name}</span>
                      <Badge
                        variant={
                          habit.difficulty === 'easy'
                            ? 'success'
                            : habit.difficulty === 'medium'
                            ? 'blue'
                            : 'warning'
                        }
                      >
                        {habit.difficulty === 'easy' && 'Facil'}
                        {habit.difficulty === 'medium' && 'Medio'}
                        {habit.difficulty === 'hard' && 'Dificil'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? 'Criando...' : 'Comecar jornada!'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
