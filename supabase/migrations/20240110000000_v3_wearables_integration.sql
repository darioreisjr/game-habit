-- =============================================
-- VERSÃO 3: INTEGRAÇÃO COM WEARABLES
-- =============================================

-- Tabela de conexões com dispositivos wearables
CREATE TABLE IF NOT EXISTS wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'google_fit',
    'apple_health',
    'fitbit',
    'garmin',
    'samsung_health',
    'mi_fit',
    'strava',
    'whoop'
  )),
  device_name TEXT,
  device_model TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  access_token_encrypted TEXT, -- Token criptografado
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 60, -- Minutos entre sincronizações
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_wearable_connections_user ON wearable_connections(user_id);
CREATE INDEX idx_wearable_connections_active ON wearable_connections(is_active);

-- Tabela de dados sincronizados dos wearables
CREATE TABLE IF NOT EXISTS wearable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES wearable_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'steps',
    'distance',
    'calories',
    'heart_rate',
    'sleep',
    'active_minutes',
    'workout',
    'weight',
    'water_intake',
    'meditation'
  )),
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL, -- 'steps', 'km', 'kcal', 'bpm', 'hours', 'minutes', 'kg', 'ml'
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- Dados adicionais específicos do tipo
);

CREATE INDEX idx_wearable_data_user_type ON wearable_data(user_id, data_type, recorded_at DESC);
CREATE INDEX idx_wearable_data_connection ON wearable_data(connection_id);

-- Tabela de mapeamento: dados do wearable → hábitos
CREATE TABLE IF NOT EXISTS wearable_habit_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL, -- Valor mínimo para completar o hábito
  threshold_operator TEXT NOT NULL CHECK (threshold_operator IN ('>=', '>', '=', '<', '<=')),
  auto_complete BOOLEAN DEFAULT TRUE, -- Completar automaticamente ao atingir threshold
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, data_type)
);

CREATE INDEX idx_wearable_mappings_habit ON wearable_habit_mappings(habit_id);
CREATE INDEX idx_wearable_mappings_user ON wearable_habit_mappings(user_id);

-- Tabela de metas fitness automáticas
CREATE TABLE IF NOT EXISTS fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fitness_goals_user ON fitness_goals(user_id, is_active);

-- Tabela de conquistas fitness
CREATE TABLE IF NOT EXISTS fitness_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  data_type TEXT NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('single_session', 'daily_total', 'weekly_total', 'monthly_total', 'all_time')),
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir conquistas fitness predefinidas
INSERT INTO fitness_achievements (achievement_key, name, description, icon, data_type, threshold_value, threshold_type, xp_reward, coin_reward, rarity) VALUES
  ('walker_1k', '1K Walker', 'Caminhe 1.000 passos em um dia', '🚶', 'steps', 1000, 'daily_total', 50, 10, 'common'),
  ('walker_5k', '5K Walker', 'Caminhe 5.000 passos em um dia', '🚶‍♂️', 'steps', 5000, 'daily_total', 100, 20, 'common'),
  ('walker_10k', '10K Master', 'Alcance 10.000 passos em um dia', '🏃', 'steps', 10000, 'daily_total', 200, 50, 'rare'),
  ('marathon_walker', 'Marathon Walker', 'Caminhe 20.000 passos em um dia', '🏃‍♀️', 'steps', 20000, 'daily_total', 500, 100, 'epic'),
  ('ultra_walker', 'Ultra Walker', 'Caminhe 30.000 passos em um dia', '⚡', 'steps', 30000, 'daily_total', 1000, 200, 'legendary'),

  ('calorie_burner', 'Calorie Burner', 'Queime 500 calorias em um dia', '🔥', 'calories', 500, 'daily_total', 100, 20, 'common'),
  ('mega_burner', 'Mega Burner', 'Queime 1000 calorias em um dia', '💥', 'calories', 1000, 'daily_total', 300, 60, 'rare'),

  ('active_30', 'Active 30', '30 minutos ativos em um dia', '⏱️', 'active_minutes', 30, 'daily_total', 50, 10, 'common'),
  ('active_60', 'Active Hour', '60 minutos ativos em um dia', '🕐', 'active_minutes', 60, 'daily_total', 150, 30, 'rare'),
  ('active_warrior', 'Active Warrior', '120 minutos ativos em um dia', '⚔️', 'active_minutes', 120, 'daily_total', 400, 80, 'epic'),

  ('sleep_master', 'Sleep Master', 'Durma 8 horas', '😴', 'sleep', 8, 'single_session', 100, 20, 'common'),
  ('hydration_hero', 'Hydration Hero', 'Beba 2L de água em um dia', '💧', 'water_intake', 2000, 'daily_total', 50, 10, 'common'),
  ('zen_master', 'Zen Master', '30 minutos de meditação', '🧘', 'meditation', 30, 'single_session', 150, 30, 'rare')
