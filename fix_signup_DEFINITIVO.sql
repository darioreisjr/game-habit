-- ============================================
-- SOLUÇÃO DEFINITIVA - DESABILITA TRIGGER E USA CÓDIGO MANUAL
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================

-- PASSO 1: DESABILITAR a trigger que está causando o problema
-- Isso permite que o signup funcione sem depender da trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASSO 2: REMOVER a função problemática
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- PASSO 3: Garantir que as tabelas existem
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

-- PASSO 4: Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- PASSO 5: REMOVER TODAS as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.stats;
DROP POLICY IF EXISTS "Service role can insert stats" ON public.stats;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.stats;
DROP POLICY IF EXISTS "Allow service role to insert stats" ON public.stats;

-- Remove as policies novas caso ja existam
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

DROP POLICY IF EXISTS "Enable read access for own stats" ON public.stats;
DROP POLICY IF EXISTS "Enable insert access for own stats" ON public.stats;
DROP POLICY IF EXISTS "Enable update access for own stats" ON public.stats;

-- PASSO 6: Criar políticas MUITO PERMISSIVAS para profiles
-- Permite que usuários autenticados criem seus próprios perfis
CREATE POLICY "Enable read access for own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Acesso público para leitura (necessário para algumas features)
CREATE POLICY "Enable read access for all users"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- PASSO 7: Criar políticas MUITO PERMISSIVAS para stats
CREATE POLICY "Enable read access for own stats"
  ON public.stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for own stats"
  ON public.stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for own stats"
  ON public.stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- PASSO 8: Garantir permissões máximas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.stats TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- PASSO 9: Verificação
DO $$
DECLARE
  trigger_count INTEGER;
  profiles_count INTEGER;
  stats_count INTEGER;
BEGIN
  -- Verifica se a trigger foi removida
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created';

  -- Verifica se as tabelas existem
  SELECT COUNT(*) INTO profiles_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'profiles';

  SELECT COUNT(*) INTO stats_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'stats';

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'CONFIGURAÇÃO CONCLUÍDA!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Trigger removida: % (deve ser 0)', trigger_count;
  RAISE NOTICE 'Tabela profiles existe: % (deve ser 1)', profiles_count;
  RAISE NOTICE 'Tabela stats existe: % (deve ser 1)', stats_count;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Agora o signup vai funcionar via código JavaScript!';
  RAISE NOTICE 'O código vai criar profile e stats manualmente.';
  RAISE NOTICE '==============================================';
END $$;
