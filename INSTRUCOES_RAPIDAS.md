# 🚨 INSTRUÇÕES RÁPIDAS - Corrigir Erro de Signup

## ⚡ Execute AGORA no Supabase:

### 1️⃣ Abra o Supabase SQL Editor

https://supabase.com → Seu Projeto → SQL Editor → + New Query

### 2️⃣ Cole este script e execute:

Copie **TODO** o conteúdo do arquivo: **`fix_signup_DEFINITIVO.sql`**

### 3️⃣ Reinicie o Next.js

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

### 4️⃣ Teste criar uma conta

Abra o navegador com F12 (DevTools) para ver os logs detalhados.

---

## 🔍 O que foi feito?

### ❌ PROBLEMA ENCONTRADO:
A trigger `on_auth_user_created` estava **falhando e bloqueando** o signup completamente.

### ✅ SOLUÇÃO APLICADA:

1. **Script SQL** (`fix_signup_DEFINITIVO.sql`):
   - Remove completamente a trigger problemática
   - Garante que as políticas RLS estão corretas
   - Permite que o código JavaScript crie profile e stats

2. **Código Atualizado** (`app/signup/page.tsx`):
   - Cria o usuário via auth.signUp
   - Cria o profile manualmente
   - Cria as stats manualmente
   - Logs detalhados com emojis para debug fácil
   - Tratamento robusto de erros
   - Rollback automático se algo falhar

---

## 📊 Logs que você verá no console:

✅ **Sucesso:**
```
🚀 Iniciando processo de signup...
✅ Usuário criado: [id]
📝 Criando profile para: [id]
✅ Profile criado
📊 Criando stats para: [id]
✅ Stats criadas
🎉 Signup completo! Redirecionando...
```

❌ **Se houver erro:**
```
❌ Erro ao criar profile: [detalhes]
```

---

## ⚠️ IMPORTANTE:

**VOCÊ DEVE EXECUTAR O SCRIPT SQL** antes de testar!

O script remove a trigger que está causando o erro 500.

---

## 🆘 Se ainda não funcionar:

1. Verifique se executou o script SQL completo
2. Veja os logs no console do navegador (F12)
3. Verifique se as tabelas `profiles` e `stats` existem no Supabase
4. Confirme que o `.env.local` tem as credenciais corretas
