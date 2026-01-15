# 🚀 Game Habit - Versão 3.0

## 📋 Resumo

A Versão 3 do Game Habit adiciona funcionalidades sociais e multiplayer completas, transformando o app em uma experiência verdadeiramente social e competitiva.

## ✨ Novidades Principais

### 1. Sistema de Amigos 👥
- **Busca de Usuários**: Encontre jogadores por username ou código de amigo único
- **Solicitações**: Sistema completo de convites aceitar/recusar
- **Feed Social**: Veja as conquistas e atividades dos seus amigos
- **Mensagens**: Chat direto entre amigos
- **Perfis Públicos**: Perfil customizável com bio e avatar

### 2. Rankings Globais 🏆
- **Rankings Múltiplos**: Semanal, Mensal, Global e Entre Amigos
- **Top 100**: Veja os melhores jogadores
- **Atualização Automática**: Rankings recalculados periodicamente
- **Posição Pessoal**: Veja sua posição em tempo real

### 3. Desafios Multiplayer 🎮
- **3 Modos de Jogo**:
  - **Co-op**: Trabalhe junto com amigos
  - **Competitivo**: Compita diretamente
  - **Team vs Team**: Times competindo
- **4 Tipos de Batalha**:
  - Speed Run (mais rápido)
  - Total Habits (quem completa mais)
  - Streak Battle (batalha de streaks)
  - Boss Raid (desafio cooperativo contra chefe)
- **Sistema de Convites**: Códigos privados para desafios entre amigos
- **Chat em Tempo Real**: Converse durante o desafio
- **Recompensas**: Distribuição automática baseada em ranking

### 4. Power-ups Expandidos 💪
**Novos Items (20+):**
- 🍄 **Mega Mushroom** - 3x XP por 6h (150 moedas)
- 🌻 **Gold Flower** - Converte XP em moedas dobradas (200)
- 🐚 **Blue Shell** - 500 XP instantâneo (100)
- 🍃 **Super Leaf** - Completa 3 hábitos retroativos (250)
- 🪶 **Cape Feather** - Pula 1 dia de falha (180)
- 🪙 **Lucky Coin** - 50% chance dobrar XP (120)
- ⭐ **Rainbow Star** - Duplica todos multiplicadores (300)
- 🛡️ **Shield Block** - Proteção de 7 dias (350)
- 🚩 **Checkpoint Flag** - Salva e restaura progresso (400)
- 🏆 **Golden Mushroom** - XP infinito por 1h (500)

**Novos Temas:**
- 🌌 Galaxy (tema espacial) - 500 moedas
- 🌃 Neon City (cyberpunk) - 500 moedas
- 🌲 Forest (floresta) - 500 moedas

**Cosméticos:**
- 👑 Crown (coroa dourada) - 1000 moedas
- 🏅 Champion Badge - 800 moedas
- 🌈 Rainbow Trail - 600 moedas
- 🎆 Fireworks - 400 moedas

**Sistema de Combos:**
- Combine itens ativos para bônus especiais
- Ex: Super Mushroom + Star = 5x XP por 4h + 1000 XP bônus

### 5. Estatísticas Avançadas 📊
- **Dashboard Completo**: Visualize hoje, semana e mês
- **Análise por Hábito**: Score de consistência individual
- **Insights por IA**: Recomendações personalizadas automáticas
- **Metas Customizáveis**: Crie suas próprias metas
- **Benchmarking**: Compare-se com médias da plataforma
- **Previsões**: Estimativas baseadas em padrões

**Tipos de Insights:**
- 🎯 Conquista próxima
- ⚡ Aviso de streak
- 👏 Elogio de consistência
- 💡 Sugestão de melhoria
- ⏰ Melhor horário para hábitos
- 📊 Balanceamento de áreas

### 6. Integração com Wearables ⌚
**Dispositivos Suportados:**
- Google Fit
- Apple Health
- Fitbit
- Garmin
- Samsung Health
- Mi Fit
- Strava
- Whoop

