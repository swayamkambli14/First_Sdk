/**
 * ChainLoyaltyClient — the main entry point for the @chainloyalty/sdk.
 * Framework-agnostic. Works in Node.js, browsers, and any JS environment.
 *
 * Usage (server-side):
 *   const client = new ChainLoyaltyClient({ apiKey: 'sk_live_...', appId: '...' });
 *   await client.events.track(wallet, 'purchase', { amount: 75 });
 *
 * Usage (browser, after SIWE):
 *   const client = new ChainLoyaltyClient({ appId: '...' });
 *   const rewards = await client.rewards.getHistory(wallet);
 */
import { ChainLoyaltyConfig } from './types.js';
import { EventsClient } from './events.js';
import { RewardsClient } from './rewards.js';
import { ReferralsClient } from './referrals.js';
import { RulesClient } from './rules.js';
import { AuthClient } from './auth.js';
import { LeaderboardClient } from './leaderboard.js';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export class ChainLoyaltyClient {
  readonly events: EventsClient;
  readonly rewards: RewardsClient;
  readonly referrals: ReferralsClient;
  readonly rules: RulesClient;
  readonly auth: AuthClient;
  readonly leaderboard: LeaderboardClient;

  private config: ChainLoyaltyConfig;

  constructor(config: ChainLoyaltyConfig) {
    this.config = {
      baseUrl: DEFAULT_BASE_URL,
      timeout: 10_000,
      retries: 3,
      ...config,
    };

    const baseUrl = this.config.baseUrl!;
    const timeout = this.config.timeout!;
    const retries = this.config.retries!;

    // Headers factory — called per-request so JWT updates are picked up
    const headers = (): Record<string, string> => {
      const h: Record<string, string> = {};
      if (this.config.apiKey) h['Authorization'] = `Bearer ${this.config.apiKey}`;
      if (this.config.jwtToken) h['Authorization'] = `Bearer ${this.config.jwtToken}`;
      if (this.config.appId) h['x-app-id'] = this.config.appId;
      return h;
    };

    this.events = new EventsClient(baseUrl, headers, timeout, retries);
    this.rewards = new RewardsClient(baseUrl, headers, timeout, retries);
    this.referrals = new ReferralsClient(baseUrl, headers, timeout, retries);
    this.rules = new RulesClient(baseUrl, headers, timeout, retries);
    this.auth = new AuthClient(baseUrl, this.config.appId, timeout);
    this.leaderboard = new LeaderboardClient(baseUrl, this.config.appId, headers, timeout, retries);
  }

  /** Update the JWT token (called after SIWE verification) */
  setJwtToken(token: string): void {
    this.config.jwtToken = token;
  }

  /** Get the current config (read-only) */
  getConfig(): Readonly<ChainLoyaltyConfig> {
    return { ...this.config };
  }
}
