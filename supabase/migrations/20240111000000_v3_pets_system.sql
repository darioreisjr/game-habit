-- =============================================
-- VERSÃO 3: SISTEMA DE PETS/MASCOTES
-- =============================================

-- Tabela de tipos de pets disponíveis
CREATE TABLE IF NOT EXISTS pet_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('yoshi', 'boo', 'koopa', 'toad', 'chain_chomp', 'lakitu', 'shy_guy', 'goomba', 'blooper')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  base_happiness INTEGER DEFAULT 50 CHECK (base_happiness >= 0 AND base_happiness <= 100),
  unlock_requirement JSONB DEFAULT '{}', -- {"level": 10} ou {"achievement": "key"}
  price INTEGER DEFAULT 0, -- Preço em moedas (0 = gratuito)
  animations JSONB DEFAULT '{}', -- URLs ou dados de animações
  colors JSONB DEFAULT '{}', -- Variações de cores disponíveis
  evolution_tree JSONB DEFAULT '[]', -- Árvore de evolução
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir pets iniciais
INSERT INTO pet_types (pet_key, name, description, species, rarity, base_happiness, price, unlock_requirement) VALUES
  ('yoshi_green', 'Yoshi Verde', 'O clássico dinossauro amigável', 'yoshi', 'common', 60, 0, '{}'),
  ('yoshi_red', 'Yoshi Vermelho', 'Yoshi aventureiro e corajoso', 'yoshi', 'rare', 65, 500, '{"level": 5}'),
  ('yoshi_blue', 'Yoshi Azul', 'Yoshi calmo e sábio', 'yoshi', 'rare', 65, 500, '{"level": 5}'),
  ('yoshi_yellow', 'Yoshi Amarelo', 'Yoshi energético e veloz', 'yoshi', 'rare', 65, 500, '{"level": 5}'),

  ('boo_white', 'Boo Fantasma', 'Tímido mas leal', 'boo', 'common', 50, 0, '{}'),
  ('boo_king', 'King Boo', 'O rei dos fantasmas', 'boo', 'legendary', 80, 2000, '{"level": 20}'),

  ('koopa_green', 'Koopa Verde', 'Tartaruga confiável', 'koopa', 'common', 55, 0, '{}'),
  ('koopa_red', 'Koopa Vermelho', 'Tartaruga determinada', 'koopa', 'rare', 60, 600, '{"level": 8}'),
  ('paratroopa', 'Paratroopa', 'Koopa com asas!', 'koopa', 'epic', 70, 1200, '{"level": 15}'),

  ('toad_red', 'Toad Vermelho', 'Cogumelo amigável', 'toad', 'common', 60, 0, '{}'),
  ('toad_blue', 'Toad Azul', 'Guardião da paz', 'toad', 'rare', 65, 700, '{"achievement": "perfect_week"}'),
  ('toadette', 'Toadette', 'Aventureira otimista', 'toad', 'epic', 75, 1500, '{"level": 12}'),

  ('chain_chomp', 'Chain Chomp', 'Feroz mas fiel', 'chain_chomp', 'epic', 70, 1000, '{"level": 10}'),
  ('lakitu', 'Lakitu', 'Viaja nas nuvens', 'lakitu', 'rare', 60, 800, '{"level": 7}'),
  ('shy_guy', 'Shy Guy', 'Misterioso e adorável', 'shy_guy', 'common', 55, 0, '{}')
ON CONFLICT (pet_key) DO NOTHING;

-- Tabela de pets do usuário
CREATE TABLE IF NOT EXISTS user_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_type_id UUID NOT NULL REFERENCES pet_types(id) ON DELETE CASCADE,
  nickname TEXT,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  xp INTEGER DEFAULT 0,
  happiness INTEGER DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
  hunger INTEGER DEFAULT 50 CHECK (hunger >= 0 AND hunger <= 100),
  energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
  is_active BOOLEAN DEFAULT FALSE, -- Pet ativo atual
  color_variant TEXT DEFAULT 'default',
  accessories JSONB DEFAULT '[]', -- Acessórios equipados
  personality_traits JSONB DEFAULT '[]', -- ['playful', 'lazy', 'energetic']
  adoption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_interactions INTEGER DEFAULT 0,
  evolution_stage INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, pet_type_id)
);

CREATE INDEX idx_user_pets_user ON user_pets(user_id);
CREATE INDEX idx_user_pets_active ON user_pets(user_id, is_active);

