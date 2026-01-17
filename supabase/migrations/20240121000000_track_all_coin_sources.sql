-- =============================================
-- ATUALIZAÇÃO: Rastrear moedas de conquistas, desafios e outras fontes
-- =============================================

-- Atualizar função de conquistas para registrar moedas
CREATE OR REPLACE FUNCTION check_and_unlock_achievement(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  achievement RECORD;
  already_unlocked BOOLEAN;
BEGIN
  -- Verificar se já foi desbloqueado
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO already_unlocked;

  IF already_unlocked THEN
    RETURN FALSE;
  END IF;

  -- Buscar dados da conquista
  SELECT * INTO achievement
  FROM achievements
  WHERE id = p_achievement_id;

  IF achievement IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Desbloquear conquista
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id);

  -- Atualizar stats
  UPDATE stats
  SET
    xp = xp + achievement.xp_reward,
    coins = coins + achievement.coin_reward,
    level = FLOOR((xp + achievement.xp_reward) / 100) + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Registrar transação de moedas
  IF achievement.coin_reward > 0 THEN
    PERFORM log_coin_transaction(
      p_user_id,
      achievement.coin_reward,
      'achievement_reward',
      'Conquista desbloqueada: ' || achievement.name,
      jsonb_build_object('achievement_id', p_achievement_id, 'xp_reward', achievement.xp_reward)
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de recompensa de desafios
CREATE OR REPLACE FUNCTION complete_challenge_reward(
  p_user_id UUID,
  p_challenge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  challenge RECORD;
  user_challenge RECORD;
BEGIN
  -- Buscar desafio
  SELECT * INTO challenge
  FROM challenges
  WHERE id = p_challenge_id;

  IF challenge IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se usuário está participando e completou
  SELECT * INTO user_challenge
  FROM user_challenges
  WHERE user_id = p_user_id
    AND challenge_id = p_challenge_id
    AND status = 'completed';

  IF user_challenge IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se já recebeu recompensa
  IF user_challenge.reward_claimed THEN
    RETURN FALSE;
  END IF;

  -- Atualizar stats
  UPDATE stats
  SET
    xp = xp + challenge.xp_reward,
    coins = coins + challenge.coin_reward,
    level = FLOOR((xp + challenge.xp_reward) / 100) + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Marcar recompensa como recebida
  UPDATE user_challenges
  SET reward_claimed = TRUE
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  -- Registrar transação de moedas
  IF challenge.coin_reward > 0 THEN
    PERFORM log_coin_transaction(
      p_user_id,
      challenge.coin_reward,
      'challenge_reward',
      'Desafio completado: ' || challenge.name,
      jsonb_build_object('challenge_id', p_challenge_id, 'xp_reward', challenge.xp_reward)
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de compra na loja para registrar gastos
-- NOTA: A função original usa (UUID, TEXT, INT), mantemos a mesma assinatura
CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id UUID,
  p_item_key TEXT,
  p_quantity INT DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  item RECORD;
  user_coins INT;
  total_cost INT;
BEGIN
  -- Get item details
  SELECT * INTO item FROM shop_items WHERE item_key = p_item_key AND is_available = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or not available');
  END IF;

  -- Calculate total cost
  total_cost := item.price * p_quantity;

  -- Get user coins
  SELECT coins INTO user_coins FROM stats WHERE user_id = p_user_id;

  -- Check if user has enough coins
  IF user_coins < total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  -- Deduct coins
  UPDATE stats
  SET coins = coins - total_cost, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add to inventory or activate powerup
  IF item.category = 'powerup' OR item.category = 'boost' THEN
    -- Add to inventory for later use
    INSERT INTO inventory (user_id, item_key, quantity)
    VALUES (p_user_id, p_item_key, p_quantity)
    ON CONFLICT (user_id, item_key)
    DO UPDATE SET quantity = inventory.quantity + p_quantity;
  ELSIF item.category = 'theme' THEN
    -- Unlock theme (add to inventory)
    INSERT INTO inventory (user_id, item_key, quantity)
    VALUES (p_user_id, p_item_key, 1)
    ON CONFLICT (user_id, item_key)
    DO NOTHING;
  END IF;

  -- Record purchase
  INSERT INTO purchase_history (user_id, item_key, quantity, total_cost)
  VALUES (p_user_id, p_item_key, p_quantity, total_cost);

  -- Registrar transação de moedas (negativo = gasto)
  PERFORM log_coin_transaction(
    p_user_id,
    -total_cost,
    'shop_purchase',
    'Compra: ' || item.name || ' x' || p_quantity,
    jsonb_build_object('item_key', p_item_key, 'quantity', p_quantity, 'unit_price', item.price)
  );

  RETURN jsonb_build_object('success', true, 'item_key', p_item_key, 'quantity', p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de recompensa de meta pessoal
CREATE OR REPLACE FUNCTION complete_personal_goal(
  p_goal_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  goal RECORD;
BEGIN
  -- Buscar meta
  SELECT * INTO goal
  FROM personal_goals
  WHERE id = p_goal_id AND is_completed = FALSE;

  IF goal IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se atingiu o objetivo
  IF goal.current_value < goal.target_value THEN
    RETURN FALSE;
  END IF;

  -- Marcar como completada
  UPDATE personal_goals
  SET
    is_completed = TRUE,
    completed_at = NOW()
  WHERE id = p_goal_id;

  -- Dar recompensas
  UPDATE stats
  SET
    xp = xp + goal.reward_xp,
    coins = coins + goal.reward_coins,
    level = FLOOR((xp + goal.reward_xp) / 100) + 1,
    updated_at = NOW()
  WHERE user_id = goal.user_id;

  -- Registrar transação de moedas
  IF goal.reward_coins > 0 THEN
    PERFORM log_coin_transaction(
      goal.user_id,
      goal.reward_coins,
      'personal_goal',
      'Meta completada: ' || goal.title,
      jsonb_build_object('goal_id', p_goal_id, 'xp_reward', goal.reward_xp)
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para distribuir prêmios de multiplayer
CREATE OR REPLACE FUNCTION distribute_multiplayer_rewards(
  p_challenge_id UUID
)
RETURNS void AS $$
DECLARE
  challenge_data RECORD;
  participant RECORD;
  prize_distribution INTEGER[];
  position INTEGER := 1;
BEGIN
  -- Buscar dados do desafio
  SELECT * INTO challenge_data
  FROM multiplayer_challenges
  WHERE id = p_challenge_id AND status = 'completed';

  IF challenge_data IS NULL THEN
    RETURN;
  END IF;

  -- Definir distribuição de prêmios (top 3)
  prize_distribution := ARRAY[
    (challenge_data.prize_pool * 0.5)::INTEGER,  -- 1º: 50%
    (challenge_data.prize_pool * 0.3)::INTEGER,  -- 2º: 30%
    (challenge_data.prize_pool * 0.2)::INTEGER   -- 3º: 20%
  ];

  -- Distribuir para top 3
  FOR participant IN
    SELECT mp.user_id, mp.progress, p.name as user_name
    FROM multiplayer_participants mp
    JOIN profiles p ON mp.user_id = p.id
    WHERE mp.challenge_id = p_challenge_id
    ORDER BY mp.progress DESC
    LIMIT 3
  LOOP
    IF position <= 3 AND prize_distribution[position] > 0 THEN
      -- Atualizar stats
      UPDATE stats
      SET coins = coins + prize_distribution[position], updated_at = NOW()
      WHERE user_id = participant.user_id;

      -- Registrar transação
      PERFORM log_coin_transaction(
        participant.user_id,
        prize_distribution[position],
        'multiplayer_reward',
        'Prêmio de multiplayer: ' || position || 'º lugar - ' || challenge_data.name,
        jsonb_build_object(
          'challenge_id', p_challenge_id,
          'position', position,
          'total_prize_pool', challenge_data.prize_pool
        )
      );

      -- Registrar na tabela de recompensas
      INSERT INTO multiplayer_rewards (challenge_id, user_id, rank, coins_earned, xp_earned)
      VALUES (p_challenge_id, participant.user_id, position, prize_distribution[position], 0)
      ON CONFLICT (challenge_id, user_id) DO NOTHING;
    END IF;

    position := position + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para completar aventura de pet e dar recompensas
CREATE OR REPLACE FUNCTION complete_pet_adventure(
  p_adventure_instance_id UUID
)
RETURNS JSONB AS $$
DECLARE
  adventure RECORD;
  rewards JSONB;
  coins_earned INTEGER;
  xp_earned INTEGER;
BEGIN
  -- Buscar aventura ativa
  SELECT apa.*, pa.name as adventure_name, pa.possible_rewards
  INTO adventure
  FROM active_pet_adventures apa
  JOIN pet_adventures pa ON apa.adventure_id = pa.id
  WHERE apa.id = p_adventure_instance_id
    AND apa.status = 'in_progress'
    AND apa.end_time <= NOW();

  IF adventure IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Adventure not found or not ready');
  END IF;

  -- Calcular recompensas aleatórias baseado em possible_rewards
  coins_earned := 0;
  xp_earned := 0;

  IF adventure.possible_rewards IS NOT NULL THEN
    FOR rewards IN SELECT * FROM jsonb_array_elements(adventure.possible_rewards)
    LOOP
      IF rewards->>'type' = 'coins' THEN
        coins_earned := (rewards->>'min')::INTEGER +
          FLOOR(RANDOM() * ((rewards->>'max')::INTEGER - (rewards->>'min')::INTEGER + 1));
      ELSIF rewards->>'type' = 'xp' THEN
        xp_earned := (rewards->>'min')::INTEGER +
          FLOOR(RANDOM() * ((rewards->>'max')::INTEGER - (rewards->>'min')::INTEGER + 1));
      END IF;
    END LOOP;
  END IF;

  -- Atualizar aventura como completada
  UPDATE active_pet_adventures
  SET
    status = 'completed',
    rewards = jsonb_build_object('coins', coins_earned, 'xp', xp_earned)
  WHERE id = p_adventure_instance_id;

  -- Atualizar stats do usuário
  UPDATE stats
  SET
    xp = xp + xp_earned,
    coins = coins + coins_earned,
    level = FLOOR((xp + xp_earned) / 100) + 1,
    updated_at = NOW()
  WHERE user_id = adventure.user_id;

  -- Registrar transação de moedas
  IF coins_earned > 0 THEN
    PERFORM log_coin_transaction(
      adventure.user_id,
      coins_earned,
      'pet_adventure',
      'Aventura completada: ' || adventure.adventure_name,
      jsonb_build_object(
        'adventure_id', adventure.adventure_id,
        'pet_id', adventure.pet_id,
        'xp_earned', xp_earned
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'coins_earned', coins_earned,
    'xp_earned', xp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION check_and_unlock_achievement IS 'Desbloqueia conquista e registra transação de moedas';
COMMENT ON FUNCTION complete_challenge_reward IS 'Dá recompensa de desafio e registra transação';
COMMENT ON FUNCTION public.purchase_item(UUID, TEXT, INT) IS 'Processa compra na loja e registra gasto de moedas';
COMMENT ON FUNCTION complete_personal_goal IS 'Completa meta pessoal e registra recompensa';
COMMENT ON FUNCTION distribute_multiplayer_rewards IS 'Distribui prêmios de multiplayer e registra transações';
COMMENT ON FUNCTION complete_pet_adventure IS 'Completa aventura de pet e registra recompensas';
