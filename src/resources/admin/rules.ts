// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as AuthAPI from '../auth';
import * as EventsAPI from '../events';
import * as UsersAPI from '../users';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Internal rules management. Requires ADMIN_SECRET header. Not exposed to SDK consumers — internal tooling only.
 */
export class Rules extends APIResource {
  /**
   * Returns all rules currently loaded from rules.config.json, including
   * enabled/disabled status and priority order.
   *
   * @example
   * ```ts
   * const rules = await client.admin.rules.list();
   * ```
   */
  list(options?: RequestOptions): APIPromise<RuleListResponse> {
    return this._client.get('/admin/rules', { ...options, __security: { adminAuth : true } });
  }

  /**
   * Reloads rules.config.json without restarting the server. Use after editing the
   * config file in production.
   *
   * @example
   * ```ts
   * const response = await client.admin.rules.reload();
   * ```
   */
  reload(options?: RequestOptions): APIPromise<RuleReloadResponse> {
    return this._client.post('/admin/rules/reload', { ...options, __security: { adminAuth : true } });
  }

  /**
   * Returns how many times a rule has been triggered in total and how many unique
   * wallet addresses have triggered it.
   *
   * @example
   * ```ts
   * const response = await client.admin.rules.retrieveStats(
   *   'first_purchase_bonus',
   * );
   * ```
   */
  retrieveStats(id: string, options?: RequestOptions): APIPromise<RuleRetrieveStatsResponse> {
    return this._client.get(path`/admin/rules/${id}/stats`, { ...options, __security: { adminAuth : true } });
  }

  /**
   * Dry-run a specific rule against a mock event and user context. Returns whether
   * the rule would have matched and shows the full evaluation context used — useful
   * for debugging rule conditions.
   *
   * @example
   * ```ts
   * const response = await client.admin.rules.test({
   *   mock_event: {
   *     eventType: 'purchase',
   *     metadata: { amount: 250, currency: 'USD' },
   *   },
   *   mock_user: {
   *     walletAddress:
   *       '0x0000000000000000000000000000000000000001',
   *     currentTier: 'gold',
   *     currentPointsBalance: 2000,
   *     totalPointsEarned: 5000,
   *   },
   *   rule_id: 'high_value_conditional',
   * });
   * ```
   */
  test(body: RuleTestParams, options?: RequestOptions): APIPromise<RuleTestResponse> {
    return this._client.post('/admin/rules/test', { body, ...options, __security: { adminAuth : true } });
  }
}

export interface RuleListResponse {
  enabled: number;

  rules: Array<RuleListResponse.Rule>;

  total: number;
}

export namespace RuleListResponse {
  export interface Rule {
    enabled: boolean;

    name: string;

    priority: number;

    reward_type: UsersAPI.RewardType;

    rule_id: string;

    /**
     * Event type this rule fires on, or '\*' for all events
     */
    trigger_event: string;

    type: 'threshold' | 'frequency' | 'conditional';
  }
}

export interface RuleReloadResponse {
  enabled: number;

  message: string;

  total: number;
}

export interface RuleRetrieveStatsResponse {
  rule_id: string;

  rule_name: string;

  total_triggers: number;

  unique_users: number;
}

export interface RuleTestResponse {
  /**
   * The raw condition group from rules.config.json
   */
  conditions: { [key: string]: unknown };

  /**
   * The full EvalContext built from the mock inputs
   */
  context_used: { [key: string]: unknown };

  /**
   * Whether the rule would have fired given this context
   */
  matched: boolean;

  rule_id: string;

  rule_name: string;
}

export interface RuleTestParams {
  /**
   * Partial Event fields to test against
   */
  mock_event: RuleTestParams.MockEvent;

  /**
   * Partial User fields to test against
   */
  mock_user: RuleTestParams.MockUser;

  rule_id: string;
}

export namespace RuleTestParams {
  /**
   * Partial Event fields to test against
   */
  export interface MockEvent {
    /**
     * Product event categories accepted by the rules engine
     */
    eventType?: EventsAPI.EventType;

    metadata?: { [key: string]: unknown };
  }

  /**
   * Partial User fields to test against
   */
  export interface MockUser {
    currentPointsBalance?: number;

    currentTier?: AuthAPI.Tier;

    totalPointsEarned?: number;

    walletAddress?: string;
  }
}

export declare namespace Rules {
  export {
    type RuleListResponse as RuleListResponse,
    type RuleReloadResponse as RuleReloadResponse,
    type RuleRetrieveStatsResponse as RuleRetrieveStatsResponse,
    type RuleTestResponse as RuleTestResponse,
    type RuleTestParams as RuleTestParams
  };
}
