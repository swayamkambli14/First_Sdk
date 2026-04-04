import { request } from './http.js';
import { Leaderboard, LeaderboardPeriod } from './types.js';

export class LeaderboardClient {
  constructor(
    private readonly baseUrl: string,
    private readonly appId: string,
    private readonly headers: () => Record<string, string>,
    private readonly timeout: number,
    private readonly retries: number,
  ) {}

  async get(period: LeaderboardPeriod = 'all_time', limit = 10): Promise<Leaderboard> {
    return request<Leaderboard>(
      `${this.baseUrl}/v1/leaderboard?app_id=${this.appId}&period=${period}&limit=${limit}`,
      { headers: this.headers(), timeout: this.timeout, retries: this.retries },
    );
  }
}
