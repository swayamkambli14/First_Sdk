// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import * as AuthAPI from './auth';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

/**
 * Wallet profiles, points balances, reward history, and badge inventory. Requires JWT cookie (customer-facing).
 */
export class Users extends APIResource {
  /**
   * Returns all badge-type rewards for the wallet, enriched with badge definitions
   * (name, description, image_url, rarity). on_chain_tx_hash is populated if the
   * badge has been minted as an NFT.
   *
   * @example
   * ```ts
   * const response = await client.users.listBadges(
   *   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * );
   * ```
   */
  listBadges(wallet: string, options?: RequestOptions): APIPromise<UserListBadgesResponse> {
    return this._client.get(path`/users/${wallet}/badges`, { ...options, __security: {  } });
  }

  /**
   * All rewards (points, badges, probabilistic) for a wallet, newest first.
   *
   * @example
   * ```ts
   * const response = await client.users.listRewards(
   *   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * );
   * ```
   */
  listRewards(wallet: string, query: UserListRewardsParams | null | undefined = {}, options?: RequestOptions): APIPromise<UserListRewardsResponse> {
    return this._client.get(path`/users/${wallet}/rewards`, { query, ...options, __security: {  } });
  }

  /**
   * Returns the current points balance and the last 20 points-type reward entries
   * for the wallet.
   *
   * @example
   * ```ts
   * const response = await client.users.retrievePoints(
   *   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * );
   * ```
   */
  retrievePoints(wallet: string, options?: RequestOptions): APIPromise<UserRetrievePointsResponse> {
    return this._client.get(path`/users/${wallet}/points`, { ...options, __security: {  } });
  }

  /**
   * Full loyalty profile: tier, current points, total points earned, badge count,
   * referral code, and activity timestamps.
   *
   * @example
   * ```ts
   * const userProfile = await client.users.retrieveProfile(
   *   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * );
   * ```
   */
  retrieveProfile(wallet: string, options?: RequestOptions): APIPromise<AuthAPI.UserProfile> {
    return this._client.get(path`/users/${wallet}/profile`, { ...options, __security: {  } });
  }
}

export interface Reward {
  id: string;

  issued_at: string;

  reward_type: RewardType;

  /**
   * JSONB payload — shape depends on reward_type: points → { amount: 100 } badge → {
   * badge_id: "power_buyer" } probabilistic → { spin_pool_id: "subscription_pool",
   * result: {...} }
   */
  reward_value: { [key: string]: unknown };

  rule_id: string;

  wallet_address: string;

  event_id?: string | null;

  on_chain_status?: 'pending' | 'confirmed' | 'failed' | null;

  /**
   * Blockchain transaction hash if badge minted on-chain
   */
  on_chain_tx_hash?: string | null;

  reason?: string | null;
}

export type RewardType = 'points' | 'badge' | 'probabilistic'

export interface UserListBadgesResponse {
  badges: Array<UserListBadgesResponse.Badge>;
}

export namespace UserListBadgesResponse {
  export interface Badge {
    badge_id: string;

    earned_at: string;

    name: string;

    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

    reward_id: string;

    description?: string | null;

    image_url?: string | null;

    on_chain_tx_hash?: string | null;
  }
}

export interface UserListRewardsResponse {
  limit: number;

  offset: number;

  rewards: Array<Reward>;
}

export interface UserRetrievePointsResponse {
  /**
   * Current points balance as string (BigInt safe)
   */
  balance: string;

  history: Array<Reward>;
}

export interface UserListRewardsParams {
  /**
   * Number of records to return (capped at 100)
   */
  limit?: number;

  /**
   * Number of records to skip for pagination
   */
  offset?: number;
}

export declare namespace Users {
  export {
    type Reward as Reward,
    type RewardType as RewardType,
    type UserListBadgesResponse as UserListBadgesResponse,
    type UserListRewardsResponse as UserListRewardsResponse,
    type UserRetrievePointsResponse as UserRetrievePointsResponse,
    type UserListRewardsParams as UserListRewardsParams
  };
}
