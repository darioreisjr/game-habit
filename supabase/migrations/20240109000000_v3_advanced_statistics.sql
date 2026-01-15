-- =============================================
-- VERSÃO 3: ESTATÍSTICAS AVANÇADAS E GRÁFICOS
-- =============================================

-- Tabela de estatísticas diárias agregadas
CREATE TABLE IF NOT EXISTS daily_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_habits_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  habits_by_difficulty JSONB DEFAULT '{"easy": 0, "medium": 0, "hard": 0}',
  habits_by_area JSONB DEFAULT '{}',
  completion_rate DECIMAL(5,2) DEFAULT 0, -- Porcentagem de hábitos completados
  best_streak INTEGER DEFAULT 0,
  time_distribution JSONB DEFAULT '{}', -- Distribuição por horário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_statistics_user_date ON daily_statistics(user_id, date DESC);
CREATE INDEX idx_daily_statistics_date ON daily_statistics(date);

-- Tabela de estatísticas semanais
CREATE TABLE IF NOT EXISTS weekly_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_habits_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  perfect_days INTEGER DEFAULT 0, -- Dias com 100% de conclusão
  best_day TEXT, -- Dia da semana com melhor performance
  worst_day TEXT,
  habits_by_area JSONB DEFAULT '{}',
  level_ups INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_statistics_user_week ON weekly_statistics(user_id, week_start DESC);

-- Tabela de estatísticas mensais
CREATE TABLE IF NOT EXISTS monthly_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_habits_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  avg_daily_completion DECIMAL(5,2) DEFAULT 0,
  best_week_start DATE,
  most_productive_day TEXT,
  total_streak_days INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  shop_purchases INTEGER DEFAULT 0,
  friends_added INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_monthly_statistics_user_period ON monthly_statistics(user_id, year DESC, month DESC);

-- Tabela de análise de hábitos individuais
CREATE TABLE IF NOT EXISTS habit_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_completions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  avg_completion_time TIME, -- Horário médio de conclusão
  most_common_day TEXT, -- Dia da semana mais comum
  xp_earned INTEGER DEFAULT 0,
  consistency_score DECIMAL(5,2) DEFAULT 0, -- Score de consistência 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, period_start, period_end)
);

CREATE INDEX idx_habit_analytics_habit ON habit_analytics(habit_id);
CREATE INDEX idx_habit_analytics_user ON habit_analytics(user_id);

-- Tabela de insights e recomendações
CREATE TABLE IF NOT EXISTS user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'improvement_suggestion',
    'achievement_near',
    'streak_warning',
    'consistency_praise',
    'habit_recommendation',
    'best_time_suggestion',
    'area_balance',
    'challenge_suggestion'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  action_text TEXT, -- Texto do botão de ação
  action_url TEXT, -- URL para ação sugerida
  metadata JSONB DEFAULT '{}',
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_acted_upon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_insights_user ON user_insights(user_id, is_dismissed, created_at DESC);
CREATE INDEX idx_user_insights_priority ON user_insights(user_id, priority DESC);

-- Tabela de metas personalizadas
CREATE TABLE IF NOT EXISTS personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'daily_habits',
    'weekly_habits',
    'monthly_xp',
    'reach_level',
    'maintain_streak',
    'complete_challenge',
    'earn_coins',
    'unlock_achievement'
  )),
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  deadline DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_xp INTEGER DEFAULT 0,
  reward_coins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_personal_goals_user ON personal_goals(user_id, is_completed);
CREATE INDEX idx_personal_goals_deadline ON personal_goals(deadline) WHERE is_completed = FALSE;

-- Tabela de comparação com médias (benchmarking)
CREATE TABLE IF NOT EXISTS user_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  user_value DECIMAL(10,2) NOT NULL,
  platform_average DECIMAL(10,2) NOT NULL,
  percentile INTEGER, -- Em que percentil o usuário está (0-100)
  rank INTEGER, -- Posição global
  total_users INTEGER, -- Total de usuários para contexto
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_name, period_type)
);

CREATE INDEX idx_user_benchmarks_user ON user_benchmarks(user_id);

