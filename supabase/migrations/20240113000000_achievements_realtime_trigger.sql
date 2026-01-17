-- Migration: Add trigger to check achievements after checkin
-- This enables real-time achievement unlocking

-- Function to check achievements after checkin (wrapper)
CREATE OR REPLACE FUNCTION public.check_achievements_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- Call check_achievements for the user
  PERFORM public.check_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check achievements after each checkin
DROP TRIGGER IF EXISTS on_checkin_check_achievements ON checkins;
CREATE TRIGGER on_checkin_check_achievements
  AFTER INSERT ON checkins
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_on_checkin();

-- Also check achievements after stats update (level up)
CREATE OR REPLACE FUNCTION public.check_achievements_on_level_up()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if level changed
  IF OLD.level IS DISTINCT FROM NEW.level THEN
    PERFORM public.check_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_stats_check_achievements ON stats;
CREATE TRIGGER on_stats_check_achievements
  AFTER UPDATE ON stats
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_on_level_up();

-- Check achievements after streak update
CREATE OR REPLACE FUNCTION public.check_achievements_on_streak_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if streak increased
  IF NEW.current_streak > COALESCE(OLD.current_streak, 0) THEN
    PERFORM public.check_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_streak_check_achievements ON streaks;
CREATE TRIGGER on_streak_check_achievements
  AFTER UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_on_streak_update();

-- Also trigger on streak insert (first time)
DROP TRIGGER IF EXISTS on_streak_insert_check_achievements ON streaks;
CREATE TRIGGER on_streak_insert_check_achievements
  AFTER INSERT ON streaks
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_on_checkin();

-- Enable realtime for user_achievements and stats tables (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE stats;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing function first (required to change return type)
DROP FUNCTION IF EXISTS public.check_achievements(UUID);

-- Update check_achievements to return the newly unlocked achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT, xp_reward INT, coin_reward INT) AS $$
DECLARE
  achievement RECORD;
  user_stats RECORD;
  user_streak RECORD;
  requirement JSONB;
  is_unlocked BOOLEAN;
  total_checkins_count INT;
  challenges_completed INT;
BEGIN
  -- Get user stats and streak
  SELECT * INTO user_stats FROM stats WHERE stats.user_id = p_user_id;
  SELECT * INTO user_streak FROM streaks WHERE streaks.user_id = p_user_id;

  -- Get total checkins count
  SELECT COUNT(*) INTO total_checkins_count FROM checkins WHERE checkins.user_id = p_user_id;

  -- Get completed challenges count
  SELECT COUNT(*) INTO challenges_completed
  FROM user_challenges
  WHERE user_challenges.user_id = p_user_id AND is_completed = TRUE;

  -- Loop through all achievements
  FOR achievement IN SELECT * FROM achievements LOOP
    -- Check if already unlocked
    IF EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = achievement.id
    ) THEN
      CONTINUE;
    END IF;

    requirement := achievement.requirement;
    is_unlocked := FALSE;

    -- Check based on category
    CASE achievement.category
      WHEN 'level' THEN
        IF user_stats IS NOT NULL AND user_stats.level >= COALESCE((requirement->>'level')::INT, 999999) THEN
          is_unlocked := TRUE;
        END IF;

      WHEN 'streak' THEN
        IF user_streak IS NOT NULL AND user_streak.current_streak >= COALESCE((requirement->>'streak')::INT, 999999) THEN
          is_unlocked := TRUE;
        END IF;

      WHEN 'habits' THEN
        IF total_checkins_count >= COALESCE((requirement->>'total_checkins')::INT, 999999) THEN
          is_unlocked := TRUE;
        END IF;

      WHEN 'challenges' THEN
        IF challenges_completed >= COALESCE((requirement->>'challenges_completed')::INT, 999999) THEN
          is_unlocked := TRUE;
        END IF;

      ELSE
        -- Special achievements need manual handling
        CONTINUE;
    END CASE;

    -- Unlock achievement and grant rewards
    IF is_unlocked THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement.id)
      ON CONFLICT DO NOTHING;

      -- Grant rewards
      UPDATE stats
      SET
        xp = stats.xp + achievement.xp_reward,
        coins = stats.coins + achievement.coin_reward,
        level = FLOOR((stats.xp + achievement.xp_reward) / 100) + 1,
        updated_at = NOW()
      WHERE stats.user_id = p_user_id;

      -- Return the unlocked achievement
      achievement_id := achievement.id;
      achievement_name := achievement.name;
      xp_reward := achievement.xp_reward;
      coin_reward := achievement.coin_reward;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
