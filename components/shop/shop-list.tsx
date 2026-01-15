'use client';

import { useEffect, useState } from 'react';
import { ShopItem, Stats } from '@/types/database.types';
import { ShopItemCard } from './shop-item-card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

type ShopCategory = 'all' | 'powerup' | 'theme' | 'boost' | 'cosmetic';

export function ShopList() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('all');

  useEffect(() => {
    loadShopData();
  }, []);

  async function loadShopData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load shop items
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('price');

      if (itemsError) throw itemsError;

      // Load user stats
      const { data: statsData, error: statsError } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) throw statsError;

      setItems(itemsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  const categories: { value: ShopCategory; label: string; emoji: string }[] = [
    { value: 'all', label: 'Todos', emoji: '🎮' },
    { value: 'powerup', label: 'Power-ups', emoji: '⭐' },
    { value: 'boost', label: 'Boosts', emoji: '🚀' },
    { value: 'theme', label: 'Temas', emoji: '🎨' },
    { value: 'cosmetic', label: 'Cosméticos', emoji: '✨' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Coins Display */}
      <div className="bg-gradient-to-r from-mario-yellow to-yellow-400 rounded-2xl p-6 text-center">
        <div className="text-6xl mb-2">💰</div>
        <div className="text-4xl font-bold text-gray-900">
          {stats?.coins || 0}
        </div>
        <div className="text-sm text-gray-700 mt-1">Suas moedas</div>
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

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
            Nenhum item nesta categoria
          </h3>
          <p className="text-gray-600">Novos itens em breve!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              userCoins={stats?.coins || 0}
              onPurchase={loadShopData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
