'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatsDisplay } from '@/components/ui/stats-display';
import { LogOut, User, Trophy, Target } from 'lucide-react';
import type { Stats, Profile } from '@/types/database.types';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setName(profileData.name);
    }

    const { data: statsData } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsData) setStats(statsData);

    const { count: checkinsCount } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setTotalCheckins(checkinsCount || 0);

    const { count: habitsCount } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_archived', false);

    setTotalHabits(habitsCount || 0);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('profiles').update({ name }).eq('id', user.id);

      alert('Perfil atualizado com sucesso!');
      loadData();
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (!profile || !stats) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 md:ml-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Perfil</h1>
        <p className="text-text-secondary mt-1">Gerencie suas informações e progresso</p>
      </div>

      {/* Stats Overview */}
      <Card>
        <CardContent className="p-6">
          <StatsDisplay
            level={stats.level}
            xp={stats.xp}
            coins={stats.coins}
            variant="full"
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-mario-green/10 flex items-center justify-center">
                <Target className="text-mario-green" size={20} />
              </div>
              <div className="text-2xl font-display font-bold">{totalCheckins}</div>
            </div>
            <p className="text-sm text-text-secondary">Check-ins realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-mario-blue/10 flex items-center justify-center">
                <Trophy className="text-mario-blue" size={20} />
              </div>
              <div className="text-2xl font-display font-bold">{totalHabits}</div>
            </div>
            <p className="text-sm text-text-secondary">Hábitos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-mario-yellow/10 flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-2xl font-display font-bold">{stats.level}</div>
            </div>
            <p className="text-sm text-text-secondary">Nível atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={24} />
            Informações do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-mario-red/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Sair da conta</h3>
              <p className="text-sm text-text-secondary">
                Desconectar e voltar para a tela de login
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2 text-mario-red border-mario-red hover:bg-mario-red/10">
              <LogOut size={18} />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
