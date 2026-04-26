// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import * as AuthAPI from './auth';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';

/**
 * Public points leaderboard scoped by app_id.
 */
export class Leaderboard extends APIResource {
  /**
   * Public endpoint — no auth required. app_id is required to scope the leaderboard
   * to a specific SaaS integration. Supports all_time, monthly, and weekly periods.
   */
  retrieve(query: LeaderboardRetrieveParams, options?: RequestOptions): APIPromise<LeaderboardRetrieveResponse> {
    return this._client.get('/leaderboard', { query, ...options, __security: {  } });
  }
}

export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly'

export interface LeaderboardRetrieveResponse {
  leaderboard: Array<LeaderboardRetrieveResponse.Leaderboard>;

  limit: number;

  period: LeaderboardPeriod;
}

export namespace LeaderboardRetrieveResponse {
  export interface Leaderboard {
    /**
     * Points as string (BigInt safe)
     */
    current_points: string;

    rank: number;

    tier: AuthAPI.Tier;

    wallet_address: string;
  }
}

export interface LeaderboardRetrieveParams {
  /**
   * App ID to scope the leaderboard (required)
   */
  app_id: string;

  /**
   * Number of entries to return
   */
  limit?: number;

  /**
   * Time period for ranking calculation (default: all_time)
   */
  period?: LeaderboardPeriod;
}

export declare namespace Leaderboard {
  export {
    type LeaderboardPeriod as LeaderboardPeriod,
    type LeaderboardRetrieveResponse as LeaderboardRetrieveResponse,
    type LeaderboardRetrieveParams as LeaderboardRetrieveParams
  };
}
