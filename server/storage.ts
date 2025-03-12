import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import {
  type Quest,
  type InsertQuest,
  quests,
  type Team,
  type InsertTeam,
  teams,
  type TeamMember,
  teamMembers,
  type Achievement,
  achievements,
  userAchievements,
  type UserQuest,
  userQuests,
} from "@shared/schema";
import { messages, type Message } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: number, walletAddress: string | null): Promise<User>;
  getAllQuests(): Promise<Quest[]>;
  getUserQuests(userId: number): Promise<UserQuest[]>;
  getQuest(id: number): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  completeQuest(userId: number, questId: number): Promise<UserQuest>;
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<typeof userAchievements.$inferSelect[]>;
  checkAndUpdateAchievements(userId: number): Promise<void>;
  sessionStore: session.Store;
  createTeam(team: InsertTeam): Promise<Team>;
  getUserTeams(userId: number): Promise<Team[]>;
  getTeam(teamId: number): Promise<Team | undefined>;
  addTeamMember(member: Omit<TeamMember, "id">): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<void>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMessages(teamId: number): Promise<Message[]>;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserWallet(userId: number, walletAddress: string | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ walletAddress })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllQuests(): Promise<Quest[]> {
    return await db.select().from(quests);
  }

  async getUserQuests(userId: number): Promise<UserQuest[]> {
    return await db
      .select()
      .from(userQuests)
      .where(eq(userQuests.userId, userId));
  }

  async getQuest(id: number): Promise<Quest | undefined> {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    return quest;
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const [quest] = await db
      .insert(quests)
      .values({
        ...insertQuest,
        rewardAmount: String(insertQuest.rewardAmount)
      })
      .returning();
    return quest;
  }

  async completeQuest(userId: number, questId: number): Promise<UserQuest> {
    const now = new Date();
    const [userQuest] = await db
      .insert(userQuests)
      .values({
        userId,
        questId,
        completed: true,
        completedAt: now,
      })
      .returning();
    return userQuest;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<typeof userAchievements.$inferSelect[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async checkAndUpdateAchievements(userId: number): Promise<void> {
    // Get user's current state
    const [user, completedQuests, teamMemberships] = await Promise.all([
      this.getUser(userId),
      this.getUserQuests(userId),
      this.getUserTeams(userId),
    ]);

    if (!user) return;

    // Check for quest-related achievements
    const questCount = completedQuests.filter(q => q.completed).length;
    if (questCount >= 10) {
      await this.unlockAchievement(userId, 1); // QUEST_MASTER achievement id
    }

    // Check for web3-related achievements
    if (user.walletAddress) {
      await this.unlockAchievement(userId, 2); // WEB3_PIONEER achievement id
    }

    // Check for team-related achievements
    if (teamMemberships.length > 0) {
      await this.unlockAchievement(userId, 3); // TEAM_PLAYER achievement id
    }
  }

  private async unlockAchievement(userId: number, achievementId: number): Promise<void> {
    const exists = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );

    if (exists.length === 0) {
      await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          unlockedAt: new Date(),
        });
    }
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        leaderId: teams.leaderId,
        avatar: teams.avatar,
        level: teams.level,
        reputation: teams.reputation,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, userId));

    return result;
  }

  async getTeam(teamId: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    return team;
  }

  async addTeamMember(member: Omit<TeamMember, "id">): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
  }
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  }
  async getTeamMessages(teamId: number): Promise<Message[]> {
    const result = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        teamId: messages.teamId,
        receiverId: messages.receiverId,
      })
      .from(messages)
      .where(eq(messages.teamId, teamId))
      .orderBy(messages.createdAt);

    return result;
  }
}

export const storage = new DatabaseStorage();