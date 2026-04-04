import { request } from './http.js';
import { PointsBalance, Badge, RewardHistory, UserProfile } from './types.js';

export class RewardsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: () => Record<string, string>,
    private readonly timeout: number,
    private readonly retries: number,
  ) {}

  async getBalance(walletAddress: string): Promise<PointsBalance> {
    return request<PointsBalance>(`${this.baseUrl}/v1/users/${walletAddress}/points`, {
      headers: this.headers(), timeout: this.timeout, retries: this.retries,
    });
  }

  async getHistory(walletAddress: string, limit = 20, offset = 0): Promise<RewardHistory> {
    return request<RewardHistory>(
      `${this.baseUrl}/v1/users/${walletAddress}/rewards?limit=${limit}&offset=${offset}`,
      { headers: this.headers(), timeout: this.timeout, retries: this.retries },
    );
  }

  async getBadges(walletAddress: string): Promise<Badge[]> {
    const res = await request<{ badges: Badge[] }>(
      `${this.baseUrl}/v1/users/${walletAddress}/badges`,
      { headers: this.headers(), timeout: this.timeout, retries: this.retries },
    );
    return res.badges;
  }

  async getProfile(walletAddress: string): Promise<UserProfile> {
    return request<UserProfile>(`${this.baseUrl}/v1/users/${walletAddress}/profile`, {
      headers: this.headers(), timeout: this.timeout, retries: this.retries,
    });
  }
}