**Dados Sincronizados:**
- 🚶 Passos
- 📏 Distância
- 🔥 Calorias
- ❤️ Frequência cardíaca
- 😴 Sono
- ⏱️ Minutos ativos
- 🏋️ Treinos
- ⚖️ Peso
- 💧 Água
- 🧘 Meditação

**Funcionalidades:**
- **Auto-completar Hábitos**: Configure metas (ex: 10.000 passos = hábito completo)
- **Conquistas Fitness**: 13 conquistas exclusivas
- **Metas Fitness**: Objetivos automáticos baseados em dados
- **Sincronização Automática**: A cada 60 minutos (configurável)

### 7. Sistema de Pets 🐾
**15+ Pets Disponíveis:**
- 🦖 Yoshi (Verde, Vermelho, Azul, Amarelo)
- 👻 Boo (Branco, King Boo)
- 🐢 Koopa (Verde, Vermelho, Paratroopa)
- 🍄 Toad (Vermelho, Azul, Toadette)
- ⛓️ Chain Chomp
- ☁️ Lakitu
- 🎭 Shy Guy

**Sistema Completo:**
- **Stats**: Felicidade, Fome, Energia
- **Interações**: Alimentar, Brincar, Carinho, Dormir, Treinar
- **Níveis**: Pet sobe de nível com você
- **Comidas**: 7+ comidas diferentes com efeitos
- **Acessórios**: Chapéus, óculos, asas, etc
- **Aventuras**: 4 aventuras de 30min a 3h
- **Recompensas**: Moedas, XP e itens raros

**Pet Ativo:**
- Apenas 1 pet ativo por vez
- Pet ganha 10% do seu XP
- Pet fica feliz quando você completa hábitos
- Stats degradam com o tempo (precisa cuidar!)

## 🗄️ Estrutura do Banco de Dados

### Principais Funções SQL Adicionadas

#### Amigos e Social
```sql
get_friends(user_id) -- Retorna lista de amigos
search_users(term) -- Busca usuários
generate_friend_code() -- Gera código único
```

#### Rankings
```sql
update_global_leaderboard() -- Atualiza ranking
update_challenge_rankings(challenge_id) -- Ranking de desafio
```

#### Multiplayer
```sql
accept_challenge_invite(invite_id) -- Aceita convite
distribute_challenge_rewards(challenge_id) -- Distribui prêmios
update_multiplayer_score_on_checkin() -- Atualiza score (trigger)
```

#### Items e Power-ups
```sql
use_consumable_item(item_key, context) -- Usa item
calculate_xp_with_boosts(base_xp, user_id) -- Calcula XP com boosts
cleanup_expired_effects() -- Limpa efeitos expirados
```

#### Estatísticas
```sql
get_user_dashboard(user_id) -- Dashboard completo
update_daily_statistics(date, user_id) -- Atualiza stats diárias
calculate_habit_consistency(habit_id, days) -- Score de consistência
generate_user_insights(user_id) -- Gera insights automáticos
```

#### Wearables
```sql
process_wearable_data_for_habits() -- Completa hábitos (trigger)
check_fitness_achievements() -- Verifica conquistas (trigger)
get_daily_fitness_summary(user_id, date) -- Resumo do dia
```

#### Pets
```sql
interact_with_pet(pet_id, interaction, item) -- Interage com pet
give_pet_xp_on_checkin() -- Pet ganha XP (trigger)
degrade_pet_stats() -- Degrada stats com tempo
```

## 🎨 Componentes de Interface

### Páginas Novas (V3)
- `/friends` - Sistema de amigos
- `/leaderboard` - Rankings globais
- `/pets` - Gerenciamento de pets
- `/stats` - Estatísticas avançadas

### Componentes Criados
- `FriendsPage` - Lista e busca de amigos
- `LeaderboardPage` - Rankings com filtros
- `PetsPage` - Interface completa de pets
- `StatsPage` - Dashboard de estatísticas

## 🔧 Configuração

