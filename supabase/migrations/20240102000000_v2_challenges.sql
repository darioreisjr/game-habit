-- Migration for Weekly Challenges (Boss Battles) - Version 2

-- Create challenges table (boss battles)
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  xp_reward INT NOT NULL,
  coin_reward INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  boss_type TEXT NOT NULL, -- bowser, koopa, goomba, etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_challenges table (user progress on challenges)
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  goal INT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Create challenge_requirements table (what habits count for the challenge)
CREATE TABLE challenge_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('any_habit', 'area_specific', 'difficulty_specific')),
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  count_required INT NOT NULL DEFAULT 1
);

-- Create indexes
CREATE INDEX idx_challenges_active ON challenges(is_active, start_date, end_date);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX idx_challenge_requirements_challenge_id ON challenge_requirements(challenge_id);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (everyone can view active challenges)
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (is_active = TRUE);

-- RLS Policies for user_challenges
CREATE POLICY "Users can view own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for challenge_requirements (everyone can view)
CREATE POLICY "Anyone can view challenge requirements"
  ON challenge_requirements FOR SELECT
  USING (TRUE);

-- Function to update challenge progress on checkin
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  active_challenge RECORD;
  requirement RECORD;
  habit_record RECORD;
BEGIN
  -- Get habit details
  SELECT h.area_id, h.difficulty
  INTO habit_record
  FROM habits h
  WHERE h.id = NEW.habit_id;

  -- Loop through active challenges for this user
  FOR active_challenge IN
    SELECT uc.id, uc.progress, uc.goal, uc.challenge_id
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = NEW.user_id
      AND uc.is_completed = FALSE
      AND c.is_active = TRUE
      AND c.start_date <= CURRENT_DATE
      AND c.end_date >= CURRENT_DATE
  LOOP
    -- Check if this checkin counts for the challenge
    FOR requirement IN
      SELECT cr.requirement_type, cr.area_id, cr.difficulty
      FROM challenge_requirements cr
      WHERE cr.challenge_id = active_challenge.challenge_id
    LOOP
      IF (requirement.requirement_type = 'any_habit') OR
         (requirement.requirement_type = 'area_specific' AND requirement.area_id = habit_record.area_id) OR
         (requirement.requirement_type = 'difficulty_specific' AND requirement.difficulty = habit_record.difficulty)
      THEN
        -- Update progress
        UPDATE user_challenges
        SET
          progress = LEAST(progress + 1, goal),
          is_completed = (progress + 1 >= goal),
          completed_at = CASE WHEN (progress + 1 >= goal) THEN NOW() ELSE completed_at END
        WHERE id = active_challenge.id;

        -- If completed, give rewards
        IF (active_challenge.progress + 1 >= active_challenge.goal) THEN
          UPDATE stats
          SET
            xp = xp + (SELECT xp_reward FROM challenges WHERE id = active_challenge.challenge_id),
            coins = coins + (SELECT coin_reward FROM challenges WHERE id = active_challenge.challenge_id),
            level = FLOOR((xp + (SELECT xp_reward FROM challenges WHERE id = active_challenge.challenge_id)) / 100) + 1,
            updated_at = NOW()
          WHERE user_id = NEW.user_id;
        END IF;

        EXIT; -- Only count once per challenge
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update challenge progress on checkin
CREATE TRIGGER on_checkin_update_challenge
  AFTER INSERT ON checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_progress();

-- Insert sample weekly challenges
INSERT INTO challenges (name, description, difficulty, xp_reward, coin_reward, start_date, end_date, boss_type) VALUES
('Bowser''s Castle Challenge', 'Complete 20 habits this week to defeat Bowser!', 'legendary', 500, 20, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 'bowser'),
('Koopa Troopa Rally', 'Complete 10 medium or hard habits', 'medium', 200, 8, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'koopa'),
('Goomba Stomp Week', 'Complete 15 easy habits this week', 'easy', 150, 5, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'goomba');

-- Insert requirements for challenges
INSERT INTO challenge_requirements (challenge_id, requirement_type, count_required)
SELECT id, 'any_habit', 20 FROM challenges WHERE name = 'Bowser''s Castle Challenge';

INSERT INTO challenge_requirements (challenge_id, requirement_type, difficulty, count_required)
SELECT id, 'difficulty_specific', 'medium', 10 FROM challenges WHERE name = 'Koopa Troopa Rally';

INSERT INTO challenge_requirements (challenge_id, requirement_type, difficulty, count_required)
SELECT id, 'difficulty_specific', 'easy', 15 FROM challenges WHERE name = 'Goomba Stomp Week';
