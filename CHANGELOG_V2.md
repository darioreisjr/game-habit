# 🎮 Game Habit - Versão 2.0

## 📅 Data de Lançamento: 2026-01-07

## ✨ Novidades

### 🏆 Sistema de Desafios Semanais

Enfrente os vilões do mundo do Mario em desafios épicos!

**Funcionalidades:**
- Desafios semanais com diferentes chefes (Bowser, Koopa, Goomba)
- 4 níveis de dificuldade: Easy, Medium, Hard, Legendary
- Progresso automático ao completar hábitos
- Recompensas de XP e moedas ao vencer
- Sistema de requisitos flexível (qualquer hábito, área específica, dificuldade específica)

**Arquivos criados:**
- `supabase/migrations/20240102000000_v2_challenges.sql`
- `components/challenges/challenge-card.tsx`
- `components/challenges/challenges-list.tsx`
- `app/(app)/challenges/page.tsx`

---

### 🏪 Loja Completa

Compre power-ups e itens especiais com suas moedas!

**Itens disponíveis:**
- **Power-ups:**
  - Super Mushroom (2x XP por 24h) - 50 moedas
  - Super Star (3x XP por 12h) - 100 moedas
  - Fire Flower (Congela streak por 3 dias) - 80 moedas
  - 1-UP Mushroom (Refazer hábito perdido) - 150 moedas

- **Boosts:**
  - Coin Block (2x moedas por 24h) - 60 moedas

- **Temas:**
  - Bowser's Castle - 200 moedas
  - Underwater World - 200 moedas
  - Cloud Kingdom - 200 moedas

- **Cosméticos:**
  - Rainbow Trail - 120 moedas
  - Golden Frame - 100 moedas

**Funcionalidades:**
- Sistema de compra com moedas
- Ativação de power-ups temporários
- Histórico de compras
- Filtros por categoria
- Verificação de saldo

**Arquivos criados:**
- `supabase/migrations/20240103000000_v2_shop.sql`
- `components/shop/shop-item-card.tsx`
- `components/shop/shop-list.tsx`
- `app/(app)/shop/page.tsx`

---

### 🎨 Temas Visuais

Personalize a aparência do app com temas incríveis!

**Temas disponíveis:**
- **Classic Mario** (padrão) - Tema original vermelho e azul
- **Bowser's Castle** (premium) - Tema escuro e misterioso
- **Underwater World** (premium) - Tema aquático e sereno
- **Cloud Kingdom** (premium) - Tema celestial e leve

**Funcionalidades:**
- Sistema de desbloqueio via loja
- Preview de cores antes de comprar
- Aplicação instantânea do tema
- Persistência da preferência do usuário

**Arquivos criados:**
- `supabase/migrations/20240104000000_v2_themes_preferences.sql`
- `app/(app)/settings/page.tsx`

---

### 🏅 Sistema de Conquistas

Desbloqueie achievements e mostre suas habilidades!

**Categorias:**
- **Streak:** 7, 30, 100, 365 dias consecutivos
- **Nível:** Alcançar níveis 5, 10, 25, 50
- **Hábitos:** Completar 50, 100, 500, 1000 hábitos
- **Especiais:** Perfect Week, Early Bird, Night Owl

**Raridades:**
- Comum (cinza)
- Rara (azul)
- Épica (roxo)
- Lendária (dourado)

**Funcionalidades:**
- Verificação automática de conquistas
- Recompensas de XP e moedas
- Notificações ao desbloquear
- Sistema de showcase
- Compartilhamento público

**Arquivos criados:**
- `supabase/migrations/20240105000000_v2_achievements_sharing.sql`
- `components/achievements/achievement-card.tsx`
- `components/achievements/achievements-list.tsx`
- `app/(app)/achievements/page.tsx`

---

### 📤 Compartilhamento Social

Compartilhe suas conquistas com o mundo!

**Funcionalidades:**
- Links únicos para cada conquista
- Contador de visualizações
- Mensagem personalizada
- Copy to clipboard automático
- Páginas públicas de conquistas

---

### 📱 Modo Offline (PWA)

Use o Game Habit sem conexão à internet!

**Funcionalidades:**
- Service Worker para cache de assets
- IndexedDB para armazenamento local
- Sincronização automática ao voltar online
- Fila de checkins offline
- Página offline dedicada
- Web App Manifest
- Suporte a instalação no dispositivo
- Push notifications

