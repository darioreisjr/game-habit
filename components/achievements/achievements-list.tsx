'use client';

import { useEffect, useState } from 'react';
import type { Achievement, UserAchievement } from '@/types/database.types';
import { AchievementCard } from './achievement-card';
import { createClient } from '@/lib/supabase/client';

type AchievementCategory = 'all' | 'streak' | 'level' | 'habits' | 'challenges' | 'special';

export function AchievementsList() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<AchievementCategory>('all');

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  async function loadAchievements() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all achievements
      const { data: achievementsData, error: achievementsError } =
        await supabase
          .from('achievements')
          .select('*')
          .order('rarity')
          .order('xp_reward');

      if (achievementsError) throw achievementsError;

      // Load user's unlocked achievements
      const { data: userAchievementsData, error: userAchievementsError } =
        await supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);

      // Check for new achievements
      await supabase.rpc('check_achievements', { p_user_id: user.id });
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(userAchievementId: string) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('share_achievement', {
        p_user_id: user.id,
        p_user_achievement_id: userAchievementId,
        p_message: 'Olha só o que eu consegui! 🎮',
      });

      if (error) throw error;

      if (data.success) {
        const shareUrl = `${window.location.origin}/share/${data.share_url}`;

        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado! Compartilhe sua conquista com os amigos.');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      alert('Erro ao compartilhar conquista. Tente novamente.');
    }
  }

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const categories: { value: AchievementCategory; label: string; emoji: string }[] = [
    { value: 'all', label: 'Todas', emoji: '🏆' },
    { value: 'streak', label: 'Streaks', emoji: '🔥' },
    { value: 'level', label: 'Níveis', emoji: '⭐' },
    { value: 'habits', label: 'Hábitos', emoji: '✅' },
    { value: 'challenges', label: 'Desafios', emoji: '👹' },
    { value: 'special', label: 'Especiais', emoji: '🌟' },
  ];

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-gradient-to-br from-mario-red to-red-600 rounded-2xl p-8 text-white text-center">
        <div className="text-7xl mb-4">🏆</div>
        <div className="text-5xl font-bold mb-2">
          {unlockedCount} / {totalCount}
        </div>
        <div className="text-xl mb-4">Conquistas Desbloqueadas</div>
        <div className="bg-white/20 rounded-full h-4 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-sm mt-2">{percentage}% completo</div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
              selectedCategory === category.value
                ? 'bg-mario-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="space-y-4">
        {filteredAchievements.map((achievement) => {
          const userAchievement = userAchievements.find(
            (ua) => ua.achievement_id === achievement.id
          );

          return (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              userAchievement={userAchievement}
              onShare={handleShare}
            />
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
            Nenhuma conquista nesta categoria
          </h3>
        </div>
      )}
    </div>
  );
}
