export type HabitType = 'checklist' | 'count' | 'timer' | 'boolean';
export type HabitDifficulty = 'easy' | 'medium' | 'hard';

export interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Area {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  order_index: number;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  area_id?: string;
  name: string;
  type: HabitType;
  difficulty: HabitDifficulty;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    days?: number[];
    times_per_week?: number;
  };
  preferred_time?: string;
  is_archived: boolean;
  created_at: string;
  area?: Area;
}

export interface Checkin {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  value?: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_key: string;
  quantity: number;
}

export interface Stats {
  user_id: string;
  level: number;
  xp: number;
  coins: number;
  updated_at: string;
}

export type ItemKey =
  | 'mushroom'
  | 'star'
  | 'flower'
  | 'coin_boost'
  | '1up'
  | 'theme_castle'
  | 'theme_underwater'
  | 'theme_sky'
  | 'rainbow_road'
  | 'golden_frame';

// Version 2 Types

// Challenges (Boss Battles)
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type BossType = 'bowser' | 'koopa' | 'goomba' | 'boo' | 'hammer_bro';
export type RequirementType = 'any_habit' | 'area_specific' | 'difficulty_specific';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  difficulty: ChallengeDifficulty;
  xp_reward: number;
  coin_reward: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  boss_type: BossType;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  goal: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  challenge?: Challenge;
}

export interface ChallengeRequirement {
  id: string;
  challenge_id: string;
  requirement_type: RequirementType;
  area_id?: string;
  difficulty?: HabitDifficulty;
  count_required: number;
}

// Shop and Power-ups
export type ShopCategory = 'powerup' | 'theme' | 'boost' | 'cosmetic';
export type EffectType = 'xp_boost' | 'coin_boost' | 'streak_freeze' | 'redo_habit' | 'visual_effect';

export interface ShopItem {
  id: string;
  item_key: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  effect_type?: EffectType;
  effect_value?: {
    multiplier?: number;
    duration?: number;
    days?: number;
    effect?: string;
  };
  icon: string;
  is_available: boolean;
  created_at: string;
}

export interface UserPowerup {
  id: string;
  user_id: string;
  item_key: string;
  activated_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseHistory {
  id: string;
  user_id: string;
  item_key: string;
  quantity: number;
  total_cost: number;
  purchased_at: string;
}

// Themes and Preferences
export interface Theme {
  id: string;
  theme_key: string;
  name: string;
  description: string;
  is_premium: boolean;
  requires_item?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  assets?: Record<string, string>;
  preview_url?: string;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  active_theme: string;
  notifications_enabled: boolean;
  notification_time: string;
  notification_days: number[];
  sound_enabled: boolean;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Notifications
export type NotificationType = 'reminder' | 'achievement' | 'challenge' | 'streak' | 'social';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  scheduled_for: string;
  sent_at?: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

// Achievements
export type AchievementCategory = 'streak' | 'level' | 'habits' | 'challenges' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xp_reward: number;
  coin_reward: number;
  requirement: Record<string, any>;
  rarity: AchievementRarity;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  is_showcased: boolean;
  achievement?: Achievement;
}

export interface SharedAchievement {
  id: string;
  user_id: string;
  user_achievement_id: string;
  share_url: string;
  message?: string;
  views: number;
  created_at: string;
  user_achievement?: UserAchievement;
  profile?: Profile;
}

// Streaks
export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date?: string;
  streak_freeze_until?: string;
  updated_at: string;
}

// =============================================
// VERSION 3 TYPES
// =============================================

// Friends and Social
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type ActivityType = 'level_up' | 'achievement' | 'challenge_completed' | 'streak_milestone' | 'habit_completed';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface PublicProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  is_searchable: boolean;
  friend_code: string;
  created_at: string;
  updated_at: string;
}

export interface FriendActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  is_public: boolean;
  created_at: string;
}

export interface FriendMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Leaderboards and Rankings
export type LeaderboardType = 'global_xp' | 'global_level' | 'global_streak' | 'weekly_xp' | 'monthly_xp' | 'friends_xp';

export interface Leaderboard {
  id: string;
  leaderboard_type: LeaderboardType;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  score: number;
  metadata: Record<string, any>;
  updated_at: string;
}

// Multiplayer Challenges
export type MultiplayerChallengeType = 'co-op' | 'competitive' | 'team_vs_team';
export type MultiplayerMode = 'speed_run' | 'total_habits' | 'streak_battle' | 'boss_raid';
export type ParticipantStatus = 'invited' | 'joined' | 'active' | 'completed' | 'abandoned';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface MultiplayerChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: MultiplayerChallengeType;
  mode: MultiplayerMode;
  max_participants: number;
  min_participants: number;
  entry_cost: number;
  prize_pool: number;
  xp_reward: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_private: boolean;
  invite_code?: string;
  created_by?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface MultiplayerParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  team_id?: string;
  score: number;
  rank?: number;
  status: ParticipantStatus;
  joined_at: string;
  completed_at?: string;
  metadata: Record<string, any>;
}

