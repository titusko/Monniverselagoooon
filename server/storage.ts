import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { type Quest, type InsertQuest, quests } from "@shared/schema";
import { type UserQuest, userQuests } from "@shared/schema";


// keep IStorage the same but add sessionStore
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
  sessionStore: session.Store;
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
      .values(insertQuest)
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
}

export const storage = new DatabaseStorage();