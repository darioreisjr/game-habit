-- ==============================================
-- CORREÇÃO COMPLETA DOS PROBLEMAS DE RLS
-- Execute este script no Supabase SQL Editor
-- ==============================================

-- =============================================
-- PARTE 1: Fix recursão infinita em multiplayer_participants
-- =============================================

-- 1.1 Criar função auxiliar com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_multiplayer_participant(challenge_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.multiplayer_participants
    WHERE challenge_id = challenge_uuid
      AND user_id = auth.uid()
  );
$$;

ALTER FUNCTION public.is_multiplayer_participant(UUID) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.is_multiplayer_participant(UUID) TO authenticated;

-- 1.2 Remover política antiga problemática
DROP POLICY IF EXISTS "Participants can view challenge participants" ON multiplayer_participants;

-- 1.3 Criar nova política sem recursão
CREATE POLICY "Participants can view challenge participants"
  ON multiplayer_participants FOR SELECT
  USING (
    -- Usuário pode ver seus próprios registros
    user_id = auth.uid()
    OR
    -- Ou se o desafio é público
    EXISTS (
      SELECT 1 FROM multiplayer_challenges mc
      WHERE mc.id = challenge_id
        AND mc.is_private = FALSE
    )
    OR
    -- Ou se é participante (usando função SECURITY DEFINER)
    public.is_multiplayer_participant(challenge_id)
  );

-- =============================================
-- PARTE 2: Fix erro de aggregate em checkins
-- =============================================

-- 2.1 Função para atualizar estatísticas diárias
CREATE OR REPLACE FUNCTION update_daily_statistics(target_date DATE, target_user_id UUID)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
  difficulty_json JSONB;
  area_json JSONB;
BEGIN
  -- Base totals
  SELECT
    COUNT(*) AS total_habits,
    COALESCE(SUM(CASE h.difficulty
      WHEN 'easy' THEN 10
      WHEN 'medium' THEN 20
      WHEN 'hard' THEN 30
    END), 0) AS total_xp
  INTO stats_record
  FROM checkins c
  JOIN habits h ON c.habit_id = h.id
  WHERE c.user_id = target_user_id
    AND c.date = target_date;

  -- Pre-aggregate by difficulty
  SELECT COALESCE(
    jsonb_object_agg(difficulty, cnt),
    '{"easy": 0, "medium": 0, "hard": 0}'::jsonb
  )
  INTO difficulty_json
  FROM (
    SELECT h.difficulty, COUNT(*) AS cnt
    FROM checkins c
    JOIN habits h ON c.habit_id = h.id
    WHERE c.user_id = target_user_id
      AND c.date = target_date
    GROUP BY h.difficulty
  ) d;

  -- Pre-aggregate by area
  SELECT COALESCE(
    jsonb_object_agg(area_name, cnt),
    '{}'::jsonb
  )
  INTO area_json
  FROM (
    SELECT a.name AS area_name, COUNT(*) AS cnt
    FROM checkins c
    JOIN habits h ON c.habit_id = h.id
    LEFT JOIN areas a ON h.area_id = a.id
    WHERE c.user_id = target_user_id
      AND c.date = target_date
      AND a.name IS NOT NULL
    GROUP BY a.name
  ) a;

  -- Upsert daily stats
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
    difficulty_json,
    area_json
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_habits_completed = EXCLUDED.total_habits_completed,
    total_xp_earned = EXCLUDED.total_xp_earned,
    habits_by_difficulty = EXCLUDED.habits_by_difficulty,
    habits_by_area = EXCLUDED.habits_by_area;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION update_daily_statistics(DATE, UUID) SET search_path = public;

-- 2.2 Políticas para daily_statistics
DROP POLICY IF EXISTS "Users can insert their daily statistics" ON daily_statistics;
DROP POLICY IF EXISTS "Users can update their daily statistics" ON daily_statistics;

CREATE POLICY "Users can insert their daily statistics"
  ON daily_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their daily statistics"
  ON daily_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- PARTE 3: Fix trigger de multiplayer para usar SECURITY DEFINER
-- =============================================

-- 3.1 Recriar função do trigger com SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_multiplayer_score_on_checkin()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  active_challenges RECORD;
  habit_data habits%ROWTYPE;
  points INTEGER;
BEGIN
  -- Buscar dados do hábito
  SELECT * INTO habit_data FROM habits WHERE id = NEW.habit_id;

  -- Se não encontrar o hábito, retornar sem fazer nada
  IF habit_data IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcular pontos baseado na dificuldade
  points := CASE habit_data.difficulty
    WHEN 'easy' THEN 10
    WHEN 'medium' THEN 20
    WHEN 'hard' THEN 30
    ELSE 10
  END;

  -- Atualizar score em todos os desafios multiplayer ativos
  FOR active_challenges IN
    SELECT mp.id, mc.id as challenge_id, mc.mode
    FROM multiplayer_participants mp
    JOIN multiplayer_challenges mc ON mp.challenge_id = mc.id
    WHERE mp.user_id = NEW.user_id
      AND mp.status = 'active'
      AND mc.is_active = TRUE
      AND mc.start_date <= NOW()
      AND mc.end_date >= NOW()
  LOOP
    -- Atualizar score do participante
    UPDATE multiplayer_participants
    SET score = score + points,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{total_habits}',
          to_jsonb(COALESCE((metadata->>'total_habits')::INTEGER, 0) + 1)
        )
    WHERE id = active_challenges.id;

    -- Atualizar progresso dos objetivos
    UPDATE multiplayer_objective_progress mop
    SET current_value = current_value + 1
    FROM multiplayer_objectives mo
    WHERE mop.objective_id = mo.id
      AND mo.challenge_id = active_challenges.challenge_id
      AND mop.participant_id = active_challenges.id
      AND mo.objective_type IN ('complete_habits', 'specific_area');

    -- Verificar se completou algum objetivo
    UPDATE multiplayer_objective_progress mop
    SET is_completed = TRUE,
        completed_at = NOW()
    FROM multiplayer_objectives mo
    WHERE mop.objective_id = mo.id
      AND mop.participant_id = active_challenges.id
      AND mop.current_value >= mo.target_value
      AND mop.is_completed = FALSE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION update_multiplayer_score_on_checkin() SET search_path = public;

-- =============================================
-- VERIFICAÇÃO
-- =============================================
-- Execute após rodar o script para verificar:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name IN ('is_multiplayer_participant', 'update_daily_statistics', 'update_multiplayer_score_on_checkin');
