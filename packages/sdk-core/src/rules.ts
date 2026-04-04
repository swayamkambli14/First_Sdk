import { request } from './http.js';
import {
  BusinessRule,
  CreateRuleInput,
  BusinessTierConfig,
} from './types.js';

export class RulesClient {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: () => Record<string, string>,
    private readonly timeout: number,
    private readonly retries: number,
  ) {}

  async list(): Promise<BusinessRule[]> {
    const res = await request<{ rules: BusinessRule[] }>(
      `${this.baseUrl}/v1/business/rules`,
      { headers: this.headers(), timeout: this.timeout, retries: this.retries },
    );
    return res.rules;
  }

  async create(input: CreateRuleInput): Promise<BusinessRule> {
    const res = await request<{ rule: BusinessRule }>(
      `${this.baseUrl}/v1/business/rules`,
      { method: 'POST', body: input, headers: this.headers(), timeout: this.timeout, retries: 0 },
    );
    return res.rule;
  }

  async update(ruleId: string, input: Partial<CreateRuleInput>): Promise<BusinessRule> {
    const res = await request<{ rule: BusinessRule }>(
      `${this.baseUrl}/v1/business/rules/${ruleId}`,
      { method: 'PUT', body: input, headers: this.headers(), timeout: this.timeout, retries: 0 },
    );
    return res.rule;
  }

  async delete(ruleId: string): Promise<void> {
    await request(`${this.baseUrl}/v1/business/rules/${ruleId}`, {
      method: 'DELETE', headers: this.headers(), timeout: this.timeout, retries: 0,
    });
  }

  async toggle(ruleId: string, enabled: boolean): Promise<BusinessRule> {
    const res = await request<{ rule: BusinessRule }>(
      `${this.baseUrl}/v1/business/rules/${ruleId}/toggle`,
      { method: 'PATCH', body: { enabled }, headers: this.headers(), timeout: this.timeout, retries: 0 },
    );
    return res.rule;
  }

  async getTierConfig(): Promise<BusinessTierConfig> {
    return request<BusinessTierConfig>(`${this.baseUrl}/v1/business/tiers`, {
      headers: this.headers(), timeout: this.timeout, retries: this.retries,
    });
  }

  async updateTierConfig(config: Partial<BusinessTierConfig>): Promise<BusinessTierConfig> {
    return request<BusinessTierConfig>(`${this.baseUrl}/v1/business/tiers`, {
      method: 'PUT',
      body: {
        currency_name: config.currencyName,
        tiers: config.tiers,
        spin_pools: config.spinPools,
      },
      headers: this.headers(),
      timeout: this.timeout,
      retries: 0,
    });
  }
}
