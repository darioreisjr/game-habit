'use client'

import {
  Check,
  Clock,
  MessageCircle,
  Search,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Friendship } from '@/types/database.types'

interface FriendData {
  friend_id: string
  friend_username: string
  friend_display_name: string
  friend_avatar_url: string | null
  friend_level: number
  friend_xp: number
  friendship_since: string
}

interface SearchResult {
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  level: number
  is_friend: boolean
  friend_code: string
  friendship_status: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
}

interface PendingRequestWithProfile extends Friendship {
  requester_profile?: {
    username: string
    display_name: string
    avatar_url: string | null
    level: number
  }
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendData[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequestWithProfile[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [friendsFilter, setFriendsFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [isPending, startTransition] = useTransition()

  // Filtrar amigos localmente para busca rápida
  const filteredFriends = useMemo(() => {
    if (!friendsFilter.trim()) return friends
    const term = friendsFilter.toLowerCase()
    return friends.filter(
      (friend) =>
        friend.friend_display_name?.toLowerCase().includes(term) ||
        friend.friend_username?.toLowerCase().includes(term)
    )
  }, [friends, friendsFilter])

  // Função otimizada para carregar amigos
  const loadFriends = useCallback(async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Buscar amizades aceitas onde o usuário é requester ou addressee
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, created_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (error) throw error
      if (!friendships || friendships.length === 0) {
        setFriends([])
        return
      }

      // Extrair IDs dos amigos
      const friendIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      // Buscar perfis e stats dos amigos
      const [profilesResult, statsResult] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', friendIds),
        supabase.from('stats').select('user_id, level, xp').in('user_id', friendIds),
      ])

      // Montar dados dos amigos
      const friendsData: FriendData[] = friendships.map((f) => {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
        const profile = profilesResult.data?.find((p) => p.user_id === friendId)
        const stat = statsResult.data?.find((s) => s.user_id === friendId)

        return {
          friend_id: friendId,
          friend_username: profile?.username || 'usuario',
          friend_display_name: profile?.display_name || 'Jogador',
          friend_avatar_url: profile?.avatar_url || null,
          friend_level: stat?.level || 1,
          friend_xp: stat?.xp || 0,
          friendship_since: f.created_at,
        }
      })

      setFriends(friendsData)
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }, [])

  // Função otimizada para carregar solicitações com dados do perfil
  const loadPendingRequests = useCallback(async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Buscar solicitações pendentes
      const { data: requests, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      if (error) throw error
      if (!requests || requests.length === 0) {
        setPendingRequests([])
        return
      }

      // Buscar perfis dos solicitantes
      const requesterIds = requests.map((r) => r.requester_id)
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', requesterIds)

      const { data: stats } = await supabase
        .from('stats')
        .select('user_id, level')
        .in('user_id', requesterIds)

      // Combinar dados
      const enrichedRequests = requests.map((request) => {
        const profile = profiles?.find((p) => p.user_id === request.requester_id)
        const stat = stats?.find((s) => s.user_id === request.requester_id)
        return {
          ...request,
          requester_profile: profile
            ? {
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                level: stat?.level || 1,
              }
            : undefined,
        }
      })

      setPendingRequests(enrichedRequests)
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }, [])

