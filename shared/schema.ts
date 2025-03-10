import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Base User System
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  role: text("role").default("user"),
  experience: integer("experience").default(0),
  level: integer("level").default(1),
  reputation: integer("reputation").default(0),
  avatar: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  profileData: jsonb("profile_data"),
});

// Quest System
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'nft_mint', 'token_stake', 'governance', etc.
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  reward: text("reward").notNull(),
  rewardType: text("reward_type").notNull(), // 'token', 'nft', 'xp', 'badge'
  rewardAmount: decimal("reward_amount"),
  contractAddress: text("contract_address"),
  chainId: integer("chain_id"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  requirements: jsonb("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
});

// User Quest Progress
export const userQuests = pgTable("user_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  questId: integer("quest_id").references(() => quests.id),
  status: text("status").default("in_progress"), // 'in_progress', 'completed', 'failed'
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  txHash: text("tx_hash"),
  reward: jsonb("reward_data"),
});

// Teams/Guilds
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  leaderId: integer("leader_id").references(() => users.id),
  avatar: text("avatar_url"),
  level: integer("level").default(1),
  reputation: integer("reputation").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Members
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").default("member"), // 'leader', 'officer', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Achievements/Badges
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image_url"),
  requirements: jsonb("requirements"),
  type: text("type").notNull(), // 'quest', 'social', 'team'
  rarity: text("rarity").notNull(), // 'common', 'rare', 'epic', 'legendary'
});

// User Achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Social Connections
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  friendId: integer("friend_id").references(() => users.id),
  status: text("status").default("pending"), // 'pending', 'accepted', 'blocked'
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  content: text("content").notNull(),
  type: text("type").default("text"), // 'text', 'image', 'system'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quests: many(userQuests),
  achievements: many(userAchievements),
  teams: many(teamMembers),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));

export const questsRelations = relations(quests, ({ many, one }) => ({
  users: many(userQuests),
  creator: one(users, {
    fields: [quests.createdBy],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(teamMembers),
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
  }),
  messages: many(messages),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});
export const insertTeamSchema = createInsertSchema(teams);
export const insertMessageSchema = createInsertSchema(messages);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type UserQuest = typeof userQuests.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;