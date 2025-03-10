
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

// Validate required environment variables
export function validateEnvironment() {
  const missingVars = [];
  
  if (ENV.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET) missingVars.push("JWT_SECRET");
    if (!process.env.DATABASE_URL) missingVars.push("DATABASE_URL");
  }
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(", ")}`);
  }
}
