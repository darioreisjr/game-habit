# 🚀 Guia de Instalação - Game Habit V2

Este guia mostra como instalar a Versão 2 do Game Habit com todas as novas funcionalidades.

## ✅ Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Git (opcional)

## 📦 Passo 1: Clone/Baixe o Projeto

```bash
git clone <seu-repositorio>
cd game-habit
```

## 📥 Passo 2: Instale as Dependências

```bash
npm install
```

## 🗄️ Passo 3: Configure o Supabase

### 3.1 Crie um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha um nome e senha
4. Aguarde a criação do projeto

### 3.2 Execute as Migrations

No Supabase Dashboard:

1. Vá para **SQL Editor**
2. Clique em **New Query**
3. Execute cada arquivo de migration **NA ORDEM**:

#### Migration 1: Schema Inicial (V1)
```sql
-- Cole o conteúdo de: supabase/migrations/20240101000000_initial_schema.sql
-- Execute com Ctrl+Enter ou clique em "Run"
```

#### Migration 2: Desafios Semanais
```sql
-- Cole o conteúdo de: supabase/migrations/20240102000000_v2_challenges.sql
-- Execute
```

#### Migration 3: Loja e Power-ups
```sql
-- Cole o conteúdo de: supabase/migrations/20240103000000_v2_shop.sql
-- Execute
```

#### Migration 4: Temas e Preferências
```sql
-- Cole o conteúdo de: supabase/migrations/20240104000000_v2_themes_preferences.sql
-- Execute
```

#### Migration 5: Conquistas e Compartilhamento
```sql
-- Cole o conteúdo de: supabase/migrations/20240105000000_v2_achievements_sharing.sql
-- Execute
```

### 3.3 Copie as Credenciais

1. Vá para **Settings** → **API**
2. Copie:
   - `Project URL`
   - `anon public` key

## 🔑 Passo 4: Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Exemplo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ▶️ Passo 5: Execute o Projeto

```bash
npm run dev
```

O app estará disponível em: [http://localhost:3000](http://localhost:3000)

## 🎮 Passo 6: Teste as Funcionalidades

### Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Clique em "Criar conta"
3. Preencha nome, email e senha
4. Complete o onboarding

### Teste a V1 (Base)

- ✅ Crie áreas (Saúde, Estudos, etc.)
- ✅ Crie hábitos
- ✅ Complete hábitos (ganhe XP e moedas)
- ✅ Veja seu progresso no calendário

### Teste a V2 (Novo!)

#### 🎯 Desafios
1. Vá para `/challenges`
2. Veja desafios ativos
3. Complete hábitos para progredir
4. Ganhe recompensas ao vencer

#### 🛍️ Loja
1. Vá para `/shop`
2. Veja itens disponíveis
3. Compre power-ups com moedas
4. Ative power-ups no inventário

#### 🏆 Conquistas
1. Vá para `/achievements`
2. Veja conquistas disponíveis
3. Complete requisitos para desbloquear
4. Compartilhe conquistas

#### 🎨 Temas
1. Vá para `/settings`
2. Veja temas disponíveis
3. Compre temas premium na loja
4. Aplique o tema desejado

#### 📱 Modo Offline
1. Desative a internet
2. Continue usando o app
3. Complete hábitos normalmente
4. Reative a internet (sincronização automática)

## 🐛 Solução de Problemas

### Erro: "Cannot connect to Supabase"

- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique sua conexão com internet

### Erro: "Table does not exist"

- Execute todas as migrations na ordem correta
- Verifique no Supabase SQL Editor se as tabelas foram criadas
- Use "Table Editor" para confirmar

### Migrations falhando

- Execute uma migration por vez
- Leia as mensagens de erro
- Algumas migrations dependem de outras (execute na ordem!)

### Power-ups não aparecem

- Verifique se a migration 3 (shop) foi executada
- Confirme que a tabela `shop_items` tem dados
- Recarregue a página

### Temas não funcionam

- Verifique se a migration 4 (themes) foi executada
- Confirme que você tem o tema desbloqueado
- Limpe o cache do navegador

## 📚 Recursos Adicionais

- **README.md** - Documentação completa
- **CHANGELOG_V2.md** - Todas as mudanças da V2
- **Supabase Docs** - [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs** - [nextjs.org/docs](https://nextjs.org/docs)

## 💡 Dicas

### Ganhe Moedas Rapidamente

- Complete hábitos difíceis (30 XP)
- Faça check-ins diários
- Complete desafios semanais
- A cada 50 XP você ganha 1 moeda

### Desbloqueie Conquistas

- Mantenha streaks longos (7, 30, 100 dias)
- Complete muitos hábitos (50, 100, 500)
- Alcance níveis altos (5, 10, 25)
- Complete tarefas especiais

### Use Power-ups Estrategicamente

- **Super Mushroom**: Use em dias com muitos hábitos
- **Fire Flower**: Proteja streaks longos
- **1-UP Mushroom**: Recupere dias perdidos importantes

## 🎉 Pronto!

Você agora tem o Game Habit V2 funcionando com todas as funcionalidades!

**Próximos passos:**
- Explore todas as páginas
- Complete desafios
- Compre itens na loja
- Desbloqueie conquistas
- Personalize com temas

---

**Problemas?** Abra uma issue no GitHub ou consulte a documentação.

**Divirta-se gamificando seus hábitos! 🎮**
