import { z } from 'zod';

// Environment variable management
export const ENV = {
  // Server
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Ethereum Configuration
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
  ETHEREUM_QUEST_CONTRACT: process.env.ETHEREUM_QUEST_CONTRACT || "",
  ETHEREUM_BADGE_CONTRACT: process.env.ETHEREUM_BADGE_CONTRACT || "",
  
  // Polygon Configuration
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/demo",
  POLYGON_QUEST_CONTRACT: process.env.POLYGON_QUEST_CONTRACT || "",
  POLYGON_BADGE_CONTRACT: process.env.POLYGON_BADGE_CONTRACT || "",
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-for-dev-only",
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/monniverse",
}

const envSchema = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(1),
});

// Validate required environment variables
export function validateEnvironment() {
  const env = envSchema.safeParse(process.env);
  
  if (!env.success) {
    console.error('Invalid environment variables:', env.error.format());
    process.exit(1);
  }

  return env.data;
}

declare namespace Express {
  interface User {
    id: string;
    isAdmin: boolean;
  }
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}