  // Carregamento inicial otimizado com Promise.all
  useEffect(() => {
    let mounted = true

    async function loadAllData() {
      const supabase = createClient()
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || !mounted) {
          setLoading(false)
          return
        }

        // Queries paralelas para performance
        const [friendshipsResult, requestsResult] = await Promise.all([
          supabase
            .from('friendships')
            .select('id, requester_id, addressee_id, created_at')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
          supabase
            .from('friendships')
            .select('*')
            .eq('addressee_id', user.id)
            .eq('status', 'pending'),
        ])

        if (!mounted) return

        // Processar amigos aceitos
        if (friendshipsResult.data && friendshipsResult.data.length > 0) {
          const friendIds = friendshipsResult.data.map((f) =>
            f.requester_id === user.id ? f.addressee_id : f.requester_id
          )

          const [profilesRes, statsRes] = await Promise.all([
            supabase
              .from('public_profiles')
              .select('user_id, username, display_name, avatar_url')
              .in('user_id', friendIds),
            supabase.from('stats').select('user_id, level, xp').in('user_id', friendIds),
          ])

          if (!mounted) return

          const friendsData: FriendData[] = friendshipsResult.data.map((f) => {
            const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
            const profile = profilesRes.data?.find((p) => p.user_id === friendId)
            const stat = statsRes.data?.find((s) => s.user_id === friendId)

            return {
              friend_id: friendId,
              friend_username: profile?.username || 'usuario',
              friend_display_name: profile?.display_name || 'Jogador',
              friend_avatar_url: profile?.avatar_url || null,
              friend_level: stat?.level || 1,
              friend_xp: stat?.xp || 0,
              friendship_since: f.created_at,
            }
          })

          setFriends(friendsData)
        }

        // Enriquecer requests com perfis
        if (requestsResult.data && requestsResult.data.length > 0) {
          const requesterIds = requestsResult.data.map((r) => r.requester_id)

          const [profilesResult, statsResult] = await Promise.all([
            supabase
              .from('public_profiles')
              .select('user_id, username, display_name, avatar_url')
              .in('user_id', requesterIds),
            supabase.from('stats').select('user_id, level').in('user_id', requesterIds),
          ])

          if (!mounted) return

          const enrichedRequests = requestsResult.data.map((request) => {
            const profile = profilesResult.data?.find((p) => p.user_id === request.requester_id)
            const stat = statsResult.data?.find((s) => s.user_id === request.requester_id)
            return {
              ...request,
              requester_profile: profile
                ? {
                    username: profile.username,
                    display_name: profile.display_name,
                    avatar_url: profile.avatar_url,
                    level: stat?.level || 1,
                  }
                : undefined,
            }
          })
          setPendingRequests(enrichedRequests)
        }
      } catch (error) {
        console.error('Error loading friends data:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAllData()

    return () => {
      mounted = false
    }
  }, [])

  // Busca de usuários
  const searchUsers = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
      })
      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }, [searchTerm])

  // Enviar solicitação de amizade
  async function sendFriendRequest(userId: string) {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: userId,
        status: 'pending',
      })

      if (error) throw error
      toast.success('Solicitação de amizade enviada!')

      // Atualizar resultados para mostrar novo status
      startTransition(() => {
        searchUsers()
      })
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Você já enviou uma solicitação para este usuário')
      } else {
        toast.error(`Erro ao enviar solicitação: ${error.message}`)
      }
    }
  }

  // Aceitar solicitação recebida (da busca)
  async function acceptFriendRequest(userId: string) {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Encontrar a solicitação pendente
      const { data: request, error: findError } = await supabase
        .from('friendships')
        .select('id')
        .eq('requester_id', userId)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .single()

      if (findError || !request) {
        toast.error('Solicitação não encontrada')
        return
      }

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', request.id)

      if (error) throw error
      toast.success('Amizade aceita!')

      // Atualizar tudo
      startTransition(() => {
        searchUsers()
        loadFriends()
        loadPendingRequests()
      })
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Erro ao aceitar solicitação')
    }
  }

  // Responder a solicitação (da aba de solicitações)
  async function respondToRequest(requestId: string, accept: boolean) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      toast.success(accept ? 'Amizade aceita!' : 'Solicitação recusada')

      startTransition(() => {
        loadPendingRequests()
        if (accept) loadFriends()
      })
    } catch (error) {
      console.error('Error responding to request:', error)
      toast.error('Erro ao responder solicitação')
    }
  }

  // Renderizar botão de ação baseado no status
  const renderActionButton = (user: SearchResult) => {
    switch (user.friendship_status) {
      case 'accepted':
        return (
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 cursor-default">
            <UserCheck className="w-4 h-4" />
            Amigo
          </span>
        )
      case 'pending_sent':
        return (
          <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2 cursor-default">
            <Clock className="w-4 h-4" />
            Solicitação Enviada
          </span>
        )
      case 'pending_received':
        return (
          <button
            onClick={() => acceptFriendRequest(user.user_id)}
            disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Aceitar
          </button>
        )
      default:
        return (
          <button
            onClick={() => sendFriendRequest(user.user_id)}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar
          </button>
        )
    }
  }

  // Skeleton loader para cards
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto md:ml-64 lg:mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            Amigos
          </h1>
          <p className="text-gray-600">Conecte-se com outros jogadores e compita juntos!</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Meus Amigos ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Solicitações
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Search className="w-5 h-5 inline mr-2" />
            Buscar
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Tab: Meus Amigos */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* Barra de busca nos amigos */}
              {friends.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={friendsFilter}
                      onChange={(e) => setFriendsFilter(e.target.value)}
                      placeholder="Filtrar amigos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">Você ainda não tem amigos</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Buscar Amigos
                  </button>
                </div>
              ) : filteredFriends.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum amigo encontrado com "{friendsFilter}"
                </p>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.friend_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.friend_display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {friend.friend_display_name}
                        </h3>
                        <p className="text-sm text-gray-600">@{friend.friend_username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-gray-600">
                            Nível {friend.friend_level} • {friend.friend_xp?.toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Enviar mensagem"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Ver ranking"
                      >
                        <Trophy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Solicitações */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                        {request.requester_profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {request.requester_profile?.display_name || 'Usuário'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          @{request.requester_profile?.username || 'desconhecido'}
                        </p>
                        {request.requester_profile?.level && (
                          <div className="flex items-center gap-2 mt-1">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-gray-600">
                              Nível {request.requester_profile.level}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRequest(request.id, true)}
                        disabled={isPending}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        title="Aceitar"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, false)}
                        disabled={isPending}
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                        title="Recusar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Buscar */}
          {activeTab === 'search' && (
            <div>
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                    placeholder="Buscar por nome de usuário ou código de amigo..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={searchUsers}
                    disabled={isPending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Dica: Peça o código de amigo para adicionar diretamente
                </p>
              </div>

              <div className="space-y-4">
                {searchResults.length === 0 && searchTerm && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum usuário encontrado</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Tente buscar por nome ou código de amigo
                    </p>
                  </div>
                )}
                {!searchTerm && (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Digite um nome ou código para buscar</p>
                  </div>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {user.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          Código: {user.friend_code}
                        </p>
                      </div>
                    </div>
                    {renderActionButton(user)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