-- Tabela de interações com pets
CREATE TABLE IF NOT EXISTS pet_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'feed',
    'play',
    'pet',
    'train',
    'sleep',
    'bathe',
    'adventure',
    'gift'
  )),
  happiness_change INTEGER DEFAULT 0,
  hunger_change INTEGER DEFAULT 0,
  energy_change INTEGER DEFAULT 0,
  xp_gained INTEGER DEFAULT 0,
  item_used TEXT, -- item_key se usou algum item
  interaction_result JSONB DEFAULT '{}', -- Resultado especial
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pet_interactions_pet ON pet_interactions(pet_id, created_at DESC);
CREATE INDEX idx_pet_interactions_user ON pet_interactions(user_id);

-- Tabela de comidas para pets
CREATE TABLE IF NOT EXISTS pet_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  hunger_restore INTEGER NOT NULL CHECK (hunger_restore >= 0 AND hunger_restore <= 100),
  happiness_bonus INTEGER DEFAULT 0,
  energy_bonus INTEGER DEFAULT 0,
  xp_bonus INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  special_effects JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir comidas para pets
INSERT INTO pet_foods (food_key, name, description, icon, hunger_restore, happiness_bonus, energy_bonus, xp_bonus, price, rarity) VALUES
  ('mushroom_food', 'Cogumelo', 'Comida básica e nutritiva', '🍄', 20, 5, 0, 0, 10, 'common'),
  ('super_mushroom_food', 'Super Cogumelo', 'Cogumelo energético', '🍄', 40, 10, 20, 5, 25, 'rare'),
  ('fire_flower_food', 'Fire Flower', 'Comida picante que dá energia', '🌺', 30, 15, 30, 10, 40, 'epic'),
  ('star_candy', 'Star Candy', 'Doce especial que deixa super feliz', '⭐', 50, 30, 40, 20, 100, 'legendary'),
  ('coin_cookie', 'Coin Cookie', 'Biscoito em forma de moeda', '🍪', 25, 10, 10, 0, 15, 'common'),
  ('rainbow_cake', 'Rainbow Cake', 'Bolo mágico arco-íris', '🍰', 60, 25, 30, 15, 75, 'epic'),
  ('power_berry', 'Power Berry', 'Fruta poderosa', '🍓', 35, 15, 25, 8, 30, 'rare')
ON CONFLICT (food_key) DO NOTHING;

-- Tabela de acessórios para pets
CREATE TABLE IF NOT EXISTS pet_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessory_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('hat', 'glasses', 'necklace', 'wings', 'tail', 'body')),
  effect_type TEXT CHECK (effect_type IN ('happiness', 'xp_boost', 'energy', 'cosmetic')),
  effect_value INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_requirement JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir acessórios
INSERT INTO pet_accessories (accessory_key, name, description, icon, slot, effect_type, effect_value, price, rarity) VALUES
  ('mario_cap', 'Boné do Mario', 'Icônico boné vermelho', '🧢', 'hat', 'xp_boost', 10, 200, 'rare'),
  ('luigi_cap', 'Boné do Luigi', 'Boné verde estiloso', '🧢', 'hat', 'xp_boost', 10, 200, 'rare'),
  ('star_glasses', 'Óculos Estrela', 'Óculos brilhantes', '🕶️', 'glasses', 'cosmetic', 0, 150, 'common'),
  ('gold_chain', 'Corrente de Ouro', 'Puro estilo', '📿', 'necklace', 'happiness', 5, 300, 'epic'),
  ('angel_wings', 'Asas de Anjo', 'Asas místicas', '👼', 'wings', 'energy', 20, 500, 'legendary'),
  ('devil_tail', 'Rabo de Diabo', 'Travesso e poderoso', '😈', 'tail', 'xp_boost', 15, 400, 'epic'),
  ('hero_cape', 'Capa de Herói', 'Para pets corajosos', '🦸', 'body', 'xp_boost', 20, 600, 'legendary')
ON CONFLICT (accessory_key) DO NOTHING;

