'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, UserPlus, MessageCircle, Trophy, Crown } from 'lucide-react';
import type { PublicProfile, Friendship } from '@/types/database.types';

export default function FriendsPage() {
  const supabase = createClient();
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  async function loadFriends() {
    try {
      const { data, error } = await supabase.rpc('get_friends');
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }

  async function searchUsers() {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm
      });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }

  async function sendFriendRequest(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: userId,
        status: 'pending'
      });

      if (error) throw error;
      alert('Solicitação de amizade enviada!');
      searchUsers(); // Atualizar resultados
    } catch (error: any) {
      alert('Erro ao enviar solicitação: ' + error.message);
    }
  }

  async function respondToRequest(requestId: string, accept: boolean) {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      loadPendingRequests();
      if (accept) loadFriends();
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            Amigos
          </h1>
          <p className="text-gray-600">Conecte-se com outros jogadores e compita juntos!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Meus Amigos ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Solicitações ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
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
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-gray-500 py-8">Carregando...</p>
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
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.friend_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.friend_display_name?.[0] || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{friend.friend_display_name}</h3>
                        <p className="text-sm text-gray-600">@{friend.friend_username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-gray-600">
                            Nível {friend.friend_level} • {friend.friend_xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Trophy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma solicitação pendente</p>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                        ?
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Nova solicitação</h3>
                        <p className="text-sm text-gray-600">Quer ser seu amigo</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRequest(request.id, true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    placeholder="Buscar por nome de usuário ou código de amigo..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={searchUsers}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {searchResults.length === 0 && searchTerm && (
                  <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado</p>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {user.display_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Código: {user.friend_code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user.user_id)}
                      disabled={(user as any).is_friend}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {(user as any).is_friend ? 'Já é amigo' : 'Adicionar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
