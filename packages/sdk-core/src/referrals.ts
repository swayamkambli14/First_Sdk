import { request } from './http.js';
import { ReferralStats } from './types.js';

export class ReferralsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: () => Record<string, string>,
    private readonly timeout: number,
    private readonly retries: number,
  ) {}

  async getStats(walletAddress: string): Promise<ReferralStats> {
    return request<ReferralStats>(`${this.baseUrl}/v1/referrals/${walletAddress}`, {
      headers: this.headers(), timeout: this.timeout, retries: this.retries,
    });
  }

  async getCode(walletAddress: string): Promise<string> {
    const stats = await this.getStats(walletAddress);
    return stats.referralCode;
  }

  async validate(code: string): Promise<{ valid: boolean; message: string }> {
    return request(`${this.baseUrl}/v1/referrals/validate/${code}`, {
      headers: this.headers(), timeout: this.timeout, retries: this.retries,
    });
  }
}
