'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { Area, Habit, HabitDifficulty } from '@/types/database.types'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface HabitFormProps {
  habit?: Habit
  onSuccess: () => void
  onCancel: () => void
}

export function HabitForm({ habit, onSuccess, onCancel }: HabitFormProps) {
  const [name, setName] = useState(habit?.name || '')
  const [areaId, setAreaId] = useState(habit?.area_id || '')
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(habit?.difficulty || 'medium')
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'custom'>(
    habit?.frequency?.type || 'daily'
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(habit?.frequency?.days || [])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)

  const loadAreas = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('areas').select('*').order('order_index')

    if (data) setAreas(data)
  }

  useEffect(() => {
    loadAreas()
  }, [])

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const frequency = {
      type: frequencyType,
      ...(frequencyType === 'custom' && { days: selectedDays }),
    }

    const habitData = {
      user_id: user.id,
      name,
      area_id: areaId || null,
      type: 'boolean',
      difficulty,
      frequency,
    }

    if (habit) {
      await supabase.from('habits').update(habitData).eq('id', habit.id)
    } else {
      await supabase.from('habits').insert(habitData)
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome do hábito</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Beber 2L de água"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Área</label>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="flex h-12 w-full rounded-xl border-2 border-border bg-white px-4 py-2 text-base"
        >
          <option value="">Sem área</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.icon} {area.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Dificuldade</label>
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficulty(diff)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                difficulty === diff
                  ? 'border-mario-red bg-mario-red/5'
                  : 'border-border hover:border-mario-red/50'
              }`}
            >
              <div className="text-sm font-medium">
                {diff === 'easy' && 'Fácil'}
                {diff === 'medium' && 'Médio'}
                {diff === 'hard' && 'Difícil'}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {diff === 'easy' && '+10 XP'}
                {diff === 'medium' && '+20 XP'}
                {diff === 'hard' && '+30 XP'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Frequência</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFrequencyType('daily')}
            className={`flex-1 p-3 rounded-xl border-2 transition-all ${
              frequencyType === 'daily' ? 'border-mario-red bg-mario-red/5' : 'border-border'
            }`}
          >
            Diário
          </button>
          <button
            type="button"
            onClick={() => setFrequencyType('custom')}
            className={`flex-1 p-3 rounded-xl border-2 transition-all ${
              frequencyType === 'custom' ? 'border-mario-red bg-mario-red/5' : 'border-border'
            }`}
          >
            Personalizado
          </button>
        </div>

        {frequencyType === 'custom' && (
          <div className="flex gap-1 pt-2">
            {DAYS.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className={`flex-1 p-2 rounded-lg border-2 text-sm transition-all ${
                  selectedDays.includes(index)
                    ? 'border-mario-blue bg-mario-blue text-white'
                    : 'border-border'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : habit ? 'Atualizar' : 'Criar hábito'}
        </Button>
      </div>
    </form>
  )
}
