'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Theme, UserPreferences, InventoryItem } from '@/types/database.types';
import { Settings, Palette, Bell, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Load themes
    const { data: themesData } = await supabase.from('themes').select('*');

    setThemes(themesData || []);

    // Load user preferences
    const { data: preferencesData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setPreferences(preferencesData);

    // Load user inventory (for theme ownership)
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id);

    setInventory(inventoryData || []);
    setLoading(false);
  };

  const handleChangeTheme = async (themeKey: string) => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase.rpc('change_theme', {
      p_user_id: user.id,
      p_theme_key: themeKey,
    });

    if (error) {
      console.error('Error changing theme:', error);
      alert('Erro ao mudar tema. Tente novamente.');
      return;
    }

    if (data.success) {
      loadData();
      alert('Tema alterado com sucesso!');
    } else {
      alert(data.error || 'Você precisa desbloquear este tema na loja!');
    }
  };

  const handleToggleNotifications = async () => {
    if (!preferences) return;

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('user_preferences')
      .update({ notifications_enabled: !preferences.notifications_enabled })
      .eq('user_id', user.id);

    loadData();
  };

  const canUseTheme = (theme: Theme) => {
    if (!theme.is_premium) return true;
    if (!theme.requires_item) return true;

    return inventory.some((item) => item.item_key === theme.requires_item);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 md:ml-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:ml-64">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Configurações</h1>
        <p className="text-text-secondary mt-1">Personalize sua experiência</p>
      </div>

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
              const isActive = preferences?.active_theme === theme.theme_key;
              const canUse = canUseTheme(theme);
              const colors = theme.colors as {
                primary: string;
                secondary: string;
                accent: string;
                background: string;
              };

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
                      <h3 className="font-display font-bold text-lg">
                        {theme.name}
                      </h3>
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
                    <div className="mt-3 text-sm text-gray-500">
                      🔒 Desbloqueie na loja
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={24} />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Notificações de Hábitos</h3>
              <p className="text-sm text-text-secondary">
                Receba lembretes para completar seus hábitos
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences?.notifications_enabled
                  ? 'bg-mario-green'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences?.notifications_enabled
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences?.notifications_enabled && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                ⏰ Horário: {preferences.notification_time}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Configure horários personalizados em breve!
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
            Outras Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Sons</h3>
                <p className="text-sm text-text-secondary">
                  Efeitos sonoros e música
                </p>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences?.sound_enabled ? 'bg-mario-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences?.sound_enabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-1">Idioma</h3>
              <p className="text-sm text-text-secondary mb-2">
                {preferences?.language === 'pt-BR'
                  ? 'Português (Brasil)'
                  : 'Português'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