export interface MultiplayerTeam {
  id: string;
  challenge_id: string;
  name: string;
  color: string;
  captain_id?: string;
  total_score: number;
  rank?: number;
  created_at: string;
}

export interface MultiplayerObjective {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  objective_type: string;
  target_value: number;
  points_reward: number;
  order_index: number;
  metadata: Record<string, any>;
}

export interface MultiplayerInvite {
  id: string;
  challenge_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InviteStatus;
  created_at: string;
  responded_at?: string;
}

export interface MultiplayerChatMessage {
  id: string;
  challenge_id: string;
  user_id: string;
  message: string;
  is_system_message: boolean;
  created_at: string;
}

// New Power-ups and Items
export interface ActiveEffect {
  id: string;
  user_id: string;
  effect_name: string;
  effect_type: EffectType;
  multiplier: number;
  stacks: number;
  activated_at: string;
  expires_at: string;
  source_item?: string;
  metadata: Record<string, any>;
}

export interface ConsumableInventory {
  id: string;
  user_id: string;
  item_key: string;
  quantity: number;
  acquired_at: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

export type CosmeticType = 'avatar_frame' | 'trail' | 'badge' | 'crown' | 'particle_effect' | 'sound_effect';

export interface UnlockedCosmetic {
  id: string;
  user_id: string;
  cosmetic_key: string;
  cosmetic_type: CosmeticType;
  is_equipped: boolean;
  unlocked_at: string;
}

export interface ItemUsageHistory {
  id: string;
  user_id: string;
  item_key: string;
  used_at: string;
  effect_result: Record<string, any>;
  context?: string;
}

export interface ItemCombo {
  id: string;
  name: string;
  description: string;
  required_items: string[];
  combo_effect: Record<string, any>;
  xp_bonus: number;
  coin_bonus: number;
  is_active: boolean;
  created_at: string;
}

export interface SavedCheckpoint {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  coins: number;
  current_streak: number;
  saved_at: string;
  can_restore: boolean;
  restored_at?: string;
}

// Advanced Statistics
export interface DailyStatistics {
  id: string;
  user_id: string;
  date: string;
  total_habits_completed: number;
  total_xp_earned: number;
  total_coins_earned: number;
  habits_by_difficulty: Record<string, number>;
  habits_by_area: Record<string, number>;
  completion_rate: number;
  best_streak: number;
  time_distribution: Record<string, any>;
  created_at: string;
}

export interface WeeklyStatistics {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_habits_completed: number;
  total_xp_earned: number;
  total_coins_earned: number;
  completion_rate: number;
  perfect_days: number;
  best_day?: string;
  worst_day?: string;
  habits_by_area: Record<string, number>;
  level_ups: number;
  achievements_unlocked: number;
  created_at: string;
}

export interface MonthlyStatistics {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_habits_completed: number;
  total_xp_earned: number;
  total_coins_earned: number;
  avg_daily_completion: number;
  best_week_start?: string;
  most_productive_day?: string;
  total_streak_days: number;
  challenges_completed: number;
  shop_purchases: number;
  friends_added: number;
  created_at: string;
}

export interface HabitAnalytics {
  id: string;
  habit_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_completions: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  avg_completion_time?: string;
  most_common_day?: string;
  xp_earned: number;
  consistency_score: number;
  created_at: string;
  updated_at: string;
}

export type InsightType =
  | 'improvement_suggestion'
  | 'achievement_near'
  | 'streak_warning'
  | 'consistency_praise'
  | 'habit_recommendation'
  | 'best_time_suggestion'
  | 'area_balance'
  | 'challenge_suggestion';

export interface UserInsight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  priority: number;
  action_text?: string;
  action_url?: string;
  metadata: Record<string, any>;
  is_dismissed: boolean;
  is_acted_upon: boolean;
  created_at: string;
  expires_at?: string;
}

export type GoalType =
  | 'daily_habits'
  | 'weekly_habits'
  | 'monthly_xp'
  | 'reach_level'
  | 'maintain_streak'
  | 'complete_challenge'
  | 'earn_coins'
  | 'unlock_achievement';

