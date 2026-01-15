# 🎮 Game Habit

App de gerenciamento de hábitos gamificado com tema Mario, construído com Next.js 16 e Supabase.

## ✨ Funcionalidades

### MVP (Versão 1)

- ✅ **Autenticação completa** - Login, registro e recuperação de senha
- ✅ **Onboarding interativo** - Escolha áreas e hábitos iniciais
- ✅ **CRUD de Áreas** - Crie e organize suas áreas de vida
- ✅ **CRUD de Hábitos** - Gerencie hábitos com frequências personalizadas
- ✅ **Sistema de Gamificação**
  - XP e níveis (10/20/30 XP por dificuldade)
  - Moedas (1 moeda a cada 50 XP)
  - Streaks e combos
- ✅ **Mapa do Dia** - Visualize suas "fases" (hábitos) diárias
- ✅ **Check-in rápido** - Complete hábitos com um clique
- ✅ **Calendário semanal** - Acompanhe seu progresso
- ✅ **Perfil e Estatísticas** - Visualize seu progresso geral

## 🚀 Tecnologias

- **Framework**: Next.js 16.1 (App Router)
- **Linguagem**: TypeScript
- **Banco de dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilo**: Tailwind CSS 4
- **Fontes**: Inter, Space Grotesk, Press Start 2P
- **Ícones**: Lucide React
- **Animações**: Framer Motion
- **Utilitários**: date-fns, zod, clsx

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repo>
cd game-habit
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)

2. No SQL Editor, execute os arquivos de migration na ordem:
   ```
   supabase/migrations/20240101000000_initial_schema.sql
   supabase/migrations/20240102000000_v2_challenges.sql
   supabase/migrations/20240103000000_v2_shop.sql
   supabase/migrations/20240104000000_v2_themes_preferences.sql
   supabase/migrations/20240105000000_v2_achievements_sharing.sql
   supabase/migrations/20240106000000_v3_friends_ranking.sql
   supabase/migrations/20240107000000_v3_multiplayer_challenges.sql
   supabase/migrations/20240108000000_v3_new_powerups_items.sql
   supabase/migrations/20240109000000_v3_advanced_statistics.sql
   supabase/migrations/20240110000000_v3_wearables_integration.sql
   supabase/migrations/20240111000000_v3_pets_system.sql
   ```

3. Copie as credenciais em **Settings** → **API**

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 5. Execute o projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🗂️ Estrutura do Projeto

```
game-habit/
├── app/                      # App Router do Next.js
│   ├── (app)/               # Rotas protegidas
│   │   ├── page.tsx         # Mapa (home)
│   │   ├── habits/          # Gerenciamento de hábitos
│   │   ├── areas/           # Gerenciamento de áreas
│   │   ├── routine/         # Calendário semanal
│   │   ├── challenges/      # Desafios semanais (V2)
│   │   ├── shop/            # Loja de itens (V2)
│   │   ├── achievements/    # Conquistas (V2)
│   │   ├── friends/         # Sistema de amigos (V3)
│   │   ├── leaderboard/     # Ranking global (V3)
│   │   ├── pets/            # Sistema de pets (V3)
│   │   ├── stats/           # Estatísticas avançadas (V3)
│   │   ├── profile/         # Perfil do usuário
│   │   ├── settings/        # Configurações e temas (V2)
│   │   └── offline/         # Página offline (V2)
│   ├── login/               # Tela de login
│   ├── signup/              # Criar conta
│   ├── onboarding/          # Onboarding inicial
│   └── globals.css          # Estilos globais
├── components/              # Componentes React
│   ├── ui/                  # Componentes de UI base
│   ├── auth/                # Componentes de autenticação
│   ├── habits/              # Componentes de hábitos
│   ├── areas/               # Componentes de áreas
│   ├── map/                 # Componentes do mapa
│   ├── challenges/          # Componentes de desafios (V2)
│   ├── shop/                # Componentes da loja (V2)
│   ├── achievements/        # Componentes de conquistas (V2)
│   └── navigation.tsx       # Navegação principal
├── lib/                     # Utilitários e helpers
│   ├── supabase/           # Cliente Supabase
│   ├── service-worker.ts   # Utilities para PWA (V2)
│   └── utils.ts            # Funções auxiliares
├── types/                   # Tipos TypeScript
│   └── database.types.ts   # Tipos do banco (V1 + V2)
├── public/                  # Arquivos públicos
│   ├── service-worker.js   # Service Worker para offline (V2)
│   └── manifest.json       # Web App Manifest (V2)
└── supabase/               # Migrations e configuração
    └── migrations/
        ├── 20240101000000_initial_schema.sql
        ├── 20240102000000_v2_challenges.sql
        ├── 20240103000000_v2_shop.sql
        ├── 20240104000000_v2_themes_preferences.sql
        └── 20240105000000_v2_achievements_sharing.sql
```

## 🎨 Sistema de Design

### Cores

