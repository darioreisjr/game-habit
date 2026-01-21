'use client'

import {
  Bell,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Palette,
  RefreshCw,
  Settings,
  User,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, PublicProfile, Theme, UserPreferences } from '@/types/database.types'

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
    <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
    <div className="h-8 w-48 bg-gray-200 rounded" />
  </div>
)

export function SettingsView() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Form states for public profile
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [isSearchable, setIsSearchable] = useState(true)

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Load all data in parallel
    const [themesResult, preferencesResult, publicProfileResult, inventoryResult] =
      await Promise.all([
        supabase.from('themes').select('*'),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
        supabase.from('public_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('inventory').select('*').eq('user_id', user.id),
      ])

    setThemes(themesResult.data || [])
    setPreferences(preferencesResult.data)
    setInventory(inventoryResult.data || [])

    if (publicProfileResult.data) {
      setPublicProfile(publicProfileResult.data)
      setDisplayName(publicProfileResult.data.display_name || '')
      setUsername(publicProfileResult.data.username || '')
      setIsSearchable(publicProfileResult.data.is_searchable ?? true)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Create public profile if it doesn't exist
  const createPublicProfile = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Get user's name from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const name = profile?.name || 'Jogador'
    const baseUsername = name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    // Generate unique friend code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let friendCode = ''
    for (let i = 0; i < 8; i++) {
      friendCode += chars[Math.floor(Math.random() * chars.length)]
    }

    const { data, error } = await supabase
      .from('public_profiles')
      .insert({
        user_id: user.id,
        username: baseUsername + '_' + Math.random().toString(36).substring(2, 6),
        display_name: name,
        is_searchable: true,
        friend_code: friendCode,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating public profile:', error)
      toast.error('Erro ao criar perfil publico')
      return
    }

    setPublicProfile(data)
    setDisplayName(data.display_name)
    setUsername(data.username)
    setIsSearchable(data.is_searchable)
    toast.success('Perfil publico criado!')
  }

  // Save public profile changes
  const handleSavePublicProfile = async () => {
    if (!publicProfile) return

    setSavingProfile(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSavingProfile(false)
      return
    }

    // Check if username is unique
    if (username !== publicProfile.username) {
      const { data: existingUser } = await supabase
        .from('public_profiles')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .neq('user_id', user.id)
        .single()

      if (existingUser) {
        toast.error('Este nome de usuario ja esta em uso')
        setSavingProfile(false)
        return
      }
    }

    const { error } = await supabase
      .from('public_profiles')
      .update({
        display_name: displayName,
        username: username
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, ''),
        is_searchable: isSearchable,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error saving public profile:', error)
      toast.error('Erro ao salvar perfil')
    } else {
      toast.success('Perfil atualizado!')
      loadData()
    }

    setSavingProfile(false)
  }

  // Generate new friend code
  const handleGenerateNewCode = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let newCode = ''
    for (let i = 0; i < 8; i++) {
      newCode += chars[Math.floor(Math.random() * chars.length)]
    }

    const { error } = await supabase
      .from('public_profiles')
      .update({ friend_code: newCode })
      .eq('user_id', user.id)

    if (error) {
      toast.error('Erro ao gerar novo codigo')
    } else {
      toast.success('Novo codigo gerado!')
      loadData()
    }
  }

  // Copy friend code to clipboard
  const handleCopyCode = () => {
    if (publicProfile?.friend_code) {
      navigator.clipboard.writeText(publicProfile.friend_code)
      toast.success('Codigo copiado!')
    }
  }

  const handleChangeTheme = async (themeKey: string) => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase.rpc('change_theme', {
      p_user_id: user.id,
      p_theme_key: themeKey,
    })

    if (error) {
      console.error('Error changing theme:', error)
      toast.error('Erro ao mudar tema. Tente novamente.')
      return
    }

    if (data.success) {
      loadData()
      toast.success('Tema alterado com sucesso!')
    } else {
      toast.warning(data.error || 'Voce precisa desbloquear este tema na loja!')
    }
  }

  const handleToggleNotifications = async () => {
    if (!preferences) return

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('user_preferences')
      .update({ notifications_enabled: !preferences.notifications_enabled })
      .eq('user_id', user.id)

    loadData()
  }

  const canUseTheme = (theme: Theme) => {
    if (!theme.is_premium) return true
    if (!theme.requires_item) return true

    return inventory.some((item) => item.item_key === theme.requires_item)
  }

  if (loading) {
    return (
      <div className="md:ml-64">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <div>
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 md:w-10 md:h-10" />
            Configuracoes
          </h1>
          <p className="text-text-secondary mt-1">Personalize sua experiencia</p>
        </div>

        {/* Public Profile */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              Perfil Publico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!publicProfile ? (
              <div className="text-center py-6">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Voce ainda nao tem um perfil publico. Crie um para que outros jogadores possam te
                  encontrar e adicionar como amigo.
                </p>
                <Button onClick={createPublicProfile}>Criar Perfil Publico</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Friend Code */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Seu Codigo de Amigo</p>
                      <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                        {publicProfile.friend_code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        title="Copiar codigo"
                      >
                        <Copy className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={handleGenerateNewCode}
                        className="p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        title="Gerar novo codigo"
                      >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Compartilhe este codigo para que amigos possam te adicionar rapidamente
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="displayName"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User size={16} />
                    Nome de Exibicao
                  </label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Como voce quer ser chamado"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">Este nome aparece para outros jogadores</p>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Nome de Usuario
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                      @
                    </span>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      placeholder="seu_usuario"
                      className="rounded-l-none"
                      maxLength={30}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Apenas letras minusculas, numeros e underscore
                  </p>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isSearchable ? (
                      <Eye className="w-5 h-5 text-green-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {isSearchable ? 'Perfil Publico' : 'Perfil Privado'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isSearchable
                          ? 'Outros jogadores podem te encontrar e enviar solicitacoes'
                          : 'Voce nao aparece nas buscas de amigos'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSearchable(!isSearchable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isSearchable ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isSearchable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSavePublicProfile}
                  disabled={savingProfile}
                  className="w-full"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Alteracoes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Themes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={24} />
              Temas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((theme) => {
                const isActive = preferences?.active_theme === theme.theme_key
                const canUse = canUseTheme(theme)
                const colors = theme.colors as {
                  primary: string
                  secondary: string
                  accent: string
                  background: string
                }

                return (
                  <div
                    key={theme.id}
                    className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                      isActive
                        ? 'border-mario-red bg-mario-red/5'
                        : canUse
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 opacity-50'
                    }`}
                    onClick={() => canUse && handleChangeTheme(theme.theme_key)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-lg">{theme.name}</h3>
                        <p className="text-sm text-gray-600">{theme.description}</p>
                      </div>
                      {!canUse && <Lock size={20} className="text-gray-400" />}
                      {isActive && (
                        <div className="bg-mario-red text-white text-xs px-2 py-1 rounded-full">
                          Ativo
                        </div>
                      )}
                    </div>

                    {/* Color Preview */}
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ backgroundColor: colors.secondary }}
                      />
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: colors.background }}
                      />
                    </div>

                    {theme.is_premium && !canUse && (
                      <div className="mt-3 text-sm text-gray-500">🔒 Desbloqueie na loja</div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={24} />
              Notificacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Notificacoes de Habitos</h3>
                <p className="text-sm text-text-secondary">
                  Receba lembretes para completar seus habitos
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences?.notifications_enabled ? 'bg-mario-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences?.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences?.notifications_enabled && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">⏰ Horario: {preferences.notification_time}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Configure horarios personalizados em breve!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={24} />
              Outras Configuracoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Sons</h3>
                  <p className="text-sm text-text-secondary">Efeitos sonoros e musica</p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences?.sound_enabled ? 'bg-mario-green' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences?.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-1">Idioma</h3>
                <p className="text-sm text-text-secondary mb-2">
                  {preferences?.language === 'pt-BR' ? 'Portugues (Brasil)' : 'Portugues'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
