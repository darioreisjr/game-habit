-- =============================================
-- VERSÃO 3: NOVOS POWER-UPS E ITENS ESPECIAIS
-- =============================================

-- Adicionar novos itens à loja
INSERT INTO shop_items (item_key, name, description, category, price, effect_type, effect_value, icon, is_available) VALUES
  -- Power-ups Novos
  ('mega_mushroom', 'Mega Mushroom', 'Triplica o XP ganho por 6 horas', 'powerup', 150, 'xp_boost', '{"multiplier": 3, "duration": 6}', '🍄', true),
  ('gold_flower', 'Gold Flower', 'Converte XP em moedas extras (1 XP = 2 moedas) por 24h', 'powerup', 200, 'coin_boost', '{"multiplier": 2, "duration": 24}', '🌻', true),
  ('blue_shell', 'Blue Shell', 'Dá um boost instantâneo de 500 XP', 'powerup', 100, 'xp_boost', '{"instant": 500}', '🐚', true),
  ('super_leaf', 'Super Leaf', 'Permite completar 3 hábitos retroativamente (até 7 dias atrás)', 'powerup', 250, 'redo_habit', '{"uses": 3, "days_back": 7}', '🍃', true),
  ('cape_feather', 'Cape Feather', 'Voa sobre 1 dia de falha sem perder streak', 'powerup', 180, 'streak_freeze', '{"days": 1}', '🪶', true),

  -- Boosts Especiais
  ('lucky_coin', 'Lucky Coin', '50% de chance de dobrar XP de cada hábito por 24h', 'boost', 120, 'xp_boost', '{"chance": 0.5, "multiplier": 2, "duration": 24}', '🪙', true),
  ('rainbow_star', 'Rainbow Star', 'Todos os multiplicadores ativos são duplicados por 2 horas', 'boost', 300, 'visual_effect', '{"multiplier": 2, "duration": 2}', '⭐', true),
  ('warp_pipe', 'Warp Pipe', 'Teleporta seu streak atual +3 dias', 'boost', 200, 'streak_freeze', '{"bonus_days": 3}', '🟢', true),

  -- Itens de Proteção
  ('shield_block', 'Shield Block', 'Protege contra perda de streak por 7 dias', 'powerup', 350, 'streak_freeze', '{"days": 7, "shield": true}', '🛡️', true),
  ('checkpoint_flag', 'Checkpoint Flag', 'Salva seu progresso atual e permite restaurar uma vez', 'powerup', 400, 'visual_effect', '{"type": "checkpoint", "restore": 1}', '🚩', true),

  -- Itens Raros
  ('golden_mushroom', 'Golden Mushroom', 'XP infinito por 1 hora (sem limite de ganhos)', 'powerup', 500, 'xp_boost', '{"multiplier": 99, "duration": 1}', '🏆', true),
  ('wing_cap', 'Wing Cap', 'Todos os hábitos valem o dobro de XP por 48h', 'powerup', 450, 'xp_boost', '{"multiplier": 2, "duration": 48}', '🧢', true),
  ('mystery_box', 'Mystery Box', 'Caixa misteriosa com item aleatório (comum a lendário)', 'boost', 150, 'visual_effect', '{"type": "random_reward"}', '📦', true),

  -- Itens Sociais
  ('friend_boost', 'Friend Boost', 'Você e um amigo ganham +50% XP por 24h', 'boost', 200, 'xp_boost', '{"multiplier": 1.5, "duration": 24, "friend_required": true}', '👥', true),
  ('team_power', 'Team Power', 'Todo seu time no desafio multiplayer ganha +25% XP', 'boost', 300, 'xp_boost', '{"multiplier": 1.25, "team_wide": true}', '🤝', true),

  -- Temas Premium Novos
  ('theme_galaxy', 'Tema Galaxy', 'Tema espacial com estrelas e planetas', 'theme', 500, 'visual_effect', '{"theme": "galaxy"}', '🌌', true),
  ('theme_neon', 'Tema Neon City', 'Tema cyberpunk com luzes neon', 'theme', 500, 'visual_effect', '{"theme": "neon"}', '🌃', true),
  ('theme_forest', 'Tema Forest', 'Tema da floresta encantada', 'theme', 500, 'visual_effect', '{"theme": "forest"}', '🌲', true),

  -- Cosméticos
  ('crown', 'Crown', 'Coroa dourada para o perfil', 'cosmetic', 1000, 'visual_effect', '{"cosmetic": "crown"}', '👑', true),
  ('champion_badge', 'Champion Badge', 'Badge de campeão para o perfil', 'cosmetic', 800, 'visual_effect', '{"cosmetic": "champion"}', '🏅', true),
  ('rainbow_trail', 'Rainbow Trail', 'Trilha arco-íris nas animações', 'cosmetic', 600, 'visual_effect', '{"cosmetic": "trail_rainbow"}', '🌈', true),
  ('fireworks', 'Fireworks', 'Fogos de artifício ao completar hábitos', 'cosmetic', 400, 'visual_effect', '{"cosmetic": "fireworks"}', '🎆', true),
  ('custom_avatar_frame', 'Custom Avatar Frame', 'Moldura personalizável para avatar', 'cosmetic', 750, 'visual_effect', '{"cosmetic": "avatar_frame"}', '🖼️', true)