- **Mario Red**: #E52521 (principal)
- **Mario Blue**: #1E5BD8
- **Mario Yellow**: #F7C600 (moedas)
- **Mario Green**: #23C55E (sucesso)
- **Background Light**: #F7F7F8
- **Text Primary**: #111827
- **Text Secondary**: #6B7280
- **Border**: #E5E7EB

### Tipografia

- **Display** (títulos): Space Grotesk
- **Body** (texto): Inter
- **Pixel** (detalhes): Press Start 2P

### Componentes

- Cards com `border-radius: 16px`
- Transições de 120-180ms
- Sombras leves
- Feedback visual imediato

## 🎮 Sistema de Gamificação

### XP e Níveis

- **Fácil**: +10 XP
- **Médio**: +20 XP
- **Difícil**: +30 XP
- **Nível**: 100 XP por nível

### Moedas

- 1 moeda a cada 50 XP acumulados
- Calculado automaticamente no banco

### Streaks

- Contador de dias consecutivos
- Visualização no calendário
- Badge com ícone de fogo 🔥

## 🗄️ Banco de Dados

### Tabelas Principais (V1)

- **profiles** - Informações do usuário
- **areas** - Áreas de vida (Saúde, Estudos, etc.)
- **habits** - Hábitos configurados
- **checkins** - Registro de conclusões
- **stats** - XP, nível e moedas
- **inventory** - Itens do usuário

### Novas Tabelas (V2)

- **challenges** - Desafios semanais (chefes)
- **user_challenges** - Progresso dos usuários nos desafios
- **challenge_requirements** - Requisitos para completar desafios
- **shop_items** - Itens disponíveis na loja
- **user_powerups** - Power-ups ativos do usuário
- **purchase_history** - Histórico de compras
- **themes** - Temas visuais disponíveis
- **user_preferences** - Preferências e configurações do usuário
- **notifications** - Notificações agendadas
- **achievements** - Conquistas disponíveis
- **user_achievements** - Conquistas desbloqueadas
- **shared_achievements** - Conquistas compartilhadas publicamente
- **streaks** - Rastreamento avançado de streaks

### Novas Tabelas (V3)

**Social e Amigos:**
- **friendships** - Amizades entre usuários
- **public_profiles** - Perfis públicos para busca
- **friend_activities** - Feed de atividades
- **friend_messages** - Mensagens entre amigos
- **leaderboards** - Rankings globais e periódicos
- **leaderboard_entries** - Entradas dos rankings

**Multiplayer:**
- **multiplayer_challenges** - Desafios multiplayer
- **multiplayer_participants** - Participantes dos desafios
- **multiplayer_teams** - Times para team vs team
- **multiplayer_objectives** - Objetivos dos desafios
- **multiplayer_invites** - Convites para desafios
- **multiplayer_chat** - Chat dos desafios
- **multiplayer_rewards** - Recompensas distribuídas

**Items e Power-ups:**
- **active_effects** - Efeitos ativos stackáveis
- **consumable_inventory** - Inventário de consumíveis
- **unlocked_cosmetics** - Cosméticos desbloqueados
- **item_usage_history** - Histórico de uso
- **item_combos** - Combos especiais de itens
- **saved_checkpoints** - Checkpoints restauráveis

**Estatísticas:**
- **daily_statistics** - Estatísticas diárias
- **weekly_statistics** - Estatísticas semanais
- **monthly_statistics** - Estatísticas mensais
- **habit_analytics** - Análise por hábito
- **user_insights** - Insights personalizados
- **personal_goals** - Metas customizáveis
- **user_benchmarks** - Comparações com médias
- **behavior_events** - Eventos de comportamento

**Wearables:**
- **wearable_connections** - Conexões com dispositivos
- **wearable_data** - Dados sincronizados
- **wearable_habit_mappings** - Mapeamento para hábitos
- **fitness_goals** - Metas fitness
- **fitness_achievements** - Conquistas fitness
- **sync_history** - Histórico de sincronizações

**Pets:**
- **pet_types** - Tipos de pets disponíveis
- **user_pets** - Pets do usuário
- **pet_interactions** - Interações com pets
- **pet_foods** - Comidas para pets
- **pet_accessories** - Acessórios cosméticos
- **pet_achievements** - Conquistas de pets
- **pet_adventures** - Aventuras disponíveis
- **active_pet_adventures** - Aventuras em andamento

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Todas as queries filtradas por `user_id`
- Triggers automáticos para:
  - Calcular XP e moedas
  - Atualizar progresso de desafios
  - Gerenciar streaks
  - Verificar conquistas desbloqueadas

### Versão 2 (Implementada) ✨

- ✅ **Desafios Semanais (Chefes)** - Enfrente Bowser, Koopa e outros vilões
  - Desafios com metas semanais
  - Progresso automático ao completar hábitos
  - Recompensas de XP e moedas
  - Sistema de dificuldade (easy, medium, hard, legendary)

