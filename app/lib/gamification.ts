import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum AchievementType {
  MILESTONE = 'milestone',
  STREAK = 'streak',
  CHALLENGE = 'challenge',
  COLLECTION = 'collection',
  SOCIAL = 'social',
  PERFORMANCE = 'performance',
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum QuestStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
}

export enum RewardType {
  POINTS = 'points',
  BADGE = 'badge',
  ITEM = 'item',
  DISCOUNT = 'discount',
  PREMIUM = 'premium',
  CUSTOM = 'custom',
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon: string;
  rarity: BadgeRarity;
  points: number;
  requirements: AchievementRequirement[];
  rewards: Reward[];
  hidden: boolean;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface AchievementRequirement {
  id: string;
  type: string;
  target: number;
  current?: number;
  completed?: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  claimedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: string;
  earnedBy: number;
  active: boolean;
  createdAt: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: string;
  displayed: boolean;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  objectives: QuestObjective[];
  rewards: Reward[];
  startDate?: string;
  endDate?: string;
  repeatable: boolean;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: string;
  target: number;
  current?: number;
  completed?: boolean;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: QuestStatus;
  progress: Record<string, number>;
  startedAt: string;
  completedAt?: string;
  claimedAt?: string;
  expiresAt?: string;
}

export interface Reward {
  type: RewardType;
  value: any;
  metadata?: Record<string, any>;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: 'points' | 'achievements' | 'quests' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  metric: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  change?: number;
  badges: string[];
}

export interface UserLevel {
  userId: string;
  level: number;
  experience: number;
  experienceToNext: number;
  title: string;
  perks: string[];
}

export interface Level {
  level: number;
  title: string;
  experienceRequired: number;
  perks: string[];
  icon?: string;
}

export interface Streak {
  userId: string;
  type: string;
  current: number;
  longest: number;
  lastActivityDate: string;
  startDate: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'solo' | 'team' | 'competitive';
  objective: string;
  target: number;
  startDate: string;
  endDate: string;
  rewards: Reward[];
  participants: number;
  maxParticipants?: number;
  active: boolean;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  rank?: number;
  completed: boolean;
  joinedAt: string;
  completedAt?: string;
}

export interface DailyReward {
  day: number;
  reward: Reward;
  claimed: boolean;
}

export interface GamificationStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalBadges: number;
  earnedBadges: number;
  totalQuests: number;
  completedQuests: number;
  totalPoints: number;
  activeUsers: number;
  topPlayers: LeaderboardEntry[];
  popularAchievements: Array<{
    achievementId: string;
    name: string;
    unlockedBy: number;
  }>;
}

class GamificationSystem {
  private static instance: GamificationSystem;

  private constructor() {}

  static getInstance(): GamificationSystem {
    if (!GamificationSystem.instance) {
      GamificationSystem.instance = new GamificationSystem();
    }
    return GamificationSystem.instance;
  }