### 1. Executar Migrations
Execute todas as 6 novas migrations na ordem:
```sql
20240106000000_v3_friends_ranking.sql
20240107000000_v3_multiplayer_challenges.sql
20240108000000_v3_new_powerups_items.sql
20240109000000_v3_advanced_statistics.sql
20240110000000_v3_wearables_integration.sql
20240111000000_v3_pets_system.sql
```

### 2. Configurar Cron Jobs (Opcional)
Para funcionalidades automáticas, configure jobs periódicos:

```sql
-- Atualizar rankings (a cada hora)
SELECT cron.schedule('update-leaderboards', '0 * * * *', $$
  SELECT update_global_leaderboard();
$$);

-- Limpar efeitos expirados (a cada 6 horas)
SELECT cron.schedule('cleanup-effects', '0 */6 * * *', $$
  SELECT cleanup_expired_effects();
$$);

-- Degradar stats dos pets (a cada 12 horas)
SELECT cron.schedule('degrade-pets', '0 */12 * * *', $$
  SELECT degrade_pet_stats();
$$);

-- Gerar insights diários (todo dia às 6h)
SELECT cron.schedule('generate-insights', '0 6 * * *', $$
  SELECT generate_user_insights(user_id) FROM auth.users;
$$);
```

### 3. Configurar Wearables (Opcional)
Para integração com wearables, você precisará:
1. Criar apps nos consoles de cada plataforma (Google Fit, etc)
2. Obter credenciais OAuth
3. Configurar tokens no Supabase (criptografados)
4. Implementar sincronização via API

## 🎮 Novas Rotas da API

### Amigos
- `GET /api/friends` - Lista amigos
- `POST /api/friends/request` - Envia convite
- `PUT /api/friends/respond` - Aceita/recusa
- `GET /api/friends/search?q=term` - Busca usuários

### Rankings
- `GET /api/leaderboard?period=weekly` - Ranking
- `GET /api/leaderboard/rank` - Sua posição

### Multiplayer
- `POST /api/challenges/multiplayer` - Cria desafio
- `POST /api/challenges/join` - Entra em desafio
- `GET /api/challenges/:id/chat` - Mensagens

### Pets
- `POST /api/pets/adopt` - Adota pet
- `POST /api/pets/interact` - Interage
- `POST /api/pets/adventure` - Inicia aventura

### Stats
- `GET /api/stats/dashboard` - Dashboard completo
- `GET /api/stats/insights` - Insights personalizados

## 🔐 Segurança

Todas as tabelas da V3 têm:
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso por usuário
- ✅ Validações de constraints
- ✅ Triggers para integridade

## 📈 Performance

### Índices Criados
Foram criados 80+ índices para otimizar queries:
- Índices em user_id para todas as tabelas
- Índices compostos para queries comuns
- Índices em timestamps para ordenação
- Índices em status/flags para filtragem

### Otimizações
- Uso de `JSONB` para dados flexíveis
- Funções com `SECURITY DEFINER` quando necessário
- Triggers otimizados (apenas quando mudança relevante)
- Paginação via `LIMIT/OFFSET`

## 🐛 Troubleshooting

### Rankings não atualizam
Execute manualmente:
```sql
SELECT update_global_leaderboard();
```

### Wearables não sincronizam
Verifique:
1. Token de acesso não expirado
2. Permissões concedidas no dispositivo
3. Última sincronização (`last_sync`)

### Pet stats não degradam
Execute manualmente:
```sql
SELECT degrade_pet_stats();
```

### Insights não aparecem
Gere manualmente:
```sql
SELECT generate_user_insights(auth.uid());
```

## 🎯 Próximos Passos

1. Testar todas as funcionalidades
2. Popular dados iniciais (pets, items, achievements)
3. Configurar cron jobs
4. Implementar sincronização wearables
5. Adicionar analytics para tracking

## 📝 Notas Importantes

- Todos os dados são salvos **automaticamente** no Supabase
- Triggers garantem **integridade** entre tabelas
- Sistema é **extensível** para V4
- Código está **documentado** com comments SQL
- **100% TypeScript** com tipos gerados

---

**Desenvolvido com ❤️ para a comunidade Game Habit**
