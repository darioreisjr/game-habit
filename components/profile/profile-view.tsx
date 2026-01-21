'use client'

import { Check, LogOut, Target, Trophy, User, UserPlus, Users, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatsDisplay } from '@/components/ui/stats-display'
import { createClient } from '@/lib/supabase/client'
import type { Profile, PublicProfile, Stats } from '@/types/database.types'

interface PendingRequest {
  id: string
  requester_id: string
  requester_profile?: {
    username: string
    display_name: string
    avatar_url: string | null
    level: number
  }
}

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
    <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
    <div className="h-8 w-48 bg-gray-200 rounded" />
  </div>
)

export function ProfileView() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [totalHabits, setTotalHabits] = useState(0)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const loadPendingRequests = useCallback(async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: requests, error } = await supabase
        .from('friendships')
        .select('id, requester_id')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .limit(5)

      if (error) throw error
      if (!requests || requests.length === 0) {
        setPendingRequests([])
        return
      }

      const requesterIds = requests.map((r) => r.requester_id)
      const [profilesResult, statsResult] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', requesterIds),
        supabase.from('stats').select('user_id, level').in('user_id', requesterIds),
      ])

      const enrichedRequests = requests.map((request) => {
        const profileData = profilesResult.data?.find((p) => p.user_id === request.requester_id)
        const stat = statsResult.data?.find((s) => s.user_id === request.requester_id)
        return {
          ...request,
          requester_profile: profileData
            ? {
                username: profileData.username,
                display_name: profileData.display_name,
                avatar_url: profileData.avatar_url,
                level: stat?.level || 1,
              }
            : undefined,
        }
      })

      setPendingRequests(enrichedRequests)
    } catch (error) {
      console.error('Error loading pending requests:', error)
    }
  }, [])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const [profileResult, publicProfileResult, statsResult, checkinsResult, habitsResult] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('public_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('stats').select('*').eq('user_id', user.id).single(),
        supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('habits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_archived', false),
      ])

    if (profileResult.data) {
      setProfile(profileResult.data)
      setName(profileResult.data.name)
    }

    if (publicProfileResult.data) {
      setPublicProfile(publicProfileResult.data)
    }

    if (statsResult.data) setStats(statsResult.data)
    setTotalCheckins(checkinsResult.count || 0)
    setTotalHabits(habitsResult.count || 0)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    loadPendingRequests()
  }, [loadData, loadPendingRequests])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('profiles').update({ name }).eq('id', user.id)

      toast.success('Perfil atualizado com sucesso!')
      loadData()
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function respondToRequest(requestId: string, accept: boolean) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      toast.success(accept ? 'Amizade aceita!' : 'Solicitacao recusada')

      startTransition(() => {
        loadPendingRequests()
      })
    } catch (error) {
      console.error('Error responding to request:', error)
      toast.error('Erro ao responder solicitacao')
    }
  }

  if (isLoading) {
    return (
      <div className="md:ml-64">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center justify-center md:justify-start gap-3">
              <User className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
              Perfil
            </h1>
            <p className="text-text-secondary mt-1">Gerencie suas informacoes e progresso</p>
          </div>
          <CardSkeleton />
          <CardSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (!profile || !stats) {
    return (
      <div className="md:ml-64">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center justify-center md:justify-start gap-3">
            <User className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
            Perfil
          </h1>
          <p className="text-text-secondary mt-1">Gerencie suas informacoes e progresso</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <StatsDisplay level={stats.level} xp={stats.xp} coins={stats.coins} variant="full" />
          </CardContent>
        </Card>

        {publicProfile?.friend_code && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Seu Codigo de Amigo
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Compartilhe para que outros possam te adicionar
                  </p>
                </div>
                <div className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                  {publicProfile.friend_code}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingRequests.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <UserPlus size={24} />
                Solicitacoes de Amizade
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-sm rounded-full">
                  {pendingRequests.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                      {request.requester_profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {request.requester_profile?.display_name || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-600">
                        @{request.requester_profile?.username || 'desconhecido'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToRequest(request.id, true)}
                      disabled={isPending}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      title="Aceitar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respondToRequest(request.id, false)}
                      disabled={isPending}
                      className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                      title="Recusar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Link
                href="/friends"
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
              >
                Ver todas as solicitacoes →
              </Link>
            </CardContent>
          </Card>
        )}

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
              <p className="text-sm text-text-secondary">Habitos ativos</p>
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
              <p className="text-sm text-text-secondary">Nivel atual</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={24} />
              Informacoes do Perfil
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
                {loading ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-mario-red/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold mb-1">Sair da conta</h3>
                <p className="text-sm text-text-secondary">
                  Desconectar e voltar para a tela de login
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2 text-mario-red border-mario-red hover:bg-mario-red/10"
              >
                <LogOut size={18} />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
