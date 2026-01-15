'use client'

import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AreaForm } from '@/components/areas/area-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Area } from '@/types/database.types'

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [habitCounts, setHabitCounts] = useState<Record<string, number>>({})
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadData = async () => {
    const supabase = createClient()

    // Carregar áreas
    const { data: areasData } = await supabase.from('areas').select('*').order('order_index')

    if (areasData) {
      setAreas(areasData)

      // Contar hábitos por área
      const counts: Record<string, number> = {}
      for (const area of areasData) {
        const { count } = await supabase
          .from('habits')
          .select('*', { count: 'exact', head: true })
          .eq('area_id', area.id)
          .eq('is_archived', false)

        counts[area.id] = count || 0
      }
      setHabitCounts(counts)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (areaId: string) => {
    const habitCount = habitCounts[areaId] || 0

    if (habitCount > 0) {
      alert(
        `Esta área possui ${habitCount} hábito(s) vinculado(s). Por favor, remova ou mova os hábitos antes de excluir a área.`
      )
      return
    }

    if (!confirm('Tem certeza que deseja excluir esta área? Esta ação não pode ser desfeita.')) {
      return
    }

    const supabase = createClient()
    await supabase.from('areas').delete().eq('id', areaId)

    loadData()
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingArea(null)
    loadData()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Áreas</h1>
          <p className="text-text-secondary mt-2">Organize seus hábitos em áreas da sua vida</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={20} />
          Nova área
        </Button>
      </div>

      {/* Area Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-2xl font-display font-semibold mb-6">
            {editingArea ? 'Editar Área' : 'Nova Área'}
          </h2>
          <AreaForm
            area={editingArea || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingArea(null)
            }}
          />
        </Card>
      )}

      {/* Areas List */}
      <div className="space-y-3">
        {areas.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary mb-4">
              Você ainda não tem áreas. Crie sua primeira área para organizar seus hábitos!
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus size={20} />
              Criar primeira área
            </Button>
          </Card>
        ) : (
          areas.map((area) => (
            <Card key={area.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {/* Icon and Color */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${area.color}20` }}
                >
                  {area.icon}
                </div>

                {/* Area Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{area.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${area.color}20`,
                        color: area.color,
                      }}
                    >
                      {habitCounts[area.id] || 0} hábito(s)
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingArea(area)
                      setShowForm(true)
                    }}
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(area.id)}
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

      {/* Info Card */}
      {areas.length > 0 && (
        <Card className="p-4 bg-background-light">
          <p className="text-sm text-text-secondary">
            💡 <strong>Dica:</strong> As áreas ajudam você a organizar seus hábitos por temas como
            Saúde, Estudos, Trabalho, etc. Você não pode excluir uma área que possui hábitos
            vinculados.
          </p>
        </Card>
      )}
    </div>
  )
}
