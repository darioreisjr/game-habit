'use client'

import { Battery, Heart, Play, Sparkles, Star, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { PetType, UserPet } from '@/types/database.types'

export function PetsView() {
  const [pets, setPets] = useState<UserPet[]>([])
  const [activePet, setActivePet] = useState<UserPet | null>(null)
  const [availablePets, setAvailablePets] = useState<PetType[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'my-pets' | 'adopt'>('my-pets')

  const loadUserPets = async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_pets')
        .select(`
          *,
          pet_type:pet_type_id (*)
        `)
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })

      if (error) throw error
      setPets(data || [])
      const active = data?.find((p: UserPet) => p.is_active)
      if (active) setActivePet(active)
    } catch (error) {
      console.error('Error loading pets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadAllData() {
      const supabase = createClient()
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const [petsResult, petTypesResult] = await Promise.all([
          supabase
            .from('user_pets')
            .select(`*, pet_type:pet_type_id (*)`)
            .eq('user_id', user.id)
            .order('is_active', { ascending: false }),
          supabase.from('pet_types').select('*').order('rarity', { ascending: true }),
        ])

        if (petsResult.data) {
          setPets(petsResult.data)
          const active = petsResult.data.find((p: UserPet) => p.is_active)
          if (active) setActivePet(active)
        }
        if (petTypesResult.data) setAvailablePets(petTypesResult.data)
      } catch (error) {
        console.error('Error loading pets data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [])

  async function interactWithPet(interaction: string) {
    if (!activePet) return
    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc('interact_with_pet', {
        target_pet_id: activePet.id,
        interaction: interaction,
      })

      if (error) throw error
      if (data?.success) {
        toast.success(`${interaction} realizado com sucesso!`)
        loadUserPets()
      } else {
        toast.error(data?.message || 'Erro na interacao')
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(`Erro: ${err.message}`)
    }
  }

  async function adoptPet(petTypeId: string) {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const petType = availablePets.find((p) => p.id === petTypeId)
      if (!petType) return

      const { data: stats } = await supabase
        .from('stats')
        .select('coins')
        .eq('user_id', user.id)
        .single()

      if (stats && stats.coins < petType.price) {
        toast.warning('Moedas insuficientes!')
        return
      }

      const { error: insertError } = await supabase.from('user_pets').insert({
        user_id: user.id,
        pet_type_id: petTypeId,
        is_active: pets.length === 0,
      })

      if (insertError) throw insertError

      if (petType.price > 0) {
        await supabase
          .from('stats')
          .update({ coins: stats!.coins - petType.price })
          .eq('user_id', user.id)
      }

      toast.success('Pet adotado com sucesso!')
      loadUserPets()
      setTab('my-pets')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(`Erro ao adotar pet: ${err.message}`)
    }
  }

  function getStatColor(value: number) {
    if (value >= 70) return 'bg-green-500'
    if (value >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const CardSkeleton = () => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center justify-center md:justify-start gap-3">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
            Meus Pets
          </h1>
          <p className="text-text-secondary mt-1">Cuide do seu companheiro virtual!</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <button
            onClick={() => setTab('my-pets')}
            className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition-all ${
              tab === 'my-pets'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Meus Pets ({pets.length})
          </button>
          <button
            onClick={() => setTab('adopt')}
            className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition-all ${
              tab === 'adopt'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Adotar Pet
          </button>
        </div>

        {tab === 'my-pets' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : activePet ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-5xl mb-4 shadow-lg">
                    {(activePet as UserPet & { pet_type?: PetType }).pet_type?.emoji || '🦎'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {activePet.nickname ||
                      (activePet as UserPet & { pet_type?: PetType }).pet_type?.name}
                  </h2>
                  <p className="text-gray-600">Nivel {activePet.level}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden max-w-xs mx-auto">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all"
                      style={{ width: `${(activePet.xp / (activePet.level * 100)) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activePet.xp} / {activePet.level * 100} XP
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 font-semibold text-gray-700">
                        <Heart className="w-5 h-5 text-red-500" />
                        Felicidade
                      </span>
                      <span className="font-bold">{activePet.happiness}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStatColor(activePet.happiness)}`}
                        style={{ width: `${activePet.happiness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 font-semibold text-gray-700">
                        <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                        Fome
                      </span>
                      <span className="font-bold">{activePet.hunger}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStatColor(activePet.hunger)}`}
                        style={{ width: `${activePet.hunger}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 font-semibold text-gray-700">
                        <Battery className="w-5 h-5 text-green-500" />
                        Energia
                      </span>
                      <span className="font-bold">{activePet.energy}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStatColor(activePet.energy)}`}
                        style={{ width: `${activePet.energy}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => interactWithPet('feed')}
                    className="p-4 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all font-semibold"
                  >
                    <UtensilsCrossed className="w-6 h-6 mx-auto mb-2" />
                    Alimentar
                  </button>
                  <button
                    onClick={() => interactWithPet('play')}
                    className="p-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-semibold"
                  >
                    <Play className="w-6 h-6 mx-auto mb-2" />
                    Brincar
                  </button>
                  <button
                    onClick={() => interactWithPet('pet')}
                    className="p-4 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-all font-semibold"
                  >
                    <Heart className="w-6 h-6 mx-auto mb-2" />
                    Carinho
                  </button>
                  <button
                    onClick={() => interactWithPet('sleep')}
                    className="p-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all font-semibold"
                  >
                    <Battery className="w-6 h-6 mx-auto mb-2" />
                    Dormir
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-4">Voce ainda nao tem pets</p>
                <button
                  onClick={() => setTab('adopt')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Adotar um Pet
                </button>
              </div>
            )}

            {pets.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Todos os Pets</h3>
                <div className="space-y-3">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        pet.is_active
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                          {(pet as UserPet & { pet_type?: PetType }).pet_type?.emoji || '🦎'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {pet.nickname ||
                              (pet as UserPet & { pet_type?: PetType }).pet_type?.name ||
                              'Pet'}
                          </h4>
                          <p className="text-sm text-gray-600">Nivel {pet.level}</p>
                        </div>
                        {pet.is_active && <Star className="w-5 h-5 text-yellow-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'adopt' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {loading ? (
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : availablePets.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhum pet disponivel para adocao</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePets.map((petType) => (
                  <div
                    key={petType.id}
                    className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-4xl mb-3 shadow-lg">
                        {petType.emoji || '🦎'}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{petType.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{petType.description}</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          petType.rarity === 'legendary'
                            ? 'bg-yellow-100 text-yellow-800'
                            : petType.rarity === 'epic'
                              ? 'bg-purple-100 text-purple-800'
                              : petType.rarity === 'rare'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {petType.rarity === 'legendary' && 'Lendario'}
                        {petType.rarity === 'epic' && 'Epico'}
                        {petType.rarity === 'rare' && 'Raro'}
                        {petType.rarity === 'common' && 'Comum'}
                      </span>
                    </div>

                    <button
                      onClick={() => adoptPet(petType.id)}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg"
                    >
                      {petType.price === 0 ? 'Adotar Gratis' : `${petType.price} moedas`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
