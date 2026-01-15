# 🚀 Guia de Instalação Rápida - Game Habit

## Passo a Passo

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em "New Project"
3. Preencha:
   - Nome do projeto: `game-habit` (ou o que preferir)
   - Database Password: escolha uma senha forte
   - Region: escolha a mais próxima de você

4. Aguarde a criação do projeto (1-2 minutos)

### 2. Executar a Migration do Banco

1. No dashboard do Supabase, vá em **SQL Editor** (ícone no menu lateral)
2. Clique em "New query"
3. Copie TODO o conteúdo do arquivo `supabase/migrations/20240101000000_initial_schema.sql`
4. Cole no editor
5. Clique em "Run" (ou pressione Ctrl+Enter)
6. Aguarde a execução (deve aparecer "Success" em verde)

### 3. Copiar as Credenciais

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie os valores de:
   - **Project URL** (algo como: https://abcdefghijk.supabase.co)
   - **anon/public key** (uma chave longa começando com "eyJ...")

### 4. Configurar as Variáveis de Ambiente

1. No VS Code, crie um arquivo chamado `.env.local` na raiz do projeto
2. Adicione as duas linhas abaixo, substituindo pelos seus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**IMPORTANTE**: Cole as credenciais EXATAMENTE como copiou do Supabase, sem espaços extras.

### 5. Instalar Dependências

No terminal do VS Code:

```bash
npm install
```

### 6. Executar o Projeto

```bash
npm run dev
```

### 7. Abrir no Navegador

Abra [http://localhost:3000](http://localhost:3000)

Você verá a tela de login. Clique em "Criar conta" para começar!

## 🎉 Pronto!

Agora você pode:

1. **Criar sua conta** - Use um email e senha (não precisa ser real em desenvolvimento)
2. **Fazer onboarding** - Escolha áreas e hábitos iniciais
3. **Explorar o app** - Navegue pelas abas: Mapa, Hábitos, Rotina, Perfil

## ⚠️ Problemas Comuns

### "Error: Invalid Supabase credentials"

- Verifique se copiou as credenciais corretamente
- Certifique-se de que o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor (`Ctrl+C` e depois `npm run dev` novamente)

### "relation 'profiles' does not exist"

- Você esqueceu de executar a migration no Supabase
- Volte ao passo 2 e execute o SQL

### Página em branco ou erro 500

- Abra o console do navegador (F12) para ver o erro
- Verifique se o Supabase está rodando (acesse o dashboard)

## 📱 Testando

Crie alguns hábitos e:

- ✅ Complete-os na página "Mapa"
- 📊 Veja seu progresso em "Rotina"
- 🏆 Acompanhe seu nível e XP em "Perfil"

## 🎮 Gamificação

- **Fácil**: +10 XP, +1 moeda a cada 50 XP
- **Médio**: +20 XP
- **Difícil**: +30 XP
- **Nível**: Sobe a cada 100 XP

Divirta-se! 🚀