-- Tabela de eventos para análise de comportamento
CREATE TABLE IF NOT EXISTS behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_behavior_events_user_time ON behavior_events(user_id, timestamp DESC);
CREATE INDEX idx_behavior_events_type ON behavior_events(event_type);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE daily_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own daily statistics"
  ON daily_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own weekly statistics"
  ON weekly_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own monthly statistics"
  ON monthly_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their habit analytics"
  ON habit_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their insights"
  ON user_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their insights"
  ON user_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their personal goals"
  ON personal_goals FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their benchmarks"
  ON user_benchmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their behavior events"
  ON behavior_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create behavior events"
  ON behavior_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para calcular e atualizar estatísticas diárias
CREATE OR REPLACE FUNCTION update_daily_statistics(target_date DATE, target_user_id UUID)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Calcular estatísticas do dia
  SELECT
    COUNT(*) as total_habits,
    COALESCE(SUM(CASE h.difficulty
      WHEN 'easy' THEN 10
      WHEN 'medium' THEN 20
      WHEN 'hard' THEN 30
    END), 0) as total_xp,
    jsonb_object_agg(
      h.difficulty,
      COUNT(*)
    ) FILTER (WHERE h.difficulty IS NOT NULL) as by_difficulty,
    jsonb_object_agg(
      a.name,
      COUNT(*)
    ) FILTER (WHERE a.name IS NOT NULL) as by_area
  INTO stats_record
  FROM checkins c
  JOIN habits h ON c.habit_id = h.id
  LEFT JOIN areas a ON h.area_id = a.id
  WHERE c.user_id = target_user_id
    AND c.date = target_date
  GROUP BY c.user_id;

  -- Inserir ou atualizar estatísticas
  INSERT INTO daily_statistics (
    user_id,
    date,
    total_habits_completed,
    total_xp_earned,
    habits_by_difficulty,
    habits_by_area
  ) VALUES (
    target_user_id,
    target_date,
    COALESCE(stats_record.total_habits, 0),
    COALESCE(stats_record.total_xp, 0),
    COALESCE(stats_record.by_difficulty, '{"easy": 0, "medium": 0, "hard": 0}'::jsonb),
    COALESCE(stats_record.by_area, '{}'::jsonb)
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_habits_completed = EXCLUDED.total_habits_completed,
    total_xp_earned = EXCLUDED.total_xp_earned,
    habits_by_difficulty = EXCLUDED.habits_by_difficulty,
    habits_by_area = EXCLUDED.habits_by_area;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas ao fazer check-in
CREATE OR REPLACE FUNCTION trigger_update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_daily_statistics(NEW.date::DATE, NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_checkin_update_daily_stats
  AFTER INSERT ON checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_daily_stats();

-- Função para calcular estatísticas semanais
CREATE OR REPLACE FUNCTION calculate_weekly_statistics(target_user_id UUID, week_start_date DATE)
RETURNS void AS $$
DECLARE
  week_end_date DATE := week_start_date + INTERVAL '6 days';
  stats_data RECORD;
BEGIN
  SELECT
    SUM(total_habits_completed) as total_habits,
    SUM(total_xp_earned) as total_xp,
    AVG(completion_rate) as avg_completion,
    COUNT(*) FILTER (WHERE completion_rate >= 100) as perfect_days
  INTO stats_data
  FROM daily_statistics
  WHERE user_id = target_user_id
    AND date BETWEEN week_start_date AND week_end_date;

  INSERT INTO weekly_statistics (
    user_id,
    week_start,
    week_end,
    total_habits_completed,
    total_xp_earned,
    completion_rate,
    perfect_days
  ) VALUES (
    target_user_id,
    week_start_date,
    week_end_date,
    COALESCE(stats_data.total_habits, 0),
    COALESCE(stats_data.total_xp, 0),
    COALESCE(stats_data.avg_completion, 0),
    COALESCE(stats_data.perfect_days, 0)
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    total_habits_completed = EXCLUDED.total_habits_completed,
    total_xp_earned = EXCLUDED.total_xp_earned,
    completion_rate = EXCLUDED.completion_rate,
    perfect_days = EXCLUDED.perfect_days;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar insights automáticos
CREATE OR REPLACE FUNCTION generate_user_insights(target_user_id UUID)
RETURNS void AS $$
DECLARE
  current_streak_val INTEGER;
  habits_today INTEGER;
  avg_habits_week DECIMAL;
BEGIN
  -- Buscar streak atual
  SELECT current_streak INTO current_streak_val
  FROM streaks WHERE user_id = target_user_id;

  -- Insight: Streak próximo de marco
  IF current_streak_val >= 5 AND current_streak_val < 7 THEN
    INSERT INTO user_insights (user_id, insight_type, title, description, priority)
    VALUES (
      target_user_id,
      'achievement_near',
      'Quase lá! 🔥',
      'Faltam apenas ' || (7 - current_streak_val) || ' dias para sua conquista de 7 dias!',
      8
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- Verificar hábitos de hoje
  SELECT COUNT(*) INTO habits_today
  FROM checkins
  WHERE user_id = target_user_id AND date = CURRENT_DATE;

  -- Calcular média semanal
  SELECT AVG(total_habits_completed) INTO avg_habits_week
  FROM daily_statistics
  WHERE user_id = target_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';

  -- Insight: Performance acima da média
  IF habits_today > avg_habits_week * 1.5 THEN
    INSERT INTO user_insights (user_id, insight_type, title, description, priority)
    VALUES (
      target_user_id,
      'consistency_praise',
      'Dia incrível! ⭐',
      'Você completou ' || habits_today || ' hábitos hoje, muito acima da sua média!',
      7
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular score de consistência de um hábito
CREATE OR REPLACE FUNCTION calculate_habit_consistency(
  target_habit_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
  expected_completions INTEGER;
  actual_completions INTEGER;
  consistency_score DECIMAL;
BEGIN
  -- Calcular completações esperadas baseado na frequência
  SELECT
    CASE
      WHEN h.frequency->>'type' = 'daily' THEN days_back
      WHEN h.frequency->>'type' = 'weekly' THEN
        (h.frequency->>'times_per_week')::INTEGER * (days_back / 7.0)
      ELSE days_back -- custom
    END
  INTO expected_completions
  FROM habits h
  WHERE h.id = target_habit_id;

  -- Contar completações reais
  SELECT COUNT(*) INTO actual_completions
  FROM checkins
  WHERE habit_id = target_habit_id
    AND date >= CURRENT_DATE - days_back;

  -- Calcular score (máximo 100)
  consistency_score := LEAST(100, (actual_completions::DECIMAL / NULLIF(expected_completions, 0)) * 100);

  RETURN COALESCE(consistency_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para obter dashboard completo
CREATE OR REPLACE FUNCTION get_user_dashboard(target_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  today_stats RECORD;
  week_stats RECORD;
  month_stats RECORD;
BEGIN
  -- Estatísticas de hoje
  SELECT * INTO today_stats
  FROM daily_statistics
  WHERE user_id = target_user_id AND date = CURRENT_DATE;

  -- Estatísticas da semana
  SELECT * INTO week_stats
  FROM weekly_statistics
  WHERE user_id = target_user_id
    AND week_start = date_trunc('week', CURRENT_DATE)::DATE;

  -- Estatísticas do mês
  SELECT * INTO month_stats
  FROM monthly_statistics
  WHERE user_id = target_user_id
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);

  -- Montar resultado
  result := jsonb_build_object(
    'today', row_to_json(today_stats),
    'week', row_to_json(week_stats),
    'month', row_to_json(month_stats),
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar evento de comportamento
CREATE OR REPLACE FUNCTION track_behavior_event(
  event_name TEXT,
  event_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO behavior_events (user_id, event_type, event_data)
  VALUES (auth.uid(), event_name, event_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE daily_statistics IS 'Estatísticas diárias agregadas do usuário';
COMMENT ON TABLE weekly_statistics IS 'Estatísticas semanais para visualização de tendências';
COMMENT ON TABLE monthly_statistics IS 'Resumo mensal de performance';
COMMENT ON TABLE habit_analytics IS 'Análise detalhada de cada hábito individual';
COMMENT ON TABLE user_insights IS 'Insights e recomendações personalizadas geradas por IA';
COMMENT ON TABLE personal_goals IS 'Metas personalizadas definidas pelo usuário';
COMMENT ON TABLE user_benchmarks IS 'Comparação com médias e rankings da plataforma';
COMMENT ON TABLE behavior_events IS 'Eventos de comportamento para análise de padrões';