ON CONFLICT (achievement_key) DO NOTHING;

-- Tabela de conquistas fitness desbloqueadas
CREATE TABLE IF NOT EXISTS user_fitness_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES fitness_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_value DECIMAL(10,2), -- Valor que desbloqueou a conquista
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_fitness_achievements_user ON user_fitness_achievements(user_id);

-- Tabela de histórico de sincronizações
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES wearable_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'partial')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sync_history_user ON sync_history(user_id, sync_started_at DESC);
CREATE INDEX idx_sync_history_connection ON sync_history(connection_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_habit_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fitness_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their wearable connections"
  ON wearable_connections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their wearable data"
  ON wearable_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their habit mappings"
  ON wearable_habit_mappings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their fitness goals"
  ON fitness_goals FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Fitness achievements are viewable by everyone"
  ON fitness_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can view their fitness achievements"
  ON user_fitness_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their sync history"
  ON sync_history FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para processar dados do wearable e completar hábitos automaticamente
CREATE OR REPLACE FUNCTION process_wearable_data_for_habits()
RETURNS TRIGGER AS $$
DECLARE
  mapping RECORD;
  should_complete BOOLEAN;
BEGIN
  -- Para cada mapeamento ativo do usuário para esse tipo de dado
  FOR mapping IN
    SELECT * FROM wearable_habit_mappings
    WHERE user_id = NEW.user_id
      AND data_type = NEW.data_type
      AND is_active = TRUE
      AND auto_complete = TRUE
  LOOP
    -- Verificar se atinge o threshold
    should_complete := CASE mapping.threshold_operator
      WHEN '>=' THEN NEW.value >= mapping.threshold_value
      WHEN '>' THEN NEW.value > mapping.threshold_value
      WHEN '=' THEN NEW.value = mapping.threshold_value
      WHEN '<=' THEN NEW.value <= mapping.threshold_value
      WHEN '<' THEN NEW.value < mapping.threshold_value
    END;

    -- Se atingiu, completar o hábito
    IF should_complete THEN
      INSERT INTO checkins (user_id, habit_id, date, value)
      VALUES (
        NEW.user_id,
        mapping.habit_id,
        NEW.recorded_at::DATE,
        NEW.value::INTEGER
      )
      ON CONFLICT (user_id, habit_id, date) DO NOTHING;

      -- Registrar evento
      INSERT INTO behavior_events (user_id, event_type, event_data)
      VALUES (
        NEW.user_id,
        'wearable_auto_complete',
        jsonb_build_object(
          'habit_id', mapping.habit_id,
          'data_type', NEW.data_type,
          'value', NEW.value,
          'threshold', mapping.threshold_value
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_wearable_data_check_habits
  AFTER INSERT ON wearable_data
  FOR EACH ROW
  EXECUTE FUNCTION process_wearable_data_for_habits();

-- Função para verificar conquistas fitness
CREATE OR REPLACE FUNCTION check_fitness_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement RECORD;
  user_total DECIMAL(10,2);
  achievement_unlocked BOOLEAN;
BEGIN
  -- Para cada conquista do tipo de dado
  FOR achievement IN
    SELECT * FROM fitness_achievements
    WHERE data_type = NEW.data_type
  LOOP
    achievement_unlocked := FALSE;

    -- Calcular total baseado no tipo de threshold
    CASE achievement.threshold_type
      WHEN 'single_session' THEN
        IF NEW.value >= achievement.threshold_value THEN
          achievement_unlocked := TRUE;
        END IF;

      WHEN 'daily_total' THEN
        SELECT COALESCE(SUM(value), 0) INTO user_total
        FROM wearable_data
        WHERE user_id = NEW.user_id
          AND data_type = NEW.data_type
          AND recorded_at::DATE = NEW.recorded_at::DATE;

        IF user_total >= achievement.threshold_value THEN
          achievement_unlocked := TRUE;
        END IF;

      WHEN 'weekly_total' THEN
        SELECT COALESCE(SUM(value), 0) INTO user_total
        FROM wearable_data
        WHERE user_id = NEW.user_id
          AND data_type = NEW.data_type
          AND recorded_at >= date_trunc('week', NEW.recorded_at);

        IF user_total >= achievement.threshold_value THEN
          achievement_unlocked := TRUE;
        END IF;

      WHEN 'monthly_total' THEN
        SELECT COALESCE(SUM(value), 0) INTO user_total
        FROM wearable_data
        WHERE user_id = NEW.user_id
          AND data_type = NEW.data_type
          AND recorded_at >= date_trunc('month', NEW.recorded_at);

        IF user_total >= achievement.threshold_value THEN
          achievement_unlocked := TRUE;
        END IF;
    END CASE;

    -- Se desbloqueou, inserir
    IF achievement_unlocked THEN
      INSERT INTO user_fitness_achievements (user_id, achievement_id, data_value)
      VALUES (NEW.user_id, achievement.id, COALESCE(user_total, NEW.value))
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Dar recompensas
      UPDATE stats
      SET xp = xp + achievement.xp_reward,
          coins = coins + achievement.coin_reward
      WHERE user_id = NEW.user_id;

      -- Criar notificação
      INSERT INTO notifications (user_id, title, message, type, scheduled_for)
      VALUES (
        NEW.user_id,
        'Conquista Fitness Desbloqueada! 🏆',
        'Você desbloqueou: ' || achievement.name,
        'achievement',
        NOW()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_wearable_data_check_achievements
  AFTER INSERT ON wearable_data
  FOR EACH ROW
  EXECUTE FUNCTION check_fitness_achievements();

-- Função para obter resumo fitness do dia
CREATE OR REPLACE FUNCTION get_daily_fitness_summary(
  target_user_id UUID DEFAULT auth.uid(),
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(data_type, total_value)
  INTO result
  FROM (
    SELECT
      data_type,
      SUM(value) as total_value
    FROM wearable_data
    WHERE user_id = target_user_id
      AND recorded_at::DATE = target_date
    GROUP BY data_type
  ) subquery;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE wearable_connections IS 'Conexões com dispositivos wearables (Apple Health, Google Fit, etc)';
COMMENT ON TABLE wearable_data IS 'Dados sincronizados dos wearables';
COMMENT ON TABLE wearable_habit_mappings IS 'Mapeamento entre dados wearables e hábitos';
COMMENT ON TABLE fitness_goals IS 'Metas fitness automáticas baseadas em dados wearables';
COMMENT ON TABLE fitness_achievements IS 'Conquistas relacionadas a fitness';
COMMENT ON TABLE user_fitness_achievements IS 'Conquistas fitness desbloqueadas';
COMMENT ON TABLE sync_history IS 'Histórico de sincronizações com wearables';
