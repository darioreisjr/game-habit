-- =============================================
-- VERSÃO 3: DESAFIOS MULTIPLAYER
-- =============================================

-- Tabela de desafios multiplayer
CREATE TABLE IF NOT EXISTS multiplayer_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('co-op', 'competitive', 'team_vs_team')),
  mode TEXT NOT NULL CHECK (mode IN ('speed_run', 'total_habits', 'streak_battle', 'boss_raid')),
  max_participants INTEGER NOT NULL DEFAULT 10,
  min_participants INTEGER NOT NULL DEFAULT 2,
  entry_cost INTEGER DEFAULT 0, -- Custo em moedas para entrar
  prize_pool INTEGER DEFAULT 0, -- Pool de prêmios em moedas
  xp_reward INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT FALSE,
  invite_code TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_multiplayer_challenges_active ON multiplayer_challenges(is_active, start_date, end_date);
CREATE INDEX idx_multiplayer_challenges_type ON multiplayer_challenges(challenge_type);
CREATE INDEX idx_multiplayer_challenges_creator ON multiplayer_challenges(created_by);
CREATE INDEX idx_multiplayer_challenges_invite ON multiplayer_challenges(invite_code);

-- Tabela de participantes em desafios multiplayer
CREATE TABLE IF NOT EXISTS multiplayer_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES multiplayer_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID, -- Para desafios em equipe
  score BIGINT DEFAULT 0,
  rank INTEGER,
  status TEXT NOT NULL CHECK (status IN ('invited', 'joined', 'active', 'completed', 'abandoned')) DEFAULT 'joined',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_multiplayer_participants_challenge ON multiplayer_participants(challenge_id);
CREATE INDEX idx_multiplayer_participants_user ON multiplayer_participants(user_id);
CREATE INDEX idx_multiplayer_participants_team ON multiplayer_participants(team_id);
CREATE INDEX idx_multiplayer_participants_status ON multiplayer_participants(status);

-- Tabela de equipes (para desafios team_vs_team)
CREATE TABLE IF NOT EXISTS multiplayer_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES multiplayer_challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  captain_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_score BIGINT DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_multiplayer_teams_challenge ON multiplayer_teams(challenge_id);
CREATE INDEX idx_multiplayer_teams_captain ON multiplayer_teams(captain_id);

-- Tabela de objetivos/metas do desafio
CREATE TABLE IF NOT EXISTS multiplayer_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES multiplayer_challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  objective_type TEXT NOT NULL CHECK (objective_type IN ('complete_habits', 'reach_streak', 'earn_xp', 'specific_area', 'time_based')),
  target_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_multiplayer_objectives_challenge ON multiplayer_objectives(challenge_id);

-- Tabela de progresso nos objetivos
CREATE TABLE IF NOT EXISTS multiplayer_objective_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES multiplayer_objectives(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES multiplayer_participants(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(objective_id, participant_id)
);

CREATE INDEX idx_multiplayer_objective_progress_objective ON multiplayer_objective_progress(objective_id);
CREATE INDEX idx_multiplayer_objective_progress_participant ON multiplayer_objective_progress(participant_id);

-- Tabela de convites para desafios privados
CREATE TABLE IF NOT EXISTS multiplayer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES multiplayer_challenges(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, invitee_id)
);

CREATE INDEX idx_multiplayer_invites_challenge ON multiplayer_invites(challenge_id);
CREATE INDEX idx_multiplayer_invites_invitee ON multiplayer_invites(invitee_id, status);

-- Tabela de chat do desafio
CREATE TABLE IF NOT EXISTS multiplayer_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES multiplayer_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_multiplayer_chat_challenge ON multiplayer_chat(challenge_id, created_at DESC);

-- Tabela de recompensas distribuídas
CREATE TABLE IF NOT EXISTS multiplayer_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES multiplayer_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  coins_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  items_earned JSONB DEFAULT '[]',
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_multiplayer_rewards_user ON multiplayer_rewards(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE multiplayer_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_objective_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas para multiplayer_challenges
CREATE POLICY "Public challenges are viewable by everyone"
  ON multiplayer_challenges FOR SELECT
  USING (is_private = FALSE OR created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM multiplayer_participants WHERE challenge_id = id AND user_id = auth.uid()));

