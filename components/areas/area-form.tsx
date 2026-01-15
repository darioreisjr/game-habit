'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { Area } from '@/types/database.types'

const COLORS = [
  '#E52521',
  '#1E5BD8',
  '#F7C600',
  '#23C55E',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#10B981',
]

const ICONS = ['💪', '📚', '💼', '🏠', '💰', '👥', '🎮', '🎨', '🍎', '⚡']

interface AreaFormProps {
  area?: Area
  onSuccess: () => void
  onCancel: () => void
}

export function AreaForm({ area, onSuccess, onCancel }: AreaFormProps) {
  const [name, setName] = useState(area?.name || '')
  const [color, setColor] = useState(area?.color || COLORS[0])
  const [icon, setIcon] = useState(area?.icon || ICONS[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    if (area) {
      await supabase.from('areas').update({ name, color, icon }).eq('id', area.id)
    } else {
      const { data: existingAreas } = await supabase
        .from('areas')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrder =
        existingAreas && existingAreas.length > 0 ? existingAreas[0].order_index + 1 : 0

      await supabase.from('areas').insert({
        user_id: user.id,
        name,
        color,
        icon,
        order_index: nextOrder,
      })
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome da área</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Saúde, Estudos, Casa..."
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cor</label>
        <div className="grid grid-cols-8 gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-lg transition-transform ${
                color === c ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ícone</label>
        <div className="grid grid-cols-10 gap-2">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-all ${
                icon === i ? 'border-text-primary scale-110' : 'border-border'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : area ? 'Atualizar' : 'Criar área'}
        </Button>
      </div>
    </form>
  )
}
