-- Fix infinite recursion in RLS policy for multiplayer_participants
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.is_multiplayer_participant(challenge_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.multiplayer_participants
    WHERE challenge_id = challenge_uuid
      AND user_id = auth.uid()
  );
$$;

ALTER FUNCTION public.is_multiplayer_participant(UUID) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.is_multiplayer_participant(UUID) TO authenticated;

DROP POLICY IF EXISTS "Participants can view challenge participants" ON multiplayer_participants;

CREATE POLICY "Participants can view challenge participants"
  ON multiplayer_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_challenges mc
      WHERE mc.id = challenge_id
        AND (
          mc.is_private = FALSE
          OR public.is_multiplayer_participant(mc.id)
        )
    )
  );
