'use client';

import type { ShopItem } from '@/types/database.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ShopItemCardProps {
  item: ShopItem;
  userCoins: number;
  onPurchase: () => void;
}

const categoryColors: Record<string, string> = {
  powerup: 'bg-red-100 text-red-700',
  theme: 'bg-purple-100 text-purple-700',
  boost: 'bg-yellow-100 text-yellow-700',
  cosmetic: 'bg-blue-100 text-blue-700',
};

const categoryLabels: Record<string, string> = {
  powerup: 'Power-up',
  theme: 'Tema',
  boost: 'Boost',
  cosmetic: 'Cosmético',
};

export function ShopItemCard({ item, userCoins, onPurchase }: ShopItemCardProps) {
  const [purchasing, setPurchasing] = useState(false);
  const canAfford = userCoins >= item.price;

  async function handlePurchase() {
    if (!canAfford || purchasing) return;

    setPurchasing(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('purchase_item', {
        p_user_id: user.id,
        p_item_key: item.item_key,
        p_quantity: 1,
      });

      if (error) throw error;

      if (data.success) {
        onPurchase();
      } else {
        alert(data.error || 'Erro ao comprar item');
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      alert('Erro ao comprar item. Tente novamente.');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center text-center">
        <div className="text-6xl mb-3">{item.icon}</div>

        <Badge className={`mb-3 ${categoryColors[item.category]}`}>
          {categoryLabels[item.category]}
        </Badge>

        <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
          {item.name}
        </h3>

        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
          {item.description}
        </p>

        {item.effect_type && item.effect_value && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 w-full">
            <div className="text-xs text-gray-500 mb-1">Efeito:</div>
            {item.effect_type === 'xp_boost' && (
              <div className="text-sm font-medium text-gray-700">
                {item.effect_value.multiplier}x XP por{' '}
                {item.effect_value.duration}h
              </div>
            )}
            {item.effect_type === 'coin_boost' && (
              <div className="text-sm font-medium text-gray-700">
                {item.effect_value.multiplier}x Moedas por{' '}
                {item.effect_value.duration}h
              </div>
            )}
            {item.effect_type === 'streak_freeze' && (
              <div className="text-sm font-medium text-gray-700">
                Congela streak por {item.effect_value.duration}h
              </div>
            )}
            {item.effect_type === 'redo_habit' && (
              <div className="text-sm font-medium text-gray-700">
                Refazer hábito perdido
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between w-full pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💰</span>
            <span className="text-2xl font-bold text-mario-yellow">
              {item.price}
            </span>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={!canAfford || purchasing}
            className={`${
              canAfford
                ? 'bg-mario-red hover:bg-red-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {purchasing ? 'Comprando...' : canAfford ? 'Comprar' : 'Sem moedas'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