- ✅ **Loja Completa** - Compre power-ups e itens especiais
  - Super Mushroom (2x XP por 24h)
  - Super Star (3x XP por 12h)
  - Fire Flower (Congela streak por 3 dias)
  - Coin Boost (2x moedas por 24h)
  - 1-UP Mushroom (Refazer hábito perdido)

- ✅ **Temas Visuais** - Personalize a aparência do app
  - Tema Clássico Mario (padrão)
  - Bowser's Castle (tema escuro)
  - Underwater World (tema aquático)
  - Cloud Kingdom (tema celestial)
  - Desbloqueie temas premium na loja

- ✅ **Sistema de Conquistas** - Desbloqueie badges e achievements
  - Conquistas de streak (7, 30, 100, 365 dias)
  - Conquistas de nível (5, 10, 25, 50)
  - Conquistas de hábitos (50, 100, 500, 1000)
  - Conquistas especiais (Perfect Week, Early Bird, Night Owl)
  - 4 níveis de raridade (comum, rara, épica, lendária)

- ✅ **Compartilhamento** - Mostre suas conquistas
  - Gere links compartilháveis de conquistas
  - Sistema de visualizações públicas
  - Integração com redes sociais

- ✅ **Modo Offline** - Use sem conexão
  - Service Worker para cache
  - Sincronização automática ao voltar online
  - IndexedDB para armazenamento local
  - PWA (Progressive Web App)

- ✅ **Notificações Inteligentes**
  - Lembretes de hábitos personalizados
  - Notificações de conquistas desbloqueadas
  - Alertas de desafios terminando
  - Push notifications (PWA)

### Versão 3 (Implementada) ✨

- ✅ **Sistema de Amigos e Social** - Conecte-se com outros jogadores
  - Busca de usuários por nome ou código de amigo
  - Sistema de solicitações de amizade
  - Feed de atividades dos amigos
  - Mensagens entre amigos
  - Perfis públicos personalizáveis

- ✅ **Ranking Global e Leaderboards** - Compita com o mundo
  - Rankings semanais, mensais e global
  - Ranking entre amigos
  - Sistema de posições e medalhas
  - Atualização automática de rankings
  - Top 100 jogadores

- ✅ **Desafios Multiplayer** - Jogue com amigos
  - Desafios cooperativos e competitivos
  - Modo Team vs Team
  - Sistema de convites e códigos privados
  - Chat em tempo real
  - Distribuição automática de recompensas
  - Modos: Speed Run, Total Habits, Streak Battle, Boss Raid

- ✅ **Power-ups e Itens Expandidos** - Mais de 20 novos itens
  - Mega Mushroom (3x XP)
  - Gold Flower (converte XP em moedas)
  - Blue Shell (boost instantâneo)
  - Super Leaf (completar hábitos retroativos)
  - Lucky Coin (chance de dobrar XP)
  - Shield Block (proteção de streak)
  - Mystery Box (item aleatório)
  - Sistema de combos de itens
  - Checkpoints restauráveis

- ✅ **Estatísticas Avançadas e Gráficos** - Análise detalhada
  - Estatísticas diárias, semanais e mensais agregadas
  - Análise individual de cada hábito
  - Insights personalizados por IA
  - Metas pessoais customizáveis
  - Comparação com médias da plataforma (benchmarking)
  - Score de consistência
  - Dashboard completo

- ✅ **Integração com Wearables** - Sincronize seus dispositivos
  - Suporte para Google Fit, Apple Health, Fitbit, Garmin, Strava
  - Sincronização automática de passos, calorias, sono, etc
  - Mapeamento de dados para hábitos (ex: 10.000 passos = hábito completo)
  - Conquistas fitness exclusivas
  - Metas fitness automáticas
  - 13 tipos de dados suportados

- ✅ **Sistema de Pets/Mascotes** - Seu companheiro virtual
  - 15+ tipos de pets (Yoshi, Boo, Koopa, Toad, etc)
  - Sistema de felicidade, fome e energia
  - Interações: alimentar, brincar, treinar, dormir
  - Sistema de níveis e XP para pets
  - Comidas e acessórios cosméticos
  - Aventuras e mini-jogos
  - Pet ganha XP quando você completa hábitos
  - Sistema de evolução

## 🚧 Próximas Versões

### Versão 4 (Planejada)

- [ ] Sistema de clãs/guilds
- [ ] Eventos globais temporários
- [ ] Modo história com progressão narrativa
- [ ] Mais temas e personalizações
- [ ] Integração com calendários externos
- [ ] API pública para desenvolvedores

## 📱 Responsividade

- **Mobile First**: Design otimizado para mobile
- **Desktop**: Sidebar fixa + painel central
- **Tablet**: Layout adaptativo

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS)
- Validação de dados com Zod
- HTTPS obrigatório em produção

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou PR.

---

Desenvolvido com ❤️ usando Next.js e Supabase
