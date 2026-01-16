'use client'

import { Archive, Edit2, Filter, Plus, Trash2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HabitForm } from '@/components/habits/habit-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Area, Habit } from '@/types/database.types'

export default function HabitsPage() {
  const searchParams = useSearchParams()
  const [habits, setHabits] = useState<(Habit & { area?: Area })[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadData = async () => {
    const supabase = createClient()

    // Otimização: Promise.all para queries paralelas
    let habitsQuery = supabase
      .from('habits')
      .select('*, area:areas(*)')
      .eq('is_archived', showArchived)
      .order('created_at', { ascending: false })

    if (selectedArea !== 'all') {
      habitsQuery = habitsQuery.eq('area_id', selectedArea)
    }

    const [areasResult, habitsResult] = await Promise.all([
      supabase.from('areas').select('*').order('order_index'),
      habitsQuery,
    ])

    if (areasResult.data) setAreas(areasResult.data)
    if (habitsResult.data) setHabits(habitsResult.data as any)
  }

  useEffect(() => {
    loadData()
  }, [selectedArea, showArchived])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingHabit(null)
      setShowForm(true)
    }
  }, [searchParams])

  const handleArchive = async (habitId: string) => {
    const supabase = createClient()
    await supabase.from('habits').update({ is_archived: true }).eq('id', habitId)

    loadData()
  }

  const handleDelete = async (habitId: string) => {
    if (!confirm('Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita.')) {
      return
    }

    const supabase = createClient()
    await supabase.from('habits').delete().eq('id', habitId)

    loadData()
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingHabit(null)
    loadData()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-bold">Hábitos</h1>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={20} />
          Novo hábito
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={20} className="text-text-secondary" />
          <button
            onClick={() => setSelectedArea('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedArea === 'all'
                ? 'bg-mario-red text-white'
                : 'bg-background-light text-text-secondary hover:bg-border'
            }`}
          >
            Todos
          </button>
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedArea === area.id
                  ? 'bg-mario-red text-white'
                  : 'bg-background-light text-text-secondary hover:bg-border'
              }`}
            >
              {area.icon} {area.name}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-mario-blue text-white'
                  : 'bg-background-light text-text-secondary hover:bg-border'
              }`}
            >
              {showArchived ? 'Ver ativos' : 'Ver arquivados'}
            </button>
          </div>
        </div>
      </Card>

      {/* Habit Form Modal */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-2xl font-display font-semibold mb-6">
            {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
          </h2>
          <HabitForm
            habit={editingHabit || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingHabit(null)
            }}
          />
        </Card>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary mb-4">
              {showArchived
                ? 'Nenhum hábito arquivado.'
                : selectedArea === 'all'
                  ? 'Você ainda não tem hábitos. Crie seu primeiro!'
                  : 'Nenhum hábito nesta área.'}
            </p>
          </Card>
        ) : (
          habits.map((habit) => (
            <Card key={habit.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2">{habit.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {habit.area && (
                      <Badge variant="secondary">
                        {habit.area.icon} {habit.area.name}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        habit.difficulty === 'easy'
                          ? 'success'
                          : habit.difficulty === 'medium'
                            ? 'blue'
                            : 'warning'
                      }
                    >
                      {habit.difficulty === 'easy' && 'Fácil'}
                      {habit.difficulty === 'medium' && 'Médio'}
                      {habit.difficulty === 'hard' && 'Difícil'}
                    </Badge>
                    <Badge variant="secondary">
                      {habit.frequency.type === 'daily' && 'Diário'}
                      {habit.frequency.type === 'custom' &&
                        `${habit.frequency.days?.length} dias/semana`}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingHabit(habit)
                      setShowForm(true)
                    }}
                  >
                    <Edit2 size={18} />
                  </Button>
                  {!showArchived && (
                    <Button size="icon" variant="ghost" onClick={() => handleArchive(habit.id)}>
                      <Archive size={18} />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(habit.id)}
                    className="text-mario-red hover:text-mario-red"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
