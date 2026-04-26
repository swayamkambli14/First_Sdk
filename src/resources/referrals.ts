// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import * as ReferralsAPI from './referrals';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

/**
 * Referral code lookup, chain visualization, and validation.
 */
export class Referrals extends APIResource {
  /**
   * Shows both directions: who referred this wallet (referred_by), and who this
   * wallet has referred (referred_users).
   *
   * @example
   * ```ts
   * const response = await client.referrals.retrieveChain(
   *   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * );
   * ```
   */
  retrieveChain(wallet: string, options?: RequestOptions): APIPromise<ReferralRetrieveChainResponse> {
    return this._client.get(path`/referrals/${wallet}/chain`, { ...options, __security: {  } });
  }

  /**
   * Returns the wallet's referral code plus a list of all users they referred, with
   * status (pending / confirmed / fraud) and timestamps.
   *
   * @example
   * ```ts
   * const response = await client.referrals.retrieveStats(
   *   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * );
   * ```
   */
  retrieveStats(wallet: string, options?: RequestOptions): APIPromise<ReferralRetrieveStatsResponse> {
    return this._client.get(path`/referrals/${wallet}`, { ...options, __security: {  } });
  }

  /**
   * Public endpoint — no auth required. Check whether a referral code is valid
   * before applying it to a new user.
   *
   * @example
   * ```ts
   * const response = await client.referrals.validateCode(
   *   'CL-W3-A4F9',
   * );
   * ```
   */
  validateCode(code: string, options?: RequestOptions): APIPromise<ReferralValidateCodeResponse> {
    return this._client.post(path`/referrals/validate/${code}`, { ...options, __security: {  } });
  }
}

export interface ReferralEntry {
  created_at: string;

  /**
   * Truncated wallet address (0x1234...abcd)
   */
  referee_wallet: string;

  status: ReferralStatus;

  confirmed_at?: string | null;
}

export type ReferralStatus = 'pending' | 'confirmed' | 'fraud'

export interface ReferralRetrieveChainResponse {
  referred_by: ReferralRetrieveChainResponse.ReferredBy | null;

  referred_users: Array<ReferralEntry>;
}

export namespace ReferralRetrieveChainResponse {
  export interface ReferredBy {
    created_at: string;

    referrer_wallet: string;

    status: ReferralsAPI.ReferralStatus;
  }
}

export interface ReferralRetrieveStatsResponse {
  confirmed_referrals: number;

  pending_referrals: number;

  referral_code: string;

  referrals: Array<ReferralEntry>;

  total_referrals: number;
}

export interface ReferralValidateCodeResponse {
  valid: boolean;

  /**
   * Why the code is invalid (if valid is false)
   */
  reason?: string | null;

  referral_code?: string | null;

  referrer_wallet?: string | null;
}

export declare namespace Referrals {
  export {
    type ReferralEntry as ReferralEntry,
    type ReferralStatus as ReferralStatus,
    type ReferralRetrieveChainResponse as ReferralRetrieveChainResponse,
    type ReferralRetrieveStatsResponse as ReferralRetrieveStatsResponse,
    type ReferralValidateCodeResponse as ReferralValidateCodeResponse
  };
}
