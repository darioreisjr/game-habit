# Como Corrigir o Erro "Database error saving new user"

## 🔍 Problema

Ao tentar criar uma nova conta no app, aparece o erro:
```
Database error saving new user
```

E no Network você pode ver um erro **500 Internal Server Error** com:
```json
{
  "code": "unexpected_failure",
  "message": "Database error saving new user"
}
```

## 🎯 Causa

O problema ocorre porque a função `handle_new_user()` que cria automaticamente o perfil e as estatísticas do usuário não tem as permissões corretas ou está falhando ao executar.

## ✅ Solução (2 Passos Obrigatórios)

### PASSO 1: Corrigir o Banco de Dados no Supabase ⚡ OBRIGATÓRIO

**Execute o script SQL corrigido:**

1. Abra o seu projeto no [Supabase Dashboard](https://supabase.com)
2. Vá em **SQL Editor**
3. Clique em **+ New query**
4. Copie e cole **TODO** o conteúdo do arquivo: **`fix_signup_error_v2.sql`**
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a mensagem de sucesso

### PASSO 2: Código já foi atualizado ✅

O código do signup foi automaticamente atualizado com um **fallback robusto** que:
- Cria o usuário normalmente
- Se a trigger do banco falhar, cria profile e stats manualmente
- Ignora erros de duplicação
- Garante que o usuário sempre seja criado corretamente

## 🔧 O que foi corrigido?

1. **Tratamento de erros**: A função agora não falha completamente se houver erro
2. **Permissões**: Adicionadas permissões corretas para service_role
3. **Políticas RLS**: Criadas políticas específicas para permitir inserção via trigger
4. **SECURITY DEFINER**: A função agora executa com privilégios do criador
5. **ON CONFLICT**: Evita duplicação em caso de re-execução

## 📝 Verificação

Após executar o script, você pode verificar se funcionou:

```sql
-- Verificar se o trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Verificar se a função tem SECURITY DEFINER
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
```

## 🧪 Testar

1. Tente criar uma nova conta no app
2. Se funcionar, você será redirecionado para `/onboarding`
3. Você pode verificar se o perfil foi criado no Supabase:
   - Vá em **Table Editor** → **profiles**
   - Vá em **Table Editor** → **stats**
   - Procure pelo seu usuário recém-criado

## 🚨 Se ainda não funcionar

Se o problema persistir, pode ser uma das seguintes causas:

### 1. Verificar variáveis de ambiente

Certifique-se que seu `.env.local` tem as configurações corretas:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 2. Confirmar que as tabelas existem

No SQL Editor do Supabase, execute:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'stats');
```

Você deve ver as duas tabelas listadas.

### 3. Verificar logs do Supabase

1. No Dashboard do Supabase, vá em **Logs**
2. Selecione **Postgres Logs**
3. Tente criar uma conta novamente
4. Veja se aparece algum erro específico nos logs

### 4. Recriar as tabelas (último recurso)

Se nada funcionar, você pode precisar executar novamente todas as migrations:

```sql
-- ⚠️ ATENÇÃO: Isso vai apagar TODOS os dados!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Depois, execute todas as migrations na ordem correta (ver README.md).

## 💡 Prevenção

Para evitar esse problema no futuro:

1. Sempre teste criação de usuários após fazer deploy de migrations
2. Configure alertas no Supabase para erros de triggers
3. Faça backup regular do banco de dados
4. Use um ambiente de staging antes de produção

## 📞 Suporte

Se o problema persistir após todas as tentativas:

1. Verifique os logs completos do Supabase
2. Compartilhe a mensagem de erro específica
3. Verifique se há problemas conhecidos no GitHub do projeto