**Arquivos criados:**
- `public/service-worker.js`
- `public/manifest.json`
- `lib/service-worker.ts`
- `app/(app)/offline/page.tsx`

---

### 🔔 Notificações Inteligentes

Receba lembretes e atualizações importantes!

**Tipos de notificações:**
- Lembretes de hábitos personalizados
- Notificações de conquistas desbloqueadas
- Alertas de desafios terminando
- Notificações sociais (compartilhamentos)

**Funcionalidades:**
- Agendamento flexível
- Horários personalizados
- Dias da semana configuráveis
- Toggle on/off nas configurações
- Push notifications (PWA)

---

### 🔥 Sistema de Streaks Aprimorado

Rastreamento avançado de sequências!

**Funcionalidades:**
- Contador de streak atual
- Registro de maior streak
- Congelamento de streak (Fire Flower)
- Atualização automática
- Visualização no perfil

---

## 🗄️ Banco de Dados

### Novas Tabelas (13 no total)

1. **challenges** - Desafios semanais
2. **user_challenges** - Progresso dos usuários
3. **challenge_requirements** - Requisitos dos desafios
4. **shop_items** - Catálogo da loja
5. **user_powerups** - Power-ups ativos
6. **purchase_history** - Histórico de compras
7. **themes** - Temas visuais
8. **user_preferences** - Configurações do usuário
9. **notifications** - Notificações agendadas
10. **achievements** - Conquistas disponíveis
11. **user_achievements** - Conquistas desbloqueadas
12. **shared_achievements** - Conquistas compartilhadas
13. **streaks** - Rastreamento de streaks

### Novas Funções SQL

- `purchase_item()` - Comprar item da loja
- `activate_powerup()` - Ativar um power-up
- `change_theme()` - Trocar tema visual
- `share_achievement()` - Compartilhar conquista
- `check_achievements()` - Verificar conquistas desbloqueadas
- `create_habit_reminder()` - Criar lembrete de hábito
- `update_challenge_progress()` - Atualizar progresso de desafio
- `update_streak_on_checkin()` - Atualizar streak
- `create_user_preferences()` - Criar preferências padrão

### Novos Triggers

- Atualização de progresso de desafios ao fazer checkin
- Atualização de streaks ao fazer checkin
- Criação de preferências ao criar usuário

---

## 📊 Tipos TypeScript

Adicionados 20+ novos tipos e interfaces em `types/database.types.ts`:

- Challenge, UserChallenge, ChallengeRequirement
- ShopItem, UserPowerup, PurchaseHistory
- Theme, UserPreferences
- Notification
- Achievement, UserAchievement, SharedAchievement
- Streak

---

## 🎯 Navegação Atualizada

Novos itens adicionados ao menu:

- 🎮 Mapa (home)
- ✅ Hábitos
- 📁 Áreas
- 📅 Rotina
- ⚔️ **Desafios** (novo)
- 🛍️ **Loja** (novo)
- 🏆 **Conquistas** (novo)
- 👤 Perfil
- ⚙️ **Configurações** (novo)

---

## 🚀 Como Aplicar a V2

### 1. Execute as migrations no Supabase (SQL Editor)

```sql
-- Já tem a V1 instalada, execute na ordem:
supabase/migrations/20240102000000_v2_challenges.sql
supabase/migrations/20240103000000_v2_shop.sql
supabase/migrations/20240104000000_v2_themes_preferences.sql
supabase/migrations/20240105000000_v2_achievements_sharing.sql
```

### 2. Instale as dependências (se necessário)

```bash
npm install
```

### 3. Execute o projeto

```bash
npm run dev
```

### 4. Aproveite as novas funcionalidades!

- Visite `/challenges` para ver desafios
- Visite `/shop` para comprar itens
- Visite `/achievements` para ver conquistas
- Visite `/settings` para personalizar temas

---

## 📈 Estatísticas da V2

- **13 novas tabelas** de banco de dados
- **9 novas funções SQL**
- **4 novos triggers**
- **20+ novos tipos TypeScript**
- **15+ novos componentes React**
- **4 novas páginas**
- **10+ novos itens na loja**
- **15+ novas conquistas**
- **4 temas visuais**
- **Modo offline completo**

---

## 🎉 Próximos Passos (V3)

- Sistema de amigos e ranking
- Desafios multiplayer
- Mais power-ups e itens
- Estatísticas avançadas
- Integração com wearables
- Sistema de pets/mascotes

---

**Desenvolvido com ❤️ usando Next.js 16 e Supabase**