ON CONFLICT (item_key) DO NOTHING;

-- Tabela de efeitos ativos combinados (para stackar múltiplos boosts)
CREATE TABLE IF NOT EXISTS active_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  effect_name TEXT NOT NULL,
  effect_type TEXT NOT NULL CHECK (effect_type IN ('xp_boost', 'coin_boost', 'streak_freeze', 'redo_habit', 'visual_effect')),
  multiplier DECIMAL(4,2) DEFAULT 1.0,
  stacks INTEGER DEFAULT 1,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source_item TEXT, -- item_key que originou o efeito
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_active_effects_user ON active_effects(user_id);
CREATE INDEX idx_active_effects_expires ON active_effects(expires_at);
CREATE INDEX idx_active_effects_type ON active_effects(effect_type);

-- Tabela de itens consumíveis no inventário
CREATE TABLE IF NOT EXISTS consumable_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Para itens temporários
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, item_key)
);

CREATE INDEX idx_consumable_inventory_user ON consumable_inventory(user_id);
CREATE INDEX idx_consumable_inventory_item ON consumable_inventory(item_key);

-- Tabela de cosméticos desbloqueados
CREATE TABLE IF NOT EXISTS unlocked_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_key TEXT NOT NULL,
  cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN ('avatar_frame', 'trail', 'badge', 'crown', 'particle_effect', 'sound_effect')),
  is_equipped BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cosmetic_key)
);

CREATE INDEX idx_unlocked_cosmetics_user ON unlocked_cosmetics(user_id);
CREATE INDEX idx_unlocked_cosmetics_equipped ON unlocked_cosmetics(user_id, is_equipped);

-- Tabela de histórico de uso de itens
CREATE TABLE IF NOT EXISTS item_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effect_result JSONB DEFAULT '{}', -- Resultado do uso (XP ganho, etc)
  context TEXT -- Onde foi usado: 'habit_completion', 'challenge', etc
);

CREATE INDEX idx_item_usage_user ON item_usage_history(user_id);
CREATE INDEX idx_item_usage_item ON item_usage_history(item_key);
CREATE INDEX idx_item_usage_date ON item_usage_history(used_at DESC);

-- Tabela de combos de itens (combinações especiais)
CREATE TABLE IF NOT EXISTS item_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  required_items TEXT[] NOT NULL,
  combo_effect JSONB NOT NULL,
  xp_bonus INTEGER DEFAULT 0,
  coin_bonus INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir combos especiais
