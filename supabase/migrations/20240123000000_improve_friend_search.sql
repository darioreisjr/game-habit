-- =============================================
-- MIGRAÇÃO: Melhorar busca de amigos com status de solicitação
-- =============================================

-- Dropar função antiga primeiro (necessário pois mudamos o tipo de retorno)
DROP FUNCTION IF EXISTS search_users(TEXT);

-- Criar função search_users com status da amizade
-- Status possíveis: 'none', 'pending_sent', 'pending_received', 'accepted'
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER,
  is_friend BOOLEAN,
  friend_code TEXT,
  friendship_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(s.level, 1) as level,
    -- is_friend: true apenas se status = 'accepted'
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted' AND
      ((f.requester_id = auth.uid() AND f.addressee_id = p.user_id) OR
       (f.addressee_id = auth.uid() AND f.requester_id = p.user_id))
    ) as is_friend,
    p.friend_code,
    -- friendship_status: status detalhado da relação
    COALESCE(
      (
        SELECT
          CASE
            WHEN f.status = 'accepted' THEN 'accepted'
            WHEN f.status = 'pending' AND f.requester_id = auth.uid() THEN 'pending_sent'
            WHEN f.status = 'pending' AND f.addressee_id = auth.uid() THEN 'pending_received'
            ELSE 'none'
          END
        FROM friendships f
        WHERE
          (f.requester_id = auth.uid() AND f.addressee_id = p.user_id) OR
          (f.addressee_id = auth.uid() AND f.requester_id = p.user_id)
        LIMIT 1
      ),
      'none'
    ) as friendship_status
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

-- Comentário da função
COMMENT ON FUNCTION search_users(TEXT) IS 'Busca usuários por nome, username ou código de amigo. Retorna status da amizade: none, pending_sent, pending_received, accepted';
