-- Migration for Themes and User Preferences - Version 2

-- Create user_preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_theme TEXT NOT NULL DEFAULT 'default',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_time TIME DEFAULT '09:00:00',
  notification_days INT[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create themes table (available themes configuration)
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  requires_item TEXT, -- Reference to shop_items.item_key
  colors JSONB NOT NULL, -- Color scheme
  assets JSONB, -- Custom images/icons
  preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table (scheduled notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'achievement', 'challenge', 'streak', 'social')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB, -- Additional data for the notification
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_preferences_theme ON user_preferences(active_theme);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for, sent_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for themes (everyone can view)
CREATE POLICY "Anyone can view themes"
  ON themes FOR SELECT
  USING (TRUE);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create default preferences on user signup
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));

  INSERT INTO public.stats (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change theme (check if user owns it)
CREATE OR REPLACE FUNCTION public.change_theme(
  p_user_id UUID,
  p_theme_key TEXT
)
RETURNS JSONB AS $$
DECLARE
  theme RECORD;
BEGIN
  -- Get theme details
  SELECT * INTO theme FROM themes WHERE theme_key = p_theme_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Theme not found');
  END IF;

  -- Check if theme is premium and requires ownership
  IF theme.is_premium AND theme.requires_item IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM inventory
      WHERE user_id = p_user_id AND item_key = theme.requires_item
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Theme not unlocked');
    END IF;
  END IF;

  -- Update user preference
  UPDATE user_preferences
  SET active_theme = p_theme_key, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'theme_key', p_theme_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create smart notification based on user habits
CREATE OR REPLACE FUNCTION public.create_habit_reminder(
  p_user_id UUID,
  p_habit_id UUID,
  p_scheduled_for TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  habit RECORD;
  notification_id UUID;
BEGIN
  -- Get habit details
  SELECT h.name, a.name as area_name
  INTO habit
  FROM habits h
  LEFT JOIN areas a ON a.id = h.area_id
  WHERE h.id = p_habit_id AND h.user_id = p_user_id;

  -- Create notification
  INSERT INTO notifications (user_id, title, message, type, scheduled_for, data)
  VALUES (
    p_user_id,
    'Lembrete de Hábito',
    format('Não esqueça de completar: %s', habit.name),
    'reminder',
    p_scheduled_for,
    jsonb_build_object('habit_id', p_habit_id, 'area_name', habit.area_name)
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default themes
INSERT INTO themes (theme_key, name, description, is_premium, requires_item, colors) VALUES
('default', 'Classic Mario', 'The original Mario theme', false, NULL,
  '{"primary": "#E52521", "secondary": "#1E5BD8", "accent": "#F7C600", "background": "#F7F7F8"}'
),
('castle', 'Bowser''s Castle', 'Dark and mysterious castle theme', true, 'theme_castle',
  '{"primary": "#8B0000", "secondary": "#4B0082", "accent": "#FFD700", "background": "#2C2C2C"}'
),
('underwater', 'Underwater World', 'Dive into the ocean depths', true, 'theme_underwater',
  '{"primary": "#006994", "secondary": "#00CED1", "accent": "#20B2AA", "background": "#E0F7FA"}'
),
('sky', 'Cloud Kingdom', 'Float among the clouds', true, 'theme_sky',
  '{"primary": "#87CEEB", "secondary": "#1E90FF", "accent": "#FFD700", "background": "#F0F8FF"}'
);
