-- Migration for Shop and Power-ups - Version 2

-- Create shop_items table (available items in the shop)
CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('powerup', 'theme', 'boost', 'cosmetic')),
  price INT NOT NULL,
  effect_type TEXT, -- xp_boost, streak_freeze, double_coins, etc
  effect_value JSONB, -- { "multiplier": 2, "duration": 24 }
  icon TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_powerups table (active powerups for users)
CREATE TABLE user_powerups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create purchase_history table (track all purchases)
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_cost INT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shop_items_category ON shop_items(category);
CREATE INDEX idx_shop_items_available ON shop_items(is_available);
CREATE INDEX idx_user_powerups_user_id ON user_powerups(user_id);
CREATE INDEX idx_user_powerups_active ON user_powerups(user_id, is_active);
CREATE INDEX idx_purchase_history_user_id ON purchase_history(user_id);

-- Enable Row Level Security
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_items (everyone can view available items)
CREATE POLICY "Anyone can view available shop items"
  ON shop_items FOR SELECT
  USING (is_available = TRUE);

-- RLS Policies for user_powerups
CREATE POLICY "Users can view own powerups"
  ON user_powerups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own powerups"
  ON user_powerups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own powerups"
  ON user_powerups FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for purchase_history
CREATE POLICY "Users can view own purchase history"
  ON purchase_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchase history"
  ON purchase_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to purchase an item
CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id UUID,
  p_item_key TEXT,
  p_quantity INT DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  item RECORD;
  user_coins INT;
  total_cost INT;
  result JSONB;
BEGIN
  -- Get item details
  SELECT * INTO item FROM shop_items WHERE item_key = p_item_key AND is_available = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or not available');
  END IF;

  -- Calculate total cost
  total_cost := item.price * p_quantity;

  -- Get user coins
  SELECT coins INTO user_coins FROM stats WHERE user_id = p_user_id;

  -- Check if user has enough coins
  IF user_coins < total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  -- Deduct coins
  UPDATE stats
  SET coins = coins - total_cost, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add to inventory or activate powerup
  IF item.category = 'powerup' OR item.category = 'boost' THEN
    -- Add to inventory for later use
    INSERT INTO inventory (user_id, item_key, quantity)
    VALUES (p_user_id, p_item_key, p_quantity)
    ON CONFLICT (user_id, item_key)
    DO UPDATE SET quantity = inventory.quantity + p_quantity;
  ELSIF item.category = 'theme' THEN
    -- Unlock theme (add to inventory)
    INSERT INTO inventory (user_id, item_key, quantity)
    VALUES (p_user_id, p_item_key, 1)
    ON CONFLICT (user_id, item_key)
    DO NOTHING;
  END IF;

  -- Record purchase
  INSERT INTO purchase_history (user_id, item_key, quantity, total_cost)
  VALUES (p_user_id, p_item_key, p_quantity, total_cost);

  RETURN jsonb_build_object('success', true, 'item_key', p_item_key, 'quantity', p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate a powerup
CREATE OR REPLACE FUNCTION public.activate_powerup(
  p_user_id UUID,
  p_item_key TEXT
)
RETURNS JSONB AS $$
DECLARE
  item RECORD;
  duration_hours INT;
BEGIN
  -- Check if user has the item in inventory
  IF NOT EXISTS (
    SELECT 1 FROM inventory
    WHERE user_id = p_user_id AND item_key = p_item_key AND quantity > 0
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not in inventory');
  END IF;

  -- Get item details
  SELECT * INTO item FROM shop_items WHERE item_key = p_item_key;

  -- Get duration from effect_value
  duration_hours := COALESCE((item.effect_value->>'duration')::INT, 24);

  -- Activate powerup
  INSERT INTO user_powerups (user_id, item_key, expires_at)
  VALUES (p_user_id, p_item_key, NOW() + INTERVAL '1 hour' * duration_hours);

  -- Decrease inventory
  UPDATE inventory
  SET quantity = quantity - 1
  WHERE user_id = p_user_id AND item_key = p_item_key;

  -- Delete if quantity is 0
  DELETE FROM inventory
  WHERE user_id = p_user_id AND item_key = p_item_key AND quantity <= 0;

  RETURN jsonb_build_object('success', true, 'item_key', p_item_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and deactivate expired powerups
CREATE OR REPLACE FUNCTION public.deactivate_expired_powerups()
RETURNS void AS $$
BEGIN
  UPDATE user_powerups
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert shop items
INSERT INTO shop_items (item_key, name, description, category, price, effect_type, effect_value, icon) VALUES
-- Power-ups
('mushroom', 'Super Mushroom', 'Double XP for 24 hours', 'powerup', 50, 'xp_boost', '{"multiplier": 2, "duration": 24}', '🍄'),
('star', 'Super Star', 'Triple XP for 12 hours', 'powerup', 100, 'xp_boost', '{"multiplier": 3, "duration": 12}', '⭐'),
('flower', 'Fire Flower', 'Freeze your streak for 3 days', 'powerup', 80, 'streak_freeze', '{"duration": 72}', '🌺'),
('coin_boost', 'Coin Block', 'Double coins for 24 hours', 'boost', 60, 'coin_boost', '{"multiplier": 2, "duration": 24}', '💰'),
('1up', '1-UP Mushroom', 'Complete a missed habit from yesterday', 'powerup', 150, 'redo_habit', '{"days": 1}', '🟢'),

-- Themes
('theme_castle', 'Castle Theme', 'Transform your app into Bowser''s Castle', 'theme', 200, NULL, NULL, '🏰'),
('theme_underwater', 'Underwater Theme', 'Dive into the underwater world', 'theme', 200, NULL, NULL, '🌊'),
('theme_sky', 'Sky Theme', 'Reach for the clouds', 'theme', 200, NULL, NULL, '☁️'),

-- Cosmetics
('rainbow_road', 'Rainbow Trail', 'Add a rainbow effect to completed habits', 'cosmetic', 120, 'visual_effect', '{"effect": "rainbow"}', '🌈'),
('golden_frame', 'Golden Frame', 'Make your profile shine', 'cosmetic', 100, 'visual_effect', '{"effect": "golden_border"}', '✨');
