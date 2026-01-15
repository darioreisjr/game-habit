# 🚀 Quick Start - Game Habit V3

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Executar Migrations

No Supabase SQL Editor, execute **na ordem**:

```sql
-- V1 (Base)
\i supabase/migrations/20240101000000_initial_schema.sql

-- V2 (Gamificação Avançada)
\i supabase/migrations/20240102000000_v2_challenges.sql
\i supabase/migrations/20240103000000_v2_shop.sql
\i supabase/migrations/20240104000000_v2_themes_preferences.sql
\i supabase/migrations/20240105000000_v2_achievements_sharing.sql

-- V3 (Social e Multiplayer) ⭐
\i supabase/migrations/20240106000000_v3_friends_ranking.sql
\i supabase/migrations/20240107000000_v3_multiplayer_challenges.sql
\i supabase/migrations/20240108000000_v3_new_powerups_items.sql
\i supabase/migrations/20240109000000_v3_advanced_statistics.sql
\i supabase/migrations/20240110000000_v3_wearables_integration.sql
\i supabase/migrations/20240111000000_v3_pets_system.sql
```

### 2️⃣ Rodar o Projeto

```bash
npm install
npm run dev
```

Acesse: `http://localhost:3000`

### 3️⃣ Testar Funcionalidades V3

#### 🧪 Teste 1: Sistema de Amigos
1. Acesse `/friends`
2. Vá em "Buscar"
3. Seu código de amigo estará visível
4. Copie e compartilhe com amigos!

#### 🧪 Teste 2: Adotar seu Primeiro Pet
1. Acesse `/pets`
2. Clique em "Adotar Pet"
3. Escolha o **Yoshi Verde** (gratuito!)
4. Interaja: Alimentar, Brincar, Carinho

#### 🧪 Teste 3: Ver Ranking
1. Complete alguns hábitos
2. Acesse `/leaderboard`
3. Veja sua posição no ranking semanal

#### 🧪 Teste 4: Estatísticas
1. Acesse `/stats`
2. Veja seu dashboard completo
3. Confira insights personalizados

#### 🧪 Teste 5: Usar Power-up
1. Vá na `/shop`
2. Compre um **Blue Shell** (100 moedas)
3. Use para ganhar 500 XP instantâneo!

## 📊 Dados Iniciais Populados

Ao executar as migrations, você já terá:

### ✅ Pets (15 tipos)
- Yoshi (Verde, Vermelho, Azul, Amarelo)
- Boo (Branco, King Boo)
- Koopa (Verde, Vermelho, Paratroopa)
- Toad (Vermelho, Azul, Toadette)
- Chain Chomp, Lakitu, Shy Guy

### ✅ Comidas (7 tipos)
- Cogumelo, Super Cogumelo, Fire Flower
- Star Candy, Coin Cookie, Rainbow Cake, Power Berry

### ✅ Acessórios (7 tipos)
- Bonés (Mario, Luigi), Óculos, Corrente
- Asas, Rabo, Capa

### ✅ Power-ups (20+ novos)
- Mega Mushroom, Gold Flower, Blue Shell
- Lucky Coin, Rainbow Star, Shield Block
- E muito mais...

### ✅ Conquistas Fitness (13 conquistas)
- Walker 1K, 5K, 10K, Marathon, Ultra
- Calorie Burner, Active 30/60/Warrior
- Sleep Master, Hydration Hero, Zen Master

### ✅ Aventuras (4 tipos)
- Caminhada na Floresta (30min)
- Exploração de Caverna (1h)
- Invasão ao Castelo (2h)
- Rainbow Road (3h)

## 🎮 Funcionalidades Principais V3

| Funcionalidade | Rota | Status |
|---|---|---|
| Amigos | `/friends` | ✅ |
| Ranking | `/leaderboard` | ✅ |
| Pets | `/pets` | ✅ |
| Stats | `/stats` | ✅ |
| Multiplayer | Em desenvolvimento | 🚧 |
| Wearables | Requer config OAuth | ⚙️ |

## 💡 Dicas para Testar

### Ganhar Moedas Rápido
1. Complete hábitos difíceis (30 XP)
2. A cada 50 XP = 1 moeda
3. Use o **Gold Flower** para converter XP em moedas dobradas

### Subir de Nível Rápido
1. Compre **Mega Mushroom** (3x XP)
2. Complete vários hábitos enquanto ativo
3. Use **Blue Shell** para boost instantâneo

### Manter seu Pet Feliz
1. Interaja pelo menos 2x por dia
2. Alimente quando fome < 40
3. Deixe dormir quando energia < 40
4. Brinque para aumentar felicidade

### Conquistar o Ranking
1. Foque em hábitos de alto XP
2. Mantenha streak alto
3. Complete desafios semanais
4. Use power-ups estrategicamente

## 🐛 Resolução Rápida de Problemas

### "RLS policy violation"
- Faça logout e login novamente
- Verifique se as policies foram criadas

### Rankings não aparecem
Execute:
```sql
SELECT update_global_leaderboard();
```

### Pet não ganha XP
- Certifique-se que o pet está ATIVO
- Verifique o trigger `on_checkin_give_pet_xp`

### Insights não aparecem
Execute:
```sql
SELECT generate_user_insights(auth.uid());
```

### Items não aparecem na loja
Verifique:
```sql
SELECT * FROM shop_items WHERE is_available = true;
```

## 📱 Navegação Rápida

```
/ (Mapa) → Visão geral dos hábitos de hoje
/habits → Gerenciar hábitos
/areas → Organizar áreas de vida
/routine → Calendário semanal
/challenges → Desafios contra chefes
/shop → Loja de power-ups
/achievements → Suas conquistas
/friends → 🆕 Sistema social
/leaderboard → 🆕 Rankings
/pets → 🆕 Seus mascotes
/stats → 🆕 Estatísticas avançadas
/profile → Seu perfil e XP
/settings → Configurações
```

## 🎯 Próximos Passos

1. ✅ Execute todas migrations
2. ✅ Teste funcionalidades básicas
3. ✅ Adote seu primeiro pet
4. ✅ Adicione um amigo
5. ✅ Complete um hábito
6. ✅ Veja seu ranking
7. ✅ Compre um power-up
8. ✅ Confira suas estatísticas

## 🔗 Links Úteis

- **README Principal**: [README.md](README.md)
- **Documentação V3**: [VERSAO_3.md](VERSAO_3.md)
- **Tipos TypeScript**: [types/database.types.ts](types/database.types.ts)
- **Migrations**: [supabase/migrations/](supabase/migrations/)

## 💬 Suporte

Encontrou um bug? Abra uma issue!

---

**Divirta-se jogando Game Habit V3! 🎮✨**
