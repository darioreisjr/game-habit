'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, ShopItem, Stats } from '@/types/database.types'
import { ShopItemCard } from './shop-item-card'

type ShopCategory = 'all' | 'powerup' | 'theme' | 'boost' | 'cosmetic'

export function ShopList() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('all')

  const loadShopData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Otimização: Promise.all para queries paralelas (antes eram sequenciais)
      const [itemsResult, statsResult, inventoryResult] = await Promise.all([
        supabase
          .from('shop_items')
          .select('*')
          .eq('is_available', true)
          .order('category')
          .order('price'),
        supabase.from('stats').select('*').eq('user_id', user.id).single(),
        supabase.from('inventory').select('*').eq('user_id', user.id),
      ])

      if (itemsResult.error) throw itemsResult.error
      if (statsResult.error) throw statsResult.error

      setItems(itemsResult.data || [])
      setStats(statsResult.data)
      setInventory(inventoryResult.data || [])
    } catch (error) {
      console.error('Error loading shop data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShopData()
  }, [])

  // Otimização: useMemo para evitar recálculo a cada render
  const filteredItems = useMemo(
    () =>
      selectedCategory === 'all'
        ? items
        : items.filter((item) => item.category === selectedCategory),
    [items, selectedCategory]
  )

  // Otimização: Set para lookup O(1) ao invés de .some() O(n)
  const ownedItemKeys = useMemo(() => new Set(inventory.map((inv) => inv.item_key)), [inventory])

  const categories: { value: ShopCategory; label: string; emoji: string }[] = [
    { value: 'all', label: 'Todos', emoji: '🎮' },
    { value: 'powerup', label: 'Power-ups', emoji: '⭐' },
    { value: 'boost', label: 'Boosts', emoji: '🚀' },
    { value: 'theme', label: 'Temas', emoji: '🎨' },
    { value: 'cosmetic', label: 'Cosméticos', emoji: '✨' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Coins Display */}
      <div className="bg-linear-to-r from-mario-yellow to-yellow-400 rounded-2xl p-6 text-center">
        <div className="text-6xl mb-2">💰</div>
        <div className="text-4xl font-bold text-gray-900">{stats?.coins || 0}</div>
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
              isOwned={ownedItemKeys.has(item.item_key)}
              onPurchase={loadShopData}
            />
          ))}
        </div>
      )}
    </div>
  )
}
