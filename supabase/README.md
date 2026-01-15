# Supabase Setup

## Passos para configurar o Supabase:

1. Crie um projeto no [Supabase](https://supabase.com)

2. No dashboard do seu projeto, vá em **SQL Editor** e execute o arquivo:
   - `migrations/20240101000000_initial_schema.sql`

3. Copie as credenciais do projeto:
   - Vá em **Settings** → **API**
   - Copie a **Project URL** e a **anon/public key**

4. Crie um arquivo `.env.local` na raiz do projeto:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   ```

5. Pronto! O banco de dados está configurado com:
   - Tabelas: profiles, areas, habits, checkins, inventory, stats
   - RLS (Row Level Security) habilitado
   - Triggers automáticos para criar perfil e calcular XP/moedas
