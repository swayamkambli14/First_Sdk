import { cleanEnv, str, num, bool, url } from 'envalid';

/**
 * Validates all required environment variables at startup.
 * The server will refuse to start with a clear error if any variable
 * is missing or has the wrong type — prevents silent misconfigurations.
 */
export const env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: num({ default: 3000 }),
  API_VERSION: str({ default: 'v1' }),

  // Database
  DATABASE_URL: url({ docs: 'PostgreSQL connection string' }),

  // Redis
  REDIS_URL: url({ docs: 'Redis connection string' }),

  // Auth
  JWT_SECRET: str({ docs: 'Generate with: openssl rand -hex 32' }),
  JWT_EXPIRY_HOURS: num({ default: 24 }),
  REFERRAL_SECRET: str({ docs: 'Generate with: openssl rand -hex 32' }),

  // Admin
  ADMIN_SECRET: str({ docs: 'Secret for /v1/admin/* routes' }),

  // Blockchain
  BLOCKCHAIN_RPC_URL: url({ docs: 'Sepolia RPC URL from Infura or Alchemy' }),
  DEPLOYER_PRIVATE_KEY: str({ docs: 'Private key of the minter wallet — NEVER commit' }),
  BADGE_NFT_CONTRACT_ADDRESS: str({ default: '0x0000000000000000000000000000000000000000' }),
  BLOCKCHAIN_MINTING_ENABLED: bool({ default: false }),

  // Rate Limiting
  RATE_LIMIT_EVENTS_PER_MIN: num({ default: 1000 }),
  RATE_LIMIT_AUTH_PER_MIN: num({ default: 20 }),

  // Webhooks
  WEBHOOK_SECRET: str({ docs: 'HMAC-SHA256 signing secret for outbound webhooks' }),
  WEBHOOK_TIMEOUT_MS: num({ default: 5000 }),

  // Rules Engine
  RULES_CONFIG_PATH: str({ default: './src/config/rules.config.json' }),
  FORMULA_MAX_POINTS: num({ default: 100000 }),
});