CREATE POLICY "Users can create challenges"
  ON multiplayer_challenges FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their challenges"
  ON multiplayer_challenges FOR UPDATE
  USING (auth.uid() = created_by);

-- Políticas para multiplayer_participants
CREATE POLICY "Participants can view challenge participants"
  ON multiplayer_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_challenges mc
      WHERE mc.id = challenge_id AND
      (mc.is_private = FALSE OR
       EXISTS (SELECT 1 FROM multiplayer_participants WHERE challenge_id = mc.id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can join challenges"
  ON multiplayer_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON multiplayer_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para multiplayer_teams
CREATE POLICY "Teams are viewable by challenge participants"
  ON multiplayer_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_participants
      WHERE challenge_id = multiplayer_teams.challenge_id AND user_id = auth.uid()
    )
  );

-- Políticas para multiplayer_objectives
CREATE POLICY "Objectives are viewable by challenge participants"
  ON multiplayer_objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_participants
      WHERE challenge_id = multiplayer_objectives.challenge_id AND user_id = auth.uid()
    )
  );

-- Políticas para multiplayer_objective_progress
CREATE POLICY "Progress is viewable by challenge participants"
  ON multiplayer_objective_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_participants mp
      JOIN multiplayer_objectives mo ON mp.challenge_id = mo.challenge_id
      WHERE mo.id = objective_id AND mp.user_id = auth.uid()
    )
  );

-- Políticas para multiplayer_invites
CREATE POLICY "Users can view their invites"
  ON multiplayer_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Users can send invites to their friends"
  ON multiplayer_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update invite status"
  ON multiplayer_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

-- Políticas para multiplayer_chat
CREATE POLICY "Participants can view challenge chat"
  ON multiplayer_chat FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_participants
      WHERE challenge_id = multiplayer_chat.challenge_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON multiplayer_chat FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM multiplayer_participants
      WHERE challenge_id = multiplayer_chat.challenge_id AND user_id = auth.uid()
    )
  );

-- Políticas para multiplayer_rewards
CREATE POLICY "Users can view their own rewards"
  ON multiplayer_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para gerar código de convite único
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código de convite para desafios privados
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_private = TRUE AND NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_challenge_create_invite_code
  BEFORE INSERT ON multiplayer_challenges
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Função para atualizar score do participante quando completar hábito
CREATE OR REPLACE FUNCTION update_multiplayer_score_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  active_challenges RECORD;
  habit_data habits%ROWTYPE;
  points INTEGER;
BEGIN
  -- Buscar dados do hábito
  SELECT * INTO habit_data FROM habits WHERE id = NEW.habit_id;

  -- Calcular pontos baseado na dificuldade
  points := CASE habit_data.difficulty
    WHEN 'easy' THEN 10
    WHEN 'medium' THEN 20
    WHEN 'hard' THEN 30
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

CREATE TRIGGER on_checkin_update_multiplayer_score
  AFTER INSERT ON checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_multiplayer_score_on_checkin();

-- Função para atualizar ranking dos participantes
CREATE OR REPLACE FUNCTION update_challenge_rankings(challenge_uuid UUID)
RETURNS void AS $$
BEGIN
  WITH ranked_participants AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, joined_at ASC) as new_rank
    FROM multiplayer_participants
    WHERE challenge_id = challenge_uuid
  )
  UPDATE multiplayer_participants mp
  SET rank = rp.new_rank
  FROM ranked_participants rp
  WHERE mp.id = rp.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rankings automaticamente
