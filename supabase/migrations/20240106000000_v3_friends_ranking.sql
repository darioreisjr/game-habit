-- =============================================
-- VERSÃO 3: SISTEMA DE AMIGOS E RANKING
-- =============================================

-- Tabela de amizades
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Índices para performance
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Tabela de rankings globais
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('global_xp', 'global_level', 'global_streak', 'weekly_xp', 'monthly_xp', 'friends_xp')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leaderboard_type, period_start, period_end)
);

CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, period_start, period_end);

-- Tabela de posições no ranking
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

CREATE INDEX idx_leaderboard_entries_board ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX idx_leaderboard_entries_user ON leaderboard_entries(user_id);

-- Tabela de mensagens entre amigos
CREATE TABLE IF NOT EXISTS friend_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_friend_messages_sender ON friend_messages(sender_id);
CREATE INDEX idx_friend_messages_receiver ON friend_messages(receiver_id);
CREATE INDEX idx_friend_messages_read ON friend_messages(receiver_id, is_read);

-- Tabela de perfis públicos (para busca de amigos)
CREATE TABLE IF NOT EXISTS public_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_searchable BOOLEAN DEFAULT TRUE,
  friend_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_public_profiles_username ON public_profiles(username);
CREATE INDEX idx_public_profiles_friend_code ON public_profiles(friend_code);
CREATE INDEX idx_public_profiles_searchable ON public_profiles(is_searchable);

-- Tabela de atividades de amigos (feed)
CREATE TABLE IF NOT EXISTS friend_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('level_up', 'achievement', 'challenge_completed', 'streak_milestone', 'habit_completed')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_friend_activities_user ON friend_activities(user_id);
CREATE INDEX idx_friend_activities_type ON friend_activities(activity_type);
CREATE INDEX idx_friend_activities_created ON friend_activities(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para friendships
CREATE POLICY "Users can view their own friendship requests"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own friendship status"
  ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Políticas para leaderboards (público para leitura)
CREATE POLICY "Leaderboards are viewable by everyone"
  ON leaderboards FOR SELECT
  USING (true);

-- Políticas para leaderboard_entries (público para leitura)
CREATE POLICY "Leaderboard entries are viewable by everyone"
  ON leaderboard_entries FOR SELECT
  USING (true);

-- Políticas para friend_messages
CREATE POLICY "Users can view their own messages"
  ON friend_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to friends"
  ON friend_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted' AND
      ((requester_id = auth.uid() AND addressee_id = receiver_id) OR
       (addressee_id = auth.uid() AND requester_id = receiver_id))
    )
  );

CREATE POLICY "Users can update their received messages"
  ON friend_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Políticas para public_profiles
CREATE POLICY "Public profiles are searchable by everyone"
  ON public_profiles FOR SELECT
  USING (is_searchable = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own public profile"
  ON public_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public profile"
  ON public_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para friend_activities
CREATE POLICY "Users can view public activities from friends"
  ON friend_activities FOR SELECT
  USING (
    is_public = true AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted' AND
        ((requester_id = auth.uid() AND addressee_id = user_id) OR
         (addressee_id = auth.uid() AND requester_id = user_id))
      )
    )
  );