-- Tabela de conquistas de pets
CREATE TABLE IF NOT EXISTS pet_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  unlocks_accessory TEXT, -- accessory_key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir conquistas de pets
INSERT INTO pet_achievements (achievement_key, name, description, icon, requirement, xp_reward, coin_reward) VALUES
  ('first_pet', 'Primeiro Companheiro', 'Adote seu primeiro pet', '🐣', '{"type": "adopt", "count": 1}', 100, 20),
  ('pet_collector', 'Colecionador de Pets', 'Possua 5 pets diferentes', '🦎', '{"type": "own", "count": 5}', 500, 100),
  ('pet_master', 'Mestre dos Pets', 'Leve um pet ao nível 50', '👑', '{"type": "level", "value": 50}', 1000, 200),
  ('happy_owner', 'Dono Feliz', 'Mantenha um pet com 100 de felicidade por 7 dias', '😊', '{"type": "happiness", "value": 100, "days": 7}', 300, 60),
  ('pet_trainer', 'Treinador', 'Faça 100 interações com pets', '🎯', '{"type": "interactions", "count": 100}', 400, 80)
ON CONFLICT (achievement_key) DO NOTHING;

-- Tabela de aventuras (mini-jogos com pets)
CREATE TABLE IF NOT EXISTS pet_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  duration_minutes INTEGER NOT NULL,
  min_pet_level INTEGER DEFAULT 1,
  energy_cost INTEGER NOT NULL,
  possible_rewards JSONB NOT NULL, -- Array de possíveis recompensas
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir aventuras
INSERT INTO pet_adventures (adventure_key, name, description, difficulty, duration_minutes, min_pet_level, energy_cost, possible_rewards) VALUES
  ('forest_walk', 'Caminhada na Floresta', 'Uma aventura tranquila pela floresta', 'easy', 30, 1, 20,
   '[{"type": "coins", "min": 10, "max": 30}, {"type": "xp", "min": 20, "max": 50}]'),
  ('cave_exploration', 'Exploração de Caverna', 'Explore cavernas misteriosas', 'medium', 60, 5, 40,
   '[{"type": "coins", "min": 30, "max": 80}, {"type": "xp", "min": 50, "max": 120}, {"type": "item", "chance": 0.3}]'),
  ('castle_raid', 'Invasão ao Castelo', 'Desafie o castelo do Bowser!', 'hard', 120, 15, 60,
   '[{"type": "coins", "min": 100, "max": 200}, {"type": "xp", "min": 150, "max": 300}, {"type": "item", "chance": 0.5}]'),
  ('rainbow_road', 'Rainbow Road', 'A aventura mais desafiadora', 'expert', 180, 30, 80,
   '[{"type": "coins", "min": 200, "max": 500}, {"type": "xp", "min": 300, "max": 600}, {"type": "rare_item", "chance": 0.7}]')
ON CONFLICT (adventure_key) DO NOTHING;