CREATE OR REPLACE FUNCTION trigger_update_rankings()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_challenge_rankings(NEW.challenge_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_participant_score_change
  AFTER UPDATE OF score ON multiplayer_participants
  FOR EACH ROW
  WHEN (OLD.score IS DISTINCT FROM NEW.score)
  EXECUTE FUNCTION trigger_update_rankings();

-- Função para distribuir recompensas ao finalizar desafio
CREATE OR REPLACE FUNCTION distribute_challenge_rewards(challenge_uuid UUID)
RETURNS void AS $$
DECLARE
  challenge_data multiplayer_challenges%ROWTYPE;
  participant RECORD;
  total_participants INTEGER;
  prize_distribution INTEGER[];
BEGIN
  SELECT * INTO challenge_data FROM multiplayer_challenges WHERE id = challenge_uuid;
  SELECT COUNT(*) INTO total_participants FROM multiplayer_participants WHERE challenge_id = challenge_uuid;

  -- Definir distribuição de prêmios (top 3)
  prize_distribution := ARRAY[
    (challenge_data.prize_pool * 0.5)::INTEGER,  -- 1º lugar: 50%
    (challenge_data.prize_pool * 0.3)::INTEGER,  -- 2º lugar: 30%
    (challenge_data.prize_pool * 0.2)::INTEGER   -- 3º lugar: 20%
  ];

  -- Distribuir para cada participante
  FOR participant IN
    SELECT * FROM multiplayer_participants
    WHERE challenge_id = challenge_uuid
    ORDER BY rank
  LOOP
    -- Inserir recompensa
    INSERT INTO multiplayer_rewards (challenge_id, user_id, rank, coins_earned, xp_earned)
    VALUES (
      challenge_uuid,
      participant.user_id,
      participant.rank,
      CASE
        WHEN participant.rank <= 3 THEN prize_distribution[participant.rank]
        ELSE 0
      END,
      challenge_data.xp_reward
    );

    -- Adicionar moedas e XP ao usuário
    UPDATE stats
    SET
      coins = coins + CASE WHEN participant.rank <= 3 THEN prize_distribution[participant.rank] ELSE 0 END,
      xp = xp + challenge_data.xp_reward
    WHERE user_id = participant.user_id;

    -- Marcar participante como completado
    UPDATE multiplayer_participants
    SET status = 'completed', completed_at = NOW()
    WHERE id = participant.id;
  END LOOP;

  -- Desativar desafio
  UPDATE multiplayer_challenges
  SET is_active = FALSE
  WHERE id = challenge_uuid;
END;
$$ LANGUAGE plpgsql;

-- Função para aceitar convite e entrar no desafio
CREATE OR REPLACE FUNCTION accept_challenge_invite(invite_uuid UUID)
RETURNS void AS $$
DECLARE
  invite_data multiplayer_invites%ROWTYPE;
BEGIN
  SELECT * INTO invite_data FROM multiplayer_invites WHERE id = invite_uuid;

  -- Atualizar status do convite
  UPDATE multiplayer_invites
  SET status = 'accepted', responded_at = NOW()
  WHERE id = invite_uuid;

  -- Adicionar usuário como participante
  INSERT INTO multiplayer_participants (challenge_id, user_id, status)
  VALUES (invite_data.challenge_id, invite_data.invitee_id, 'active');

  -- Criar mensagem no chat
  INSERT INTO multiplayer_chat (challenge_id, user_id, message, is_system_message)
  SELECT
    invite_data.challenge_id,
    invite_data.invitee_id,
    pp.display_name || ' entrou no desafio!',
    TRUE
  FROM public_profiles pp
  WHERE pp.user_id = invite_data.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários das tabelas
COMMENT ON TABLE multiplayer_challenges IS 'Desafios multiplayer entre amigos';
COMMENT ON TABLE multiplayer_participants IS 'Participantes e scores dos desafios';
COMMENT ON TABLE multiplayer_teams IS 'Equipes para desafios team vs team';
COMMENT ON TABLE multiplayer_objectives IS 'Objetivos/metas dos desafios';
COMMENT ON TABLE multiplayer_objective_progress IS 'Progresso individual nos objetivos';
COMMENT ON TABLE multiplayer_invites IS 'Convites para desafios privados';
COMMENT ON TABLE multiplayer_chat IS 'Chat em tempo real dos desafios';
COMMENT ON TABLE multiplayer_rewards IS 'Recompensas distribuídas aos participantes';
