-- =============================================
-- ATUALIZAÇÃO: Rastrear moedas de todas as fontes
-- =============================================

-- Criar tabela de histórico de moedas para rastrear todas as fontes
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positivo = ganho, negativo = gasto
  source TEXT NOT NULL CHECK (source IN (
    'habit_completion',    -- Moedas de completar hábitos
    'challenge_reward',    -- Recompensa de desafios
    'achievement_reward',  -- Recompensa de conquistas
    'multiplayer_reward',  -- Prêmio de multiplayer
    'pet_adventure',       -- Recompensa de aventuras de pets
    'pet_achievement',     -- Conquistas de pets
    'personal_goal',       -- Meta pessoal completada
    'shop_purchase',       -- Compra na loja (negativo)
    'admin_adjustment'     -- Ajuste manual
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coin_transactions_user_date ON coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_coin_transactions_source ON coin_transactions(source);

-- RLS
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their coin transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Função para registrar transação de moedas
CREATE OR REPLACE FUNCTION log_coin_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO coin_transactions (user_id, amount, source, description, metadata)
  VALUES (p_user_id, p_amount, p_source, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger de checkin para registrar moedas
CREATE OR REPLACE FUNCTION public.update_stats_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  habit_difficulty TEXT;
  habit_name TEXT;
  xp_gain INT;
  old_xp INT;
  new_xp INT;
  coins_earned INT;
BEGIN
  -- Get habit info
  SELECT difficulty, name INTO habit_difficulty, habit_name
  FROM habits
  WHERE id = NEW.habit_id;

  -- Calculate XP based on difficulty
  xp_gain := CASE habit_difficulty
    WHEN 'easy' THEN 10
    WHEN 'medium' THEN 20
    WHEN 'hard' THEN 30
    ELSE 10
  END;

  -- Get current XP
  SELECT xp INTO old_xp FROM stats WHERE user_id = NEW.user_id;
  new_xp := old_xp + xp_gain;

  -- Calculate coins earned (1 coin per 50 XP milestone)
  coins_earned := FLOOR(new_xp / 50) - FLOOR(old_xp / 50);

  -- Update stats
  UPDATE stats
  SET
    xp = new_xp,
    coins = coins + coins_earned,
    level = FLOOR(new_xp / 100) + 1,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Log coin transaction if coins were earned
  IF coins_earned > 0 THEN
    PERFORM log_coin_transaction(
      NEW.user_id,
      coins_earned,
      'habit_completion',
      'Moedas por completar: ' || habit_name,
      jsonb_build_object('habit_id', NEW.habit_id, 'xp_gained', xp_gain)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular moedas ganhas em um dia (de todas as fontes)
CREATE OR REPLACE FUNCTION get_daily_coins(p_user_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  total_coins INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_coins
  FROM coin_transactions
  WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND amount > 0; -- Apenas ganhos, não gastos

  RETURN total_coins;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função update_daily_statistics para usar moedas reais
CREATE OR REPLACE FUNCTION update_daily_statistics(target_date DATE, target_user_id UUID)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
  total_xp INTEGER;
  total_coins INTEGER;
BEGIN
  -- Calcular estatísticas do dia baseado em checkins
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

  total_xp := COALESCE(stats_record.total_xp, 0);

  -- Buscar moedas reais do dia (de todas as fontes)
  total_coins := get_daily_coins(target_user_id, target_date);

  -- Se não há transações de moedas registradas, calcular baseado em XP
  IF total_coins = 0 AND total_xp > 0 THEN
    total_coins := FLOOR(total_xp / 50.0);
  END IF;

  -- Inserir ou atualizar estatísticas
  INSERT INTO daily_statistics (
    user_id,
    date,
    total_habits_completed,
    total_xp_earned,
    total_coins_earned,
    habits_by_difficulty,
    habits_by_area
  ) VALUES (
    target_user_id,
    target_date,
    COALESCE(stats_record.total_habits, 0),
    total_xp,
    total_coins,
    COALESCE(stats_record.by_difficulty, '{"easy": 0, "medium": 0, "hard": 0}'::jsonb),
    COALESCE(stats_record.by_area, '{}'::jsonb)
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_habits_completed = EXCLUDED.total_habits_completed,
    total_xp_earned = EXCLUDED.total_xp_earned,
    total_coins_earned = EXCLUDED.total_coins_earned,
    habits_by_difficulty = EXCLUDED.habits_by_difficulty,
    habits_by_area = EXCLUDED.habits_by_area;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função get_user_dashboard para calcular moedas corretamente
CREATE OR REPLACE FUNCTION get_user_dashboard(target_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  today_stats RECORD;
  week_stats RECORD;
  month_stats RECORD;
  week_start_date DATE;
  month_start_date DATE;
  today_coins INTEGER;
  week_coins INTEGER;
  month_coins INTEGER;
BEGIN
  -- Calcular datas
  week_start_date := date_trunc('week', CURRENT_DATE)::DATE;
  month_start_date := date_trunc('month', CURRENT_DATE)::DATE;

  -- Buscar moedas de transações (todas as fontes)
  SELECT COALESCE(SUM(amount), 0) INTO today_coins
  FROM coin_transactions
  WHERE user_id = target_user_id
    AND DATE(created_at) = CURRENT_DATE
    AND amount > 0;

  SELECT COALESCE(SUM(amount), 0) INTO week_coins
  FROM coin_transactions
  WHERE user_id = target_user_id
    AND DATE(created_at) >= week_start_date
    AND DATE(created_at) <= CURRENT_DATE
    AND amount > 0;

  SELECT COALESCE(SUM(amount), 0) INTO month_coins
  FROM coin_transactions
  WHERE user_id = target_user_id
    AND DATE(created_at) >= month_start_date
    AND DATE(created_at) <= CURRENT_DATE
    AND amount > 0;

  -- Estatísticas de hoje
  SELECT * INTO today_stats
  FROM daily_statistics
  WHERE user_id = target_user_id AND date = CURRENT_DATE;

  -- Se não há transações de moedas, usar cálculo baseado em daily_statistics
  IF today_coins = 0 AND today_stats.total_coins_earned IS NOT NULL THEN
    today_coins := today_stats.total_coins_earned;
  END IF;

  -- Estatísticas da semana (agregado de daily_statistics)
  SELECT
    COALESCE(SUM(total_habits_completed), 0) as total_habits_completed,
    COALESCE(SUM(total_xp_earned), 0) as total_xp_earned,
    COALESCE(SUM(total_coins_earned), 0) as total_coins_from_stats,
    COALESCE(AVG(completion_rate), 0) as completion_rate,
    COUNT(*) FILTER (WHERE completion_rate >= 100) as perfect_days
  INTO week_stats
  FROM daily_statistics
  WHERE user_id = target_user_id
    AND date >= week_start_date
    AND date <= CURRENT_DATE;

  -- Se não há transações, usar stats
  IF week_coins = 0 THEN
    week_coins := week_stats.total_coins_from_stats;
  END IF;

  -- Estatísticas do mês (agregado de daily_statistics)
  SELECT
    COALESCE(SUM(total_habits_completed), 0) as total_habits_completed,
    COALESCE(SUM(total_xp_earned), 0) as total_xp_earned,
    COALESCE(SUM(total_coins_earned), 0) as total_coins_from_stats,
    COALESCE(AVG(completion_rate), 0) as avg_daily_completion,
    (SELECT date::text FROM daily_statistics
     WHERE user_id = target_user_id
       AND date >= month_start_date
     ORDER BY total_habits_completed DESC
     LIMIT 1) as most_productive_day
  INTO month_stats
  FROM daily_statistics
  WHERE user_id = target_user_id
    AND date >= month_start_date
    AND date <= CURRENT_DATE;

  -- Se não há transações, usar stats
  IF month_coins = 0 THEN
    month_coins := month_stats.total_coins_from_stats;
  END IF;

  -- Montar resultado
  result := jsonb_build_object(
    'today', CASE
      WHEN today_stats IS NULL THEN NULL
      ELSE jsonb_build_object(
        'total_habits_completed', COALESCE(today_stats.total_habits_completed, 0),
        'total_xp_earned', COALESCE(today_stats.total_xp_earned, 0),
        'total_coins_earned', COALESCE(today_coins, 0),
        'habits_by_difficulty', COALESCE(today_stats.habits_by_difficulty, '{"easy": 0, "medium": 0, "hard": 0}'::jsonb),
        'habits_by_area', COALESCE(today_stats.habits_by_area, '{}'::jsonb),
        'completion_rate', COALESCE(today_stats.completion_rate, 0)
      )
    END,
    'week', jsonb_build_object(
      'total_habits_completed', week_stats.total_habits_completed,
      'total_xp_earned', week_stats.total_xp_earned,
      'total_coins_earned', COALESCE(week_coins, 0),
      'completion_rate', week_stats.completion_rate,
      'perfect_days', week_stats.perfect_days
    ),
    'month', jsonb_build_object(
      'total_habits_completed', month_stats.total_habits_completed,
      'total_xp_earned', month_stats.total_xp_earned,
      'total_coins_earned', COALESCE(month_coins, 0),
      'avg_daily_completion', month_stats.avg_daily_completion,
      'most_productive_day', month_stats.most_productive_day
    ),
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter histórico de moedas por período
CREATE OR REPLACE FUNCTION get_coin_history(
  p_user_id UUID DEFAULT auth.uid(),
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_earned INTEGER,
  total_spent INTEGER,
  by_source JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ct.created_at) as date,
    SUM(ct.amount) FILTER (WHERE ct.amount > 0)::INTEGER as total_earned,
    ABS(SUM(ct.amount) FILTER (WHERE ct.amount < 0))::INTEGER as total_spent,
    jsonb_object_agg(
      ct.source,
      SUM(ct.amount) FILTER (WHERE ct.amount > 0)
    ) FILTER (WHERE ct.amount > 0) as by_source
  FROM coin_transactions ct
  WHERE ct.user_id = p_user_id
    AND ct.created_at >= CURRENT_DATE - p_days
  GROUP BY DATE(ct.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE coin_transactions IS 'Histórico de todas as transações de moedas (ganhos e gastos)';
COMMENT ON FUNCTION get_user_dashboard IS 'Retorna dashboard completo com estatísticas de hoje, semana e mês incluindo moedas de todas as fontes';
COMMENT ON FUNCTION log_coin_transaction IS 'Registra uma transação de moedas no histórico';
COMMENT ON FUNCTION get_coin_history IS 'Retorna histórico de moedas por dia com detalhamento por fonte';
