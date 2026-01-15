-- ============================================
-- Script para corrigir o erro "Database error saving new user"
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Remover trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- PASSO 2: Criar a função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Extrair o nome dos metadados do usuário
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário');

  -- Inserir perfil do usuário
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, user_name)
  ON CONFLICT (id) DO NOTHING;

  -- Inserir estatísticas iniciais do usuário
  INSERT INTO public.stats (user_id, level, xp, coins)
  VALUES (NEW.id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, apenas registra mas não falha a criação do usuário
    RAISE WARNING 'Erro ao criar perfil/stats para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 4: Garantir permissões necessárias
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- PASSO 5: Verificar se as políticas RLS estão corretas
-- Se necessário, recriar políticas para profiles e stats

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own stats" ON stats;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert stats" ON stats;

-- Política para permitir inserção de perfil próprio
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política para permitir inserção de stats próprias
CREATE POLICY "Users can insert own stats"
  ON stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas adicionais para service_role (usado pelas triggers)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert stats"
  ON stats FOR INSERT
  TO service_role
  WITH CHECK (true);

-- PASSO 6: Verificação
-- Execute isso após o script acima para confirmar que está funcionando:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