  // Create achievement
  async createAchievement(achievement: Omit<Achievement, 'id' | 'createdAt'>): Promise<Achievement> {
    try {
      const achievementData = {
        name: achievement.name,
        description: achievement.description,
        type: achievement.type,
        icon: achievement.icon,
        rarity: achievement.rarity,
        points: achievement.points,
        requirements: achievement.requirements,
        rewards: achievement.rewards,
        hidden: achievement.hidden,
        order: achievement.order,
        active: achievement.active,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('achievements')
        .insert(achievementData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToAchievement(data);
    } catch (error: any) {
      console.error('Failed to create achievement:', error);
      throw error;
    }
  }

  // Get achievements
  async getAchievements(includeHidden: boolean = false): Promise<Achievement[]> {
    try {
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('active', true);

      if (!includeHidden) {
        query = query.eq('hidden', false);
      }

      query = query.order('order', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToAchievement);
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  // Get user achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToUserAchievement);
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }

  // Track progress
  async trackProgress(userId: string, achievementId: string, delta: number = 1): Promise<boolean> {
    try {
      const achievement = await this.getAchievement(achievementId);

      if (!achievement) return false;

      // Get or create user achievement
      let { data: userAchievement } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (!userAchievement) {
        const { data: newAchievement } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress: 0,
            completed: false,
          })
          .select()
          .single();

        userAchievement = newAchievement;
      }

      if (!userAchievement || userAchievement.completed) return false;

      // Update progress
      const newProgress = userAchievement.progress + delta;
      const totalRequired = achievement.requirements.reduce((sum, req) => sum + req.target, 0);
      const completed = newProgress >= totalRequired;

      const updates: any = {
        progress: newProgress,
        completed,
      };

      if (completed) {
        updates.completed_at = new Date().toISOString();
      }

      await supabase
        .from('user_achievements')
        .update(updates)
        .eq('user_id', userId)
        .eq('achievement_id', achievementId);

      // Grant rewards if completed
      if (completed) {
        await this.grantRewards(userId, achievement.rewards);
      }

      return completed;
    } catch (error) {
      console.error('Failed to track progress:', error);
      return false;
    }
  }

  // Award badge
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      // Check if already earned
      const { data: existing } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (existing) return false;

      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
        displayed: false,
      });

      // Increment earned count
      await supabase.rpc('increment_badge_earned', { badge_id_param: badgeId });

      return true;
    } catch (error) {
      console.error('Failed to award badge:', error);
      return false;
    }
  }

  // Get user badges
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      if (!userBadges || userBadges.length === 0) return [];

      const badgeIds = userBadges.map(ub => ub.badge_id);

      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .in('id', badgeIds);

      return (badges || []).map(this.mapToBadge);
    } catch (error) {
      console.error('Failed to get user badges:', error);
      return [];
    }
  }

  // Create quest
  async createQuest(quest: Omit<Quest, 'id' | 'createdAt'>): Promise<Quest> {
    try {
      const questData = {
        name: quest.name,
        description: quest.description,
        type: quest.type,
        difficulty: quest.difficulty,
        objectives: quest.objectives,
        rewards: quest.rewards,
        start_date: quest.startDate,
        end_date: quest.endDate,
        repeatable: quest.repeatable,
        order: quest.order,
        active: quest.active,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('quests')
        .insert(questData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToQuest(data);
    } catch (error: any) {
      console.error('Failed to create quest:', error);
      throw error;
    }
  }

  // Get available quests
  async getAvailableQuests(userId: string, type?: string): Promise<Quest[]> {
    try {
      let query = supabase
        .from('quests')
        .select('*')
        .eq('active', true);

      if (type) {
        query = query.eq('type', type);
      }

      const now = new Date().toISOString();
      query = query
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);

      const { data, error } = await query;

      if (error) throw error;

      // Filter out completed non-repeatable quests
      const quests = (data || []).map(this.mapToQuest);
      const { data: userQuests } = await supabase
        .from('user_quests')
        .select('quest_id, status')
        .eq('user_id', userId);

      const completedNonRepeatableIds = new Set(
        userQuests
          ?.filter(uq => uq.status === QuestStatus.COMPLETED || uq.status === QuestStatus.CLAIMED)
          .map(uq => uq.quest_id) || []
      );

      return quests.filter(q => q.repeatable || !completedNonRepeatableIds.has(q.id));
    } catch (error) {
      console.error('Failed to get available quests:', error);
      return [];
    }
  }

  // Start quest
  async startQuest(userId: string, questId: string): Promise<UserQuest | null> {
    try {
      const quest = await this.getQuest(questId);

      if (!quest) return null;

      // Check if already started
      const { data: existing } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .eq('status', QuestStatus.IN_PROGRESS)
        .single();

      if (existing) return this.mapToUserQuest(existing);

      const expiresAt = quest.endDate || (quest.type === 'daily' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined);

      const userQuestData = {
        user_id: userId,
        quest_id: questId,
        status: QuestStatus.IN_PROGRESS,
        progress: {},
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
      };

      const { data, error } = await supabase
        .from('user_quests')
        .insert(userQuestData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToUserQuest(data);
    } catch (error) {
      console.error('Failed to start quest:', error);
      return null;
    }
  }

  // Update quest progress
  async updateQuestProgress(userId: string, questId: string, objectiveId: string, delta: number = 1): Promise<boolean> {
    try {
      const { data: userQuest } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .eq('status', QuestStatus.IN_PROGRESS)
        .single();

      if (!userQuest) return false;

      const progress = userQuest.progress || {};
      progress[objectiveId] = (progress[objectiveId] || 0) + delta;

      const quest = await this.getQuest(questId);
      if (!quest) return false;

      // Check if all objectives completed
      const allCompleted = quest.objectives.every(obj => 
        (progress[obj.id] || 0) >= obj.target
      );

      const updates: any = {
        progress,
      };

      if (allCompleted) {
        updates.status = QuestStatus.COMPLETED;
        updates.completed_at = new Date().toISOString();
      }

      await supabase
        .from('user_quests')
        .update(updates)
        .eq('user_id', userId)
        .eq('quest_id', questId);

      return allCompleted;
    } catch (error) {
      console.error('Failed to update quest progress:', error);
      return false;
    }
  }

  // Claim quest rewards
  async claimQuestRewards(userId: string, questId: string): Promise<boolean> {
    try {
      const { data: userQuest } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .eq('status', QuestStatus.COMPLETED)
        .single();

      if (!userQuest) return false;

      const quest = await this.getQuest(questId);
      if (!quest) return false;

      // Grant rewards
      await this.grantRewards(userId, quest.rewards);

      // Update status
      await supabase
        .from('user_quests')
        .update({
          status: QuestStatus.CLAIMED,
          claimed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('quest_id', questId);

      return true;
    } catch (error) {
      console.error('Failed to claim quest rewards:', error);
      return false;
    }
  }

  // Get leaderboard
  async getLeaderboard(leaderboardId: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard', {
          leaderboard_id_param: leaderboardId,
          limit_param: limit,
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  // Get user level
  async getUserLevel(userId: string): Promise<UserLevel> {
    try {
      const { data: user } = await supabase
        .from('user_gamification')
        .select('experience, level')
        .eq('user_id', userId)
        .single();

      const experience = user?.experience || 0;
      const currentLevel = user?.level || 1;

      const levelConfig = await this.getLevelConfig(currentLevel);
      const nextLevelConfig = await this.getLevelConfig(currentLevel + 1);

      const experienceToNext = nextLevelConfig
        ? nextLevelConfig.experienceRequired - experience
        : 0;

      return {
        userId,
        level: currentLevel,
        experience,
        experienceToNext,
        title: levelConfig?.title || 'Novice',
        perks: levelConfig?.perks || [],
      };
    } catch (error) {
      console.error('Failed to get user level:', error);
      return {
        userId,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        title: 'Novice',
        perks: [],
      };
    }
  }

  // Add experience
  async addExperience(userId: string, amount: number): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();

      const currentExp = user?.experience || 0;
      const currentLevel = user?.level || 1;
      const newExp = currentExp + amount;

      // Check for level up
      let newLevel = currentLevel;
      let levelConfig = await this.getLevelConfig(newLevel + 1);

      while (levelConfig && newExp >= levelConfig.experienceRequired) {
        newLevel++;
        levelConfig = await this.getLevelConfig(newLevel + 1);
      }

      if (user) {
        await supabase
          .from('user_gamification')
          .update({
            experience: newExp,
            level: newLevel,
          })
          .eq('user_id', userId);
      } else {
        await supabase.from('user_gamification').insert({
          user_id: userId,
          experience: newExp,
          level: newLevel,
        });
      }

      // Grant level up rewards
      if (newLevel > currentLevel) {
        for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) {
          await this.grantLevelRewards(userId, lvl);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to add experience:', error);
      return false;
    }
  }

  // Update streak
  async updateStreak(userId: string, type: string): Promise<Streak> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .single();

      if (!streak) {
        // Create new streak
        const newStreak = {
          user_id: userId,
          type,
          current: 1,
          longest: 1,
          last_activity_date: today,
          start_date: today,
        };

        await supabase.from('streaks').insert(newStreak);

        return {
          userId,
          type,
          current: 1,
          longest: 1,
          lastActivityDate: today,
          startDate: today,
        };
      }

      const lastDate = new Date(streak.last_activity_date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      let newCurrent = streak.current;
      let newLongest = streak.longest;

      if (daysDiff === 0) {
        // Same day, no change
      } else if (daysDiff === 1) {
        // Consecutive day
        newCurrent = streak.current + 1;
        newLongest = Math.max(newLongest, newCurrent);
      } else {
        // Streak broken
        newCurrent = 1;
      }

      await supabase
        .from('streaks')
        .update({
          current: newCurrent,
          longest: newLongest,
          last_activity_date: today,
        })
        .eq('user_id', userId)
        .eq('type', type);

      return {
        userId,
        type,
        current: newCurrent,
        longest: newLongest,
        lastActivityDate: today,
        startDate: streak.start_date,
      };
    } catch (error) {
      console.error('Failed to update streak:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics(): Promise<GamificationStats> {
    try {
      const { data: achievements } = await supabase.from('achievements').select('*');
      const { data: badges } = await supabase.from('badges').select('*');
      const { data: quests } = await supabase.from('quests').select('*');
      const { data: userAchievements } = await supabase.from('user_achievements').select('*');
      const { data: userGamification } = await supabase.from('user_gamification').select('experience');

      const totalPoints = userGamification?.reduce((sum, u) => sum + (u.experience || 0), 0) || 0;

      return {
        totalAchievements: achievements?.length || 0,
        unlockedAchievements: userAchievements?.filter(ua => ua.completed).length || 0,
        totalBadges: badges?.length || 0,
        earnedBadges: 0,
        totalQuests: quests?.length || 0,
        completedQuests: 0,
        totalPoints,
        activeUsers: userGamification?.length || 0,
        topPlayers: [],
        popularAchievements: [],
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalAchievements: 0,
        unlockedAchievements: 0,
        totalBadges: 0,
        earnedBadges: 0,
        totalQuests: 0,
        completedQuests: 0,
        totalPoints: 0,
        activeUsers: 0,
        topPlayers: [],
        popularAchievements: [],
      };
    }
  }

  // Helper methods
  private async getAchievement(achievementId: string): Promise<Achievement | null> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (error || !data) return null;

      return this.mapToAchievement(data);
    } catch (error) {
      return null;
    }
  }

  private async getQuest(questId: string): Promise<Quest | null> {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (error || !data) return null;

      return this.mapToQuest(data);
    } catch (error) {
      return null;
    }
  }

  private async getLevelConfig(level: number): Promise<Level | null> {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('level', level)
        .single();

      if (error || !data) return null;

      return {
        level: data.level,
        title: data.title,
        experienceRequired: data.experience_required,
        perks: data.perks,
        icon: data.icon,
      };
    } catch (error) {
      return null;
    }
  }

  private async grantRewards(userId: string, rewards: Reward[]): Promise<void> {
    try {
      for (const reward of rewards) {
        switch (reward.type) {
          case RewardType.POINTS:
            await this.addExperience(userId, reward.value);
            break;
          case RewardType.BADGE:
            await this.awardBadge(userId, reward.value);
            break;
          // Add more reward types as needed
        }
      }
    } catch (error) {
      console.error('Failed to grant rewards:', error);
    }
  }

  private async grantLevelRewards(userId: string, level: number): Promise<void> {
    try {
      const levelConfig = await this.getLevelConfig(level);
      if (!levelConfig) return;

      // Grant level-specific rewards
      // This could include badges, items, etc.
    } catch (error) {
      console.error('Failed to grant level rewards:', error);
    }
  }

  private mapToAchievement(data: any): Achievement {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      icon: data.icon,
      rarity: data.rarity,
      points: data.points,
      requirements: data.requirements,
      rewards: data.rewards,
      hidden: data.hidden,
      order: data.order,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  private mapToUserAchievement(data: any): UserAchievement {
    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      progress: data.progress,
      completed: data.completed,
      claimedAt: data.claimed_at,
      completedAt: data.completed_at,
      metadata: data.metadata,
    };
  }

  private mapToBadge(data: any): Badge {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      rarity: data.rarity,
      category: data.category,
      earnedBy: data.earned_by,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  private mapToQuest(data: any): Quest {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      objectives: data.objectives,
      rewards: data.rewards,
      startDate: data.start_date,
      endDate: data.end_date,
      repeatable: data.repeatable,
      order: data.order,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  private mapToUserQuest(data: any): UserQuest {
    return {
      id: data.id,
      userId: data.user_id,
      questId: data.quest_id,
      status: data.status,
      progress: data.progress,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      claimedAt: data.claimed_at,
      expiresAt: data.expires_at,
    };
  }
}

// Export singleton instance
export const gamification = GamificationSystem.getInstance();

// Convenience functions
export const createAchievement = (achievement: any) => gamification.createAchievement(achievement);
export const getAchievements = (includeHidden?: boolean) => gamification.getAchievements(includeHidden);
export const getUserAchievements = (userId: string) => gamification.getUserAchievements(userId);
export const trackAchievementProgress = (userId: string, achievementId: string, delta?: number) =>
  gamification.trackProgress(userId, achievementId, delta);
export const awardBadge = (userId: string, badgeId: string) => gamification.awardBadge(userId, badgeId);
export const createQuest = (quest: any) => gamification.createQuest(quest);
export const getAvailableQuests = (userId: string, type?: string) => gamification.getAvailableQuests(userId, type);
export const startQuest = (userId: string, questId: string) => gamification.startQuest(userId, questId);
export const getUserLevel = (userId: string) => gamification.getUserLevel(userId);
export const addExperience = (userId: string, amount: number) => gamification.addExperience(userId, amount);
export const updateStreak = (userId: string, type: string) => gamification.updateStreak(userId, type);
export const getLeaderboard = (leaderboardId: string, limit?: number) => gamification.getLeaderboard(leaderboardId, limit);