INSERT INTO item_combos (name, description, required_items, combo_effect, xp_bonus, coin_bonus) VALUES
  ('Super Combo', 'Super Mushroom + Super Star ativo', ARRAY['mushroom', 'star'], '{"multiplier": 5, "duration": 4}', 1000, 50),
  ('Golden Rush', 'Gold Flower + Coin Boost ativo', ARRAY['gold_flower', 'coin_boost'], '{"coin_multiplier": 4, "duration": 12}', 500, 100),
  ('Invincible Streak', 'Shield Block + Fire Flower ativo', ARRAY['shield_block', 'flower'], '{"streak_protection": 10, "freeze_immunity": true}', 800, 0),
  ('Rainbow Power', 'Rainbow Star + Wing Cap ativo', ARRAY['rainbow_star', 'wing_cap'], '{"all_multipliers": 3, "duration": 3}', 1500, 75),
  ('Mystery Miracle', '3x Mystery Box abertos no mesmo dia', ARRAY['mystery_box', 'mystery_box', 'mystery_box'], '{"guaranteed_rare": true, "bonus_item": 1}', 2000, 200);

-- Tabela de checkpoints salvos
CREATE TABLE IF NOT EXISTS saved_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  xp BIGINT NOT NULL,
  coins INTEGER NOT NULL,
  current_streak INTEGER NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  can_restore BOOLEAN DEFAULT TRUE,
  restored_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, can_restore) -- Apenas um checkpoint restaurável por vez
);