CREATE POLICY "Users can create their own activities"
  ON friend_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON friend_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para gerar código de amigo único
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Remove caracteres confusos
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar perfil público automaticamente
CREATE OR REPLACE FUNCTION create_public_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_profiles (user_id, username, display_name, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'user' || substr(NEW.id::TEXT, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Player'),
    generate_friend_code()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_public_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_public_profile();

-- Função para atualizar ranking global
CREATE OR REPLACE FUNCTION update_global_leaderboard()
RETURNS void AS $$
DECLARE
  board_id UUID;
  current_period_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  current_period_end DATE := (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
BEGIN
  -- Criar ou obter leaderboard da semana
  INSERT INTO leaderboards (leaderboard_type, period_start, period_end)
  VALUES ('weekly_xp', current_period_start, current_period_end)
  ON CONFLICT (leaderboard_type, period_start, period_end)
  DO UPDATE SET leaderboard_type = EXCLUDED.leaderboard_type
  RETURNING id INTO board_id;

  -- Deletar entradas antigas
  DELETE FROM leaderboard_entries WHERE leaderboard_id = board_id;

  -- Inserir novas entradas com ranking
  INSERT INTO leaderboard_entries (leaderboard_id, user_id, rank, score)
  SELECT
    board_id,
    user_id,
    ROW_NUMBER() OVER (ORDER BY xp DESC) as rank,
    xp
  FROM stats
  ORDER BY xp DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Função para criar atividade quando subir de nível
CREATE OR REPLACE FUNCTION create_level_up_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    INSERT INTO friend_activities (user_id, activity_type, title, description, metadata)
    VALUES (
      NEW.user_id,
      'level_up',
      'Subiu de nível!',
      'Alcançou o nível ' || NEW.level,
      jsonb_build_object('level', NEW.level, 'xp', NEW.xp)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_level_up_activity
  AFTER UPDATE ON stats
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION create_level_up_activity();

-- Função para criar atividade ao desbloquear conquista
CREATE OR REPLACE FUNCTION create_achievement_activity()
RETURNS TRIGGER AS $$
DECLARE
  achievement_data achievements%ROWTYPE;
BEGIN
  SELECT * INTO achievement_data FROM achievements WHERE id = NEW.achievement_id;

  INSERT INTO friend_activities (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.user_id,
    'achievement',
    'Nova conquista desbloqueada!',
    achievement_data.name,
    jsonb_build_object(
      'achievement_id', NEW.achievement_id,
      'achievement_name', achievement_data.name,
      'rarity', achievement_data.rarity
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_achievement_unlocked_activity
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_activity();

-- Função para obter amigos
CREATE OR REPLACE FUNCTION get_friends(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  friend_id UUID,
  friend_username TEXT,
  friend_display_name TEXT,
  friend_avatar_url TEXT,
  friend_level INTEGER,
  friend_xp BIGINT,
  friendship_since TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.requester_id = target_user_id THEN f.addressee_id
      ELSE f.requester_id
    END as friend_id,
    p.username as friend_username,
    p.display_name as friend_display_name,
    p.avatar_url as friend_avatar_url,
    s.level as friend_level,
    s.xp as friend_xp,
    f.created_at as friendship_since
  FROM friendships f
  JOIN public_profiles p ON (
    CASE
      WHEN f.requester_id = target_user_id THEN f.addressee_id
      ELSE f.requester_id
    END = p.user_id
  )
  LEFT JOIN stats s ON p.user_id = s.user_id
  WHERE
    f.status = 'accepted' AND
    (f.requester_id = target_user_id OR f.addressee_id = target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar usuários
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER,
  is_friend BOOLEAN,
  friend_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(s.level, 1) as level,
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted' AND
      ((f.requester_id = auth.uid() AND f.addressee_id = p.user_id) OR
       (f.addressee_id = auth.uid() AND f.requester_id = p.user_id))
    ) as is_friend,
    p.friend_code
  FROM public_profiles p
  LEFT JOIN stats s ON p.user_id = s.user_id
  WHERE
    p.is_searchable = true AND
    p.user_id != auth.uid() AND
    (
      p.username ILIKE '%' || search_term || '%' OR
      p.display_name ILIKE '%' || search_term || '%' OR
      p.friend_code = UPPER(search_term)
    )
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários das tabelas
COMMENT ON TABLE friendships IS 'Gerenciamento de amizades entre usuários';
COMMENT ON TABLE leaderboards IS 'Rankings globais e periódicos';
COMMENT ON TABLE leaderboard_entries IS 'Posições dos usuários nos rankings';
COMMENT ON TABLE friend_messages IS 'Mensagens entre amigos';
COMMENT ON TABLE public_profiles IS 'Perfis públicos para busca e socialização';
COMMENT ON TABLE friend_activities IS 'Feed de atividades dos amigos';
