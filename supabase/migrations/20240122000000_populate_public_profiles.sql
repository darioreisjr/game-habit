-- =============================================
-- MIGRAÇÃO: Popular public_profiles para usuários existentes
-- =============================================

-- Função para gerar código de amigo único (recria se não existir)
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN := TRUE;
BEGIN
  -- Gera códigos até encontrar um único
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Verifica se o código já existe
    SELECT EXISTS(SELECT 1 FROM public_profiles WHERE friend_code = result) INTO code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Popular public_profiles para todos os usuários que ainda não têm
INSERT INTO public_profiles (user_id, username, display_name, avatar_url, is_searchable, friend_code)
SELECT
  p.id as user_id,
  COALESCE(
    LOWER(REPLACE(REPLACE(p.name, ' ', '_'), '@', '')),
    'player_' || substr(p.id::TEXT, 1, 8)
  ) as username,
  COALESCE(p.name, 'Jogador') as display_name,
  p.avatar_url,
  TRUE as is_searchable,
  generate_friend_code() as friend_code
FROM profiles p
LEFT JOIN public_profiles pp ON p.id = pp.user_id
WHERE pp.user_id IS NULL;

-- Atualizar trigger para criar public_profile quando um novo usuário é criado
-- (Corrige o trigger existente para funcionar melhor)
CREATE OR REPLACE FUNCTION create_public_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_username TEXT;
BEGIN
  -- Pegar nome do perfil se existir
  SELECT name INTO user_name FROM profiles WHERE id = NEW.id;

  -- Gerar username baseado no nome ou email
  user_username := LOWER(REPLACE(REPLACE(
    COALESCE(user_name, split_part(NEW.email, '@', 1), 'player_' || substr(NEW.id::TEXT, 1, 8)),
    ' ', '_'
  ), '@', ''));

  -- Garantir username único adicionando sufixo se necessário
  WHILE EXISTS(SELECT 1 FROM public_profiles WHERE username = user_username) LOOP
    user_username := user_username || '_' || substr(gen_random_uuid()::TEXT, 1, 4);
  END LOOP;

  INSERT INTO public_profiles (user_id, username, display_name, is_searchable, friend_code)
  VALUES (
    NEW.id,
    user_username,
    COALESCE(user_name, 'Jogador'),
    TRUE,
    generate_friend_code()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropar trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS on_profile_created_public_profile ON profiles;

CREATE TRIGGER on_profile_created_public_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_public_profile_on_signup();

-- Também criar trigger para auth.users (caso o perfil seja criado depois)
DROP TRIGGER IF EXISTS on_auth_user_created_public_profile ON auth.users;

-- Índices adicionais para performance de busca
CREATE INDEX IF NOT EXISTS idx_public_profiles_display_name ON public_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_public_profiles_is_searchable ON public_profiles(is_searchable) WHERE is_searchable = TRUE;

-- Comentário da migration
COMMENT ON TABLE public_profiles IS 'Perfis públicos para busca de amigos. Populado automaticamente para todos os usuários.';