-- Tabela de aventuras em andamento
CREATE TABLE IF NOT EXISTS active_pet_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  adventure_id UUID NOT NULL REFERENCES pet_adventures(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  rewards JSONB,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_active_adventures_user ON active_pet_adventures(user_id, is_completed);
CREATE INDEX idx_active_adventures_pet ON active_pet_adventures(pet_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE pet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_pet_adventures ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Pet types are viewable by everyone"
  ON pet_types FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their pets"
  ON user_pets FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their pet interactions"
  ON pet_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create pet interactions"
  ON pet_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pet foods are viewable by everyone"
  ON pet_foods FOR SELECT
  USING (true);

CREATE POLICY "Pet accessories are viewable by everyone"
  ON pet_accessories FOR SELECT
  USING (true);

CREATE POLICY "Pet achievements are viewable by everyone"
  ON pet_achievements FOR SELECT
  USING (true);

CREATE POLICY "Pet adventures are viewable by everyone"
  ON pet_adventures FOR SELECT
  USING (is_available = true);

CREATE POLICY "Users can manage their active adventures"
  ON active_pet_adventures FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para dar XP ao pet quando usuário completa hábito
CREATE OR REPLACE FUNCTION give_pet_xp_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  active_pet RECORD;
  xp_amount INTEGER;
  habit_diff habits.difficulty%TYPE;
BEGIN
  -- Buscar pet ativo
  SELECT * INTO active_pet
  FROM user_pets
  WHERE user_id = NEW.user_id AND is_active = TRUE
  LIMIT 1;

  IF FOUND THEN
    -- Buscar dificuldade do hábito
    SELECT difficulty INTO habit_diff FROM habits WHERE id = NEW.habit_id;

    -- Calcular XP para o pet (10% do XP do hábito)
    xp_amount := CASE habit_diff
      WHEN 'easy' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'hard' THEN 3
    END;

    -- Adicionar XP e felicidade ao pet
    UPDATE user_pets
    SET
      xp = xp + xp_amount,
      happiness = LEAST(100, happiness + 2),
      level = CASE
        WHEN (xp + xp_amount) >= (level * 100) THEN level + 1
        ELSE level
      END,
      total_interactions = total_interactions + 1,
      last_interaction = NOW()
    WHERE id = active_pet.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_checkin_give_pet_xp
  AFTER INSERT ON checkins
  FOR EACH ROW
  EXECUTE FUNCTION give_pet_xp_on_checkin();

-- Função para degradar stats do pet ao longo do tempo (fome/energia)
CREATE OR REPLACE FUNCTION degrade_pet_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_pets
  SET
    hunger = GREATEST(0, hunger - 5),
    energy = GREATEST(0, energy - 3),
    happiness = GREATEST(0, happiness - CASE
      WHEN hunger < 20 THEN 5
      WHEN energy < 20 THEN 3
      ELSE 1
    END)
  WHERE last_interaction < NOW() - INTERVAL '12 hours';
END;
$$ LANGUAGE plpgsql;

-- Função para interagir com pet
CREATE OR REPLACE FUNCTION interact_with_pet(
  target_pet_id UUID,
  interaction TEXT,
  item_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  pet_data user_pets%ROWTYPE;
  food_data pet_foods%ROWTYPE;
  result JSONB;
  happiness_change INTEGER := 0;
  hunger_change INTEGER := 0;
  energy_change INTEGER := 0;
  xp_gained INTEGER := 0;
BEGIN
  SELECT * INTO pet_data FROM user_pets WHERE id = target_pet_id;

  CASE interaction
    WHEN 'feed' THEN
      IF item_key IS NOT NULL THEN
        SELECT * INTO food_data FROM pet_foods WHERE food_key = item_key;
        hunger_change := food_data.hunger_restore;
        happiness_change := food_data.happiness_bonus;
        energy_change := food_data.energy_bonus;
        xp_gained := food_data.xp_bonus;
      END IF;

    WHEN 'play' THEN
      IF pet_data.energy >= 20 THEN
        happiness_change := 10;
        energy_change := -20;
        xp_gained := 5;
      ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Pet está muito cansado!');
      END IF;

    WHEN 'pet' THEN
      happiness_change := 5;
      xp_gained := 2;

    WHEN 'sleep' THEN
      energy_change := 50;
      hunger_change := -10;

    WHEN 'train' THEN
      IF pet_data.energy >= 30 THEN
        xp_gained := 15;
        energy_change := -30;
        happiness_change := 5;
      ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Pet precisa de energia!');
      END IF;
  END CASE;

  -- Aplicar mudanças
  UPDATE user_pets
  SET
    happiness = LEAST(100, GREATEST(0, happiness + happiness_change)),
    hunger = LEAST(100, GREATEST(0, hunger + hunger_change)),
    energy = LEAST(100, GREATEST(0, energy + energy_change)),
    xp = xp + xp_gained,
    level = CASE
      WHEN (xp + xp_gained) >= (level * 100) THEN level + 1
      ELSE level
    END,
    last_interaction = NOW(),
    total_interactions = total_interactions + 1
  WHERE id = target_pet_id;

  -- Registrar interação
  INSERT INTO pet_interactions (
    user_id, pet_id, interaction_type,
    happiness_change, hunger_change, energy_change, xp_gained, item_used
  ) VALUES (
    auth.uid(), target_pet_id, interaction,
    happiness_change, hunger_change, energy_change, xp_gained, item_key
  );

  result := jsonb_build_object(
    'success', true,
    'happiness_change', happiness_change,
    'hunger_change', hunger_change,
    'energy_change', energy_change,
    'xp_gained', xp_gained
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE pet_types IS 'Tipos de pets disponíveis para adoção';
COMMENT ON TABLE user_pets IS 'Pets do usuário com stats e personalização';
COMMENT ON TABLE pet_interactions IS 'Histórico de interações com pets';
COMMENT ON TABLE pet_foods IS 'Comidas disponíveis para alimentar pets';
COMMENT ON TABLE pet_accessories IS 'Acessórios cosméticos para pets';
COMMENT ON TABLE pet_achievements IS 'Conquistas relacionadas a pets';
COMMENT ON TABLE pet_adventures IS 'Aventuras/mini-jogos com pets';
COMMENT ON TABLE active_pet_adventures IS 'Aventuras em andamento';