CREATE INDEX idx_saved_checkpoints_user ON saved_checkpoints(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE active_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_checkpoints ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own effects"
  ON active_effects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own consumables"
  ON consumable_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cosmetics"
  ON unlocked_cosmetics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cosmetics"
  ON unlocked_cosmetics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their item usage history"
  ON item_usage_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Item combos are viewable by everyone"
  ON item_combos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own checkpoints"
  ON saved_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para calcular XP com todos os multiplicadores ativos
CREATE OR REPLACE FUNCTION calculate_xp_with_boosts(
  base_xp INTEGER,
  target_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_multiplier DECIMAL(10,2) := 1.0;
  effect RECORD;
  final_xp INTEGER;
BEGIN
  -- Somar todos os multiplicadores ativos
  FOR effect IN
    SELECT multiplier, effect_type, metadata
    FROM active_effects
    WHERE user_id = target_user_id
      AND effect_type = 'xp_boost'
      AND expires_at > NOW()
  LOOP
    -- Verificar lucky coin (chance de dobrar)
    IF effect.metadata->>'chance' IS NOT NULL THEN
      IF random() < (effect.metadata->>'chance')::DECIMAL THEN
        total_multiplier := total_multiplier * effect.multiplier;
      END IF;
    ELSE
      total_multiplier := total_multiplier * effect.multiplier;
    END IF;
  END LOOP;

  final_xp := (base_xp * total_multiplier)::INTEGER;
  RETURN final_xp;
END;
$$ LANGUAGE plpgsql;

-- Função para usar item consumível
CREATE OR REPLACE FUNCTION use_consumable_item(
  target_item_key TEXT,
  target_user_id UUID DEFAULT auth.uid(),
  usage_context TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  item_data shop_items%ROWTYPE;
  inventory_data consumable_inventory%ROWTYPE;
  result JSONB := '{}';
  effect_duration INTERVAL;
  expires_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar dados do item
  SELECT * INTO item_data FROM shop_items WHERE item_key = target_item_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  -- Verificar se tem o item no inventário
  SELECT * INTO inventory_data
  FROM consumable_inventory
  WHERE user_id = target_user_id AND item_key = target_item_key AND quantity > 0;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not in inventory');
  END IF;

  -- Processar efeito baseado no tipo
  CASE item_data.effect_type
    WHEN 'xp_boost' THEN
      -- Verificar se é boost instantâneo
      IF item_data.effect_value->>'instant' IS NOT NULL THEN
        UPDATE stats
        SET xp = xp + (item_data.effect_value->>'instant')::INTEGER
        WHERE user_id = target_user_id;

        result := jsonb_build_object(
          'success', true,
          'type', 'instant_xp',
          'value', item_data.effect_value->>'instant'
        );
      ELSE
        -- Adicionar efeito ativo
        effect_duration := make_interval(hours => (item_data.effect_value->>'duration')::INTEGER);
        expires_time := NOW() + effect_duration;

        INSERT INTO active_effects (user_id, effect_name, effect_type, multiplier, expires_at, source_item)
        VALUES (
          target_user_id,
          item_data.name,
          item_data.effect_type,
          (item_data.effect_value->>'multiplier')::DECIMAL,
          expires_time,
          target_item_key
        );

        result := jsonb_build_object(
          'success', true,
          'type', 'xp_boost',
          'multiplier', item_data.effect_value->>'multiplier',
          'expires_at', expires_time
        );
      END IF;

    WHEN 'streak_freeze' THEN
      -- Adicionar dias de proteção ao streak
      UPDATE streaks
      SET streak_freeze_until = GREATEST(
        COALESCE(streak_freeze_until, NOW()),
        NOW()
      ) + make_interval(days => (item_data.effect_value->>'days')::INTEGER)
      WHERE user_id = target_user_id;

      result := jsonb_build_object(
        'success', true,
        'type', 'streak_freeze',
        'days', item_data.effect_value->>'days'
      );

    WHEN 'visual_effect' THEN
      -- Processar efeitos especiais
      IF item_data.effect_value->>'type' = 'checkpoint' THEN
        -- Salvar checkpoint
        INSERT INTO saved_checkpoints (user_id, level, xp, coins, current_streak)
        SELECT user_id, level, xp, coins, current_streak
        FROM stats s
        JOIN streaks st ON s.user_id = st.user_id
        WHERE s.user_id = target_user_id;

        result := jsonb_build_object('success', true, 'type', 'checkpoint_saved');
      ELSIF item_data.effect_value->>'type' = 'random_reward' THEN
        -- Mystery box: item aleatório
        result := jsonb_build_object(
          'success', true,
          'type', 'mystery_box',
          'message', 'Open to see your reward!'
        );
      END IF;

    ELSE
      result := jsonb_build_object('success', false, 'error', 'Unknown effect type');
  END CASE;

  -- Decrementar quantidade no inventário
  UPDATE consumable_inventory
  SET quantity = quantity - 1
  WHERE user_id = target_user_id AND item_key = target_item_key;

  -- Remover se quantidade chegou a zero
  DELETE FROM consumable_inventory
  WHERE user_id = target_user_id AND item_key = target_item_key AND quantity <= 0;

  -- Registrar uso
  INSERT INTO item_usage_history (user_id, item_key, effect_result, context)
  VALUES (target_user_id, target_item_key, result, usage_context);

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar efeitos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_effects()
RETURNS void AS $$
BEGIN
  DELETE FROM active_effects WHERE expires_at < NOW();
  DELETE FROM consumable_inventory WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para adicionar item ao inventário após compra
CREATE OR REPLACE FUNCTION add_to_inventory_after_purchase()
RETURNS TRIGGER AS $$
DECLARE
  item_category TEXT;
BEGIN
  SELECT category INTO item_category FROM shop_items WHERE item_key = NEW.item_key;

  IF item_category IN ('powerup', 'boost') THEN
    INSERT INTO consumable_inventory (user_id, item_key, quantity)
    VALUES (NEW.user_id, NEW.item_key, NEW.quantity)
    ON CONFLICT (user_id, item_key)
    DO UPDATE SET quantity = consumable_inventory.quantity + NEW.quantity;
  ELSIF item_category = 'cosmetic' THEN
    INSERT INTO unlocked_cosmetics (user_id, cosmetic_key, cosmetic_type)
    VALUES (NEW.user_id, NEW.item_key, 'badge')
    ON CONFLICT (user_id, cosmetic_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_purchase_add_to_inventory
  AFTER INSERT ON purchase_history
  FOR EACH ROW
  EXECUTE FUNCTION add_to_inventory_after_purchase();

-- Comentários
COMMENT ON TABLE active_effects IS 'Efeitos ativos de power-ups e boosts stackáveis';
COMMENT ON TABLE consumable_inventory IS 'Inventário de itens consumíveis';
COMMENT ON TABLE unlocked_cosmetics IS 'Itens cosméticos desbloqueados pelo usuário';
COMMENT ON TABLE item_usage_history IS 'Histórico de uso de todos os itens';
COMMENT ON TABLE item_combos IS 'Combinações especiais de itens para bônus extras';
COMMENT ON TABLE saved_checkpoints IS 'Checkpoints salvos que podem ser restaurados';
