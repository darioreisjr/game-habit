-- Fix for "aggregate function calls cannot be nested" when inserting checkins
-- Run this in Supabase SQL Editor.

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

-- Allow inserts/updates on daily_statistics for the owner/definer or authenticated users
DROP POLICY IF EXISTS "Users can insert their daily statistics" ON daily_statistics;
DROP POLICY IF EXISTS "Users can update their daily statistics" ON daily_statistics;

CREATE POLICY "Users can insert their daily statistics"
  ON daily_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their daily statistics"
  ON daily_statistics FOR UPDATE
  USING (auth.uid() = user_id);