export interface PersonalGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  is_completed: boolean;
  completed_at?: string;
  reward_xp: number;
  reward_coins: number;
  created_at: string;
  updated_at: string;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface UserBenchmark {
  id: string;
  user_id: string;
  metric_name: string;
  user_value: number;
  platform_average: number;
  percentile?: number;
  rank?: number;
  total_users?: number;
  period_type: PeriodType;
  calculated_at: string;
}

export interface BehaviorEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
}

// Wearables Integration
export type WearableProvider =
  | 'google_fit'
  | 'apple_health'
  | 'fitbit'
  | 'garmin'
  | 'samsung_health'
  | 'mi_fit'
  | 'strava'
  | 'whoop';

export type WearableDataType =
  | 'steps'
  | 'distance'
  | 'calories'
  | 'heart_rate'
  | 'sleep'
  | 'active_minutes'
  | 'workout'
  | 'weight'
  | 'water_intake'
  | 'meditation';

export interface WearableConnection {
  id: string;
  user_id: string;
  provider: WearableProvider;
  device_name?: string;
  device_model?: string;
  is_active: boolean;
  last_sync?: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expires_at?: string;
  sync_frequency: number;
  connected_at: string;
  metadata: Record<string, any>;
}

export interface WearableData {
  id: string;
  connection_id: string;
  user_id: string;
  data_type: WearableDataType;
  value: number;
  unit: string;
  recorded_at: string;
  synced_at: string;
  metadata: Record<string, any>;
}

export interface WearableHabitMapping {
  id: string;
  user_id: string;
  habit_id: string;
  data_type: WearableDataType;
  threshold_value: number;
  threshold_operator: string;
  auto_complete: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FitnessGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  xp_reward: number;
  coin_reward: number;
  created_at: string;
}

export interface FitnessAchievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string;
  icon: string;
  data_type: WearableDataType;
  threshold_value: number;
  threshold_type: string;
  xp_reward: number;
  coin_reward: number;
  rarity: AchievementRarity;
  created_at: string;
}

// Pets System
export type PetSpecies = 'yoshi' | 'boo' | 'koopa' | 'toad' | 'chain_chomp' | 'lakitu' | 'shy_guy' | 'goomba' | 'blooper';
export type PetInteractionType = 'feed' | 'play' | 'pet' | 'train' | 'sleep' | 'bathe' | 'adventure' | 'gift';
export type PetAccessorySlot = 'hat' | 'glasses' | 'necklace' | 'wings' | 'tail' | 'body';

export interface PetType {
  id: string;
  pet_key: string;
  name: string;
  description: string;
  species: PetSpecies;
  rarity: AchievementRarity;
  base_happiness: number;
  unlock_requirement: Record<string, any>;
  price: number;
  animations: Record<string, any>;
  colors: Record<string, any>;
  evolution_tree: any[];
  created_at: string;
}

export interface UserPet {
  id: string;
  user_id: string;
  pet_type_id: string;
  nickname?: string;
  level: number;
  xp: number;
  happiness: number;
  hunger: number;
  energy: number;
  is_active: boolean;
  color_variant: string;
  accessories: any[];
  personality_traits: any[];
  adoption_date: string;
  last_interaction: string;
  total_interactions: number;
  evolution_stage: number;
  metadata: Record<string, any>;
}

export interface PetInteraction {
  id: string;
  user_id: string;
  pet_id: string;
  interaction_type: PetInteractionType;
  happiness_change: number;
  hunger_change: number;
  energy_change: number;
  xp_gained: number;
  item_used?: string;
  interaction_result: Record<string, any>;
  created_at: string;
}

export interface PetFood {
  id: string;
  food_key: string;
  name: string;
  description: string;
  icon: string;
  hunger_restore: number;
  happiness_bonus: number;
  energy_bonus: number;
  xp_bonus: number;
  price: number;
  rarity: AchievementRarity;
  special_effects: Record<string, any>;
  created_at: string;
}

export interface PetAccessory {
  id: string;
  accessory_key: string;
  name: string;
  description: string;
  icon: string;
  slot: PetAccessorySlot;
  effect_type?: string;
  effect_value: number;
  price: number;
  rarity: AchievementRarity;
  unlock_requirement: Record<string, any>;
  created_at: string;
}

export interface PetAdventure {
  id: string;
  adventure_key: string;
  name: string;
  description: string;
  difficulty: HabitDifficulty | 'expert';
  duration_minutes: number;
  min_pet_level: number;
  energy_cost: number;
  possible_rewards: any[];
  is_available: boolean;
  created_at: string;
}

export interface ActivePetAdventure {
  id: string;
  user_id: string;
  pet_id: string;
  adventure_id: string;
  started_at: string;
  ends_at: string;
  is_completed: boolean;
  rewards?: any;
  completed_at?: string;
}
