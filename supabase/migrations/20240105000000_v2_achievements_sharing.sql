-- Migration for Achievements and Sharing - Version 2

-- Create achievements table (available achievements)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'level', 'habits', 'challenges', 'special')),
  icon TEXT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0,
  coin_reward INT NOT NULL DEFAULT 0,
  requirement JSONB NOT NULL, -- Criteria to unlock
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_achievements table (unlocked achievements)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_showcased BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

-- Create shared_achievements table (publicly shared achievements)
CREATE TABLE shared_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_achievement_id UUID NOT NULL REFERENCES user_achievements(id) ON DELETE CASCADE,
  share_url TEXT NOT NULL UNIQUE,
  message TEXT,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create streaks table (enhanced streak tracking)
CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  streak_freeze_until DATE, -- From Fire Flower powerup
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_showcased ON user_achievements(user_id, is_showcased);
CREATE INDEX idx_shared_achievements_url ON shared_achievements(share_url);
CREATE INDEX idx_shared_achievements_user_id ON shared_achievements(user_id);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (TRUE);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for shared_achievements (anyone can view shared)
CREATE POLICY "Anyone can view shared achievements"
  ON shared_achievements FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own shared achievements"
  ON shared_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared achievements"
  ON shared_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for streaks
CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update streak on checkin
CREATE OR REPLACE FUNCTION public.update_streak_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  streak_record RECORD;
  days_difference INT;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record FROM streaks WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, current_streak, longest_streak, last_checkin_date)
    VALUES (NEW.user_id, 1, 1, NEW.date);
    RETURN NEW;
  END IF;

  -- Calculate days difference
  days_difference := NEW.date - streak_record.last_checkin_date;

  -- Update streak
  IF days_difference = 0 THEN
    -- Same day, do nothing
    RETURN NEW;
  ELSIF days_difference = 1 THEN
    -- Consecutive day, increment streak
    UPDATE streaks
    SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_checkin_date = NEW.date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF days_difference > 1 THEN
    -- Check if streak is frozen
    IF streak_record.streak_freeze_until IS NOT NULL AND NEW.date <= streak_record.streak_freeze_until THEN
      -- Streak is frozen, maintain it
      UPDATE streaks
      SET
        last_checkin_date = NEW.date,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Streak broken, reset
      UPDATE streaks
      SET
        current_streak = 1,
        last_checkin_date = NEW.date,
        streak_freeze_until = NULL,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak on checkin
CREATE TRIGGER on_checkin_update_streak
  AFTER INSERT ON checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_streak_on_checkin();

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  achievement RECORD;
  user_stats RECORD;
  user_streak RECORD;
  requirement JSONB;
  is_unlocked BOOLEAN;
BEGIN
  -- Get user stats and streak
  SELECT * INTO user_stats FROM stats WHERE user_id = p_user_id;
  SELECT * INTO user_streak FROM streaks WHERE user_id = p_user_id;

  -- Loop through all achievements
  FOR achievement IN SELECT * FROM achievements LOOP
    -- Check if already unlocked
    IF EXISTS (
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement.id
    ) THEN
      CONTINUE;
    END IF;

    requirement := achievement.requirement;
    is_unlocked := FALSE;

    -- Check based on category
    CASE achievement.category
      WHEN 'level' THEN
        IF user_stats.level >= (requirement->>'level')::INT THEN
          is_unlocked := TRUE;
        END IF;

      WHEN 'streak' THEN
        IF user_streak.current_streak >= (requirement->>'streak')::INT THEN
          is_unlocked := TRUE;
        END IF;

      WHEN 'habits' THEN
        IF (SELECT COUNT(*) FROM checkins WHERE user_id = p_user_id) >= (requirement->>'total_checkins')::INT THEN
          is_unlocked := TRUE;
        END IF;

      ELSE
        -- Other categories can be checked manually
        CONTINUE;
    END CASE;

    -- Unlock achievement
    IF is_unlocked THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement.id);

      -- Grant rewards
      UPDATE stats
      SET
        xp = xp + achievement.xp_reward,
        coins = coins + achievement.coin_reward,
        level = FLOOR((xp + achievement.xp_reward) / 100) + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;

      -- Create notification
      INSERT INTO notifications (user_id, title, message, type, scheduled_for, data)
      VALUES (
        p_user_id,
        'Nova Conquista!',
        format('Você desbloqueou: %s', achievement.name),
        'achievement',
        NOW(),
        jsonb_build_object('achievement_id', achievement.id)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share an achievement
CREATE OR REPLACE FUNCTION public.share_achievement(
  p_user_id UUID,
  p_user_achievement_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  share_url TEXT;
BEGIN
  -- Generate unique share URL
  share_url := encode(gen_random_bytes(8), 'hex');

  -- Insert shared achievement
  INSERT INTO shared_achievements (user_id, user_achievement_id, share_url, message)
  VALUES (p_user_id, p_user_achievement_id, share_url, p_message);

  RETURN jsonb_build_object('success', true, 'share_url', share_url);
EXCEPTION
  WHEN unique_violation THEN
    -- Try again with new URL
    RETURN public.share_achievement(p_user_id, p_user_achievement_id, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample achievements
INSERT INTO achievements (achievement_key, name, description, category, icon, xp_reward, coin_reward, requirement, rarity) VALUES
-- Level achievements
('level_5', 'Rising Star', 'Reach level 5', 'level', '⭐', 50, 10, '{"level": 5}', 'common'),
('level_10', 'Power Player', 'Reach level 10', 'level', '🌟', 100, 20, '{"level": 10}', 'rare'),
('level_25', 'Habit Master', 'Reach level 25', 'level', '👑', 250, 50, '{"level": 25}', 'epic'),
('level_50', 'Legendary Hero', 'Reach level 50', 'level', '🏆', 500, 100, '{"level": 50}', 'legendary'),

-- Streak achievements
('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'streak', '🔥', 70, 15, '{"streak": 7}', 'common'),
('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'streak', '🔥🔥', 300, 60, '{"streak": 30}', 'rare'),
('streak_100', 'Century Champion', 'Maintain a 100-day streak', 'streak', '🔥🔥🔥', 1000, 200, '{"streak": 100}', 'epic'),
('streak_365', 'Year Legend', 'Maintain a 365-day streak', 'streak', '💎', 3650, 730, '{"streak": 365}', 'legendary'),

-- Habits achievements
('first_habit', 'Getting Started', 'Complete your first habit', 'habits', '✅', 10, 2, '{"total_checkins": 1}', 'common'),
('habits_50', 'Habit Enthusiast', 'Complete 50 habits', 'habits', '📊', 100, 20, '{"total_checkins": 50}', 'common'),
('habits_100', 'Century Club', 'Complete 100 habits', 'habits', '💯', 200, 40, '{"total_checkins": 100}', 'rare'),
('habits_500', 'Habit Hero', 'Complete 500 habits', 'habits', '🦸', 500, 100, '{"total_checkins": 500}', 'epic'),
('habits_1000', 'Unstoppable', 'Complete 1000 habits', 'habits', '⚡', 1000, 200, '{"total_checkins": 1000}', 'legendary'),

-- Special achievements
('perfect_week', 'Perfect Week', 'Complete all habits for 7 consecutive days', 'special', '🌈', 150, 30, '{"type": "perfect_week"}', 'rare'),
('early_bird', 'Early Bird', 'Complete 10 habits before 9 AM', 'special', '🐦', 100, 20, '{"type": "early_bird"}', 'rare'),
('night_owl', 'Night Owl', 'Complete 10 habits after 9 PM', 'special', '🦉', 100, 20, '{"type": "night_owl"}', 'rare');
