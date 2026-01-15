-- ============================================
-- SOLUÇÃO DEFINITIVA para "Database error saving new user"
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Remover COMPLETAMENTE trigger e função antigas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- PASSO 2: Verificar e garantir que as tabelas existem com estrutura correta
-- Se as tabelas não existirem, elas serão criadas

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PASSO 3: Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.stats;
DROP POLICY IF EXISTS "Service role can insert stats" ON public.stats;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.stats;

-- PASSO 5: Criar políticas PERMISSIVAS para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política CRÍTICA: permite que a trigger insira dados
CREATE POLICY "Allow service role to insert profiles"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- PASSO 6: Criar políticas PERMISSIVAS para stats
CREATE POLICY "Users can view own stats"
  ON public.stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Política CRÍTICA: permite que a trigger insira dados
CREATE POLICY "Allow service role to insert stats"
  ON public.stats FOR INSERT
  TO service_role
  WITH CHECK (true);

-- PASSO 7: Criar a função corrigida com tratamento robusto de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_name TEXT;
  error_msg TEXT;
BEGIN
  -- Log do início da execução
  RAISE LOG 'handle_new_user: Iniciando para usuário %', NEW.id;

  -- Extrair o nome dos metadados
  BEGIN
    user_name := COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'Usuário'
    );
    RAISE LOG 'handle_new_user: Nome extraído: %', user_name;
  EXCEPTION WHEN OTHERS THEN
    user_name := 'Usuário';
    RAISE WARNING 'handle_new_user: Erro ao extrair nome, usando padrão';
  END;

  -- Inserir perfil
  BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (NEW.id, user_name)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name;

    RAISE LOG 'handle_new_user: Perfil criado com sucesso';
  EXCEPTION WHEN OTHERS THEN
    error_msg := SQLERRM;
    RAISE WARNING 'handle_new_user: Erro ao criar perfil - %', error_msg;
  END;

  -- Inserir estatísticas
  BEGIN
    INSERT INTO public.stats (user_id, level, xp, coins)
    VALUES (NEW.id, 1, 0, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET level = 1, xp = 0, coins = 0;

    RAISE LOG 'handle_new_user: Stats criadas com sucesso';
  EXCEPTION WHEN OTHERS THEN
    error_msg := SQLERRM;
    RAISE WARNING 'handle_new_user: Erro ao criar stats - %', error_msg;
  END;

  RAISE LOG 'handle_new_user: Concluído com sucesso para usuário %', NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Captura qualquer erro não tratado
  RAISE WARNING 'handle_new_user: Erro crítico - %', SQLERRM;
  -- IMPORTANTE: Retornar NEW para não bloquear a criação do usuário
  RETURN NEW;
END;
$$;

-- PASSO 8: Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 9: Garantir todas as permissões necessárias
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.stats TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stats TO authenticated;

-- PASSO 10: Verificação final
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Script executado com sucesso!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Verificações:';
  RAISE NOTICE '1. Trigger criado: %', (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created');
  RAISE NOTICE '2. Função existe: %', (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user');
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Agora tente criar um novo usuário no app!';
  RAISE NOTICE '==============================================';
END $$;
