// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { buildHeaders } from '../internal/headers';
import { RequestOptions } from '../internal/request-options';

/**
 * SIWE wallet authentication. Two-step: request nonce → sign message → verify signature → receive JWT cookie.
 */
export class Auth extends APIResource {
  /**
   * Blacklists the current JWT jti in Redis and clears the cookie. The token cannot
   * be reused even if it hasn't expired yet.
   *
   * @example
   * ```ts
   * const response = await client.auth.logout();
   * ```
   */
  logout(options?: RequestOptions): APIPromise<AuthLogoutResponse> {
    return this._client.post('/auth/logout', { ...options, __security: {  } });
  }

  /**
   * Step 1 of wallet authentication. Returns a one-time nonce and a pre-formatted
   * EIP-4361 message for the wallet to sign.
   *
   * @example
   * ```ts
   * const response = await client.auth.requestNonce({
   *   wallet_address:
   *     '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * });
   * ```
   */
  requestNonce(body: AuthRequestNonceParams, options?: RequestOptions): APIPromise<AuthRequestNonceResponse> {
    return this._client.post('/auth/nonce', { body, ...options, __security: {  } });
  }

  /**
   * Returns the wallet profile for the currently authenticated user.
   *
   * @example
   * ```ts
   * const userProfile = await client.auth.retrieveProfile();
   * ```
   */
  retrieveProfile(options?: RequestOptions): APIPromise<UserProfile> {
    return this._client.get('/auth/me', { ...options, __security: {  } });
  }

  /**
   * Step 2 of wallet authentication. Verifies the SIWE signature and sets a
   * chainloyalty_token httpOnly cookie. Pass x-app-id header to scope the user to a
   * specific registered app.
   *
   * @example
   * ```ts
   * const userProfile = await client.auth.verifySignature({
   *   signature: '0xabcdef...',
   *   wallet_address:
   *     '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   * });
   * ```
   */
  verifySignature(params: AuthVerifySignatureParams, options?: RequestOptions): APIPromise<UserProfile> {
    const { 'x-app-id': xAppID, ...body } = params
    return this._client.post('/auth/verify', { body, ...options, headers: buildHeaders([{...(xAppID != null ? { 'x-app-id': xAppID } : undefined)}, options?.headers]), __security: {  } });
  }
}

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface UserProfile {
  badge_count: number;

  /**
   * Current points balance as string (BigInt safe)
   */
  current_points: string;

  first_seen_at: string;

  last_active_at: string;

  referral_code: string;

  tier: Tier;

  /**
   * Lifetime total points earned as string (BigInt safe)
   */
  total_points_earned: string;

  /**
   * Checksummed EVM wallet address
   */
  wallet_address: string;
}

export interface AuthLogoutResponse {
  message?: string;
}

export interface AuthRequestNonceResponse {
  /**
   * Full EIP-4361 SIWE message for the wallet to sign
   */
  message: string;

  /**
   * One-time random nonce stored in Redis
   */
  nonce: string;
}

export interface AuthRequestNonceParams {
  wallet_address: string;
}

export interface AuthVerifySignatureParams {
  /**
   * Body param: Hex signature from eth_sign / personal_sign
   */
  signature: string;

  /**
   * Body param
   */
  wallet_address: string;

  /**
   * Header param: App ID to scope this user session. Defaults to 'default' if
   * omitted.
   */
  'x-app-id'?: string;
}

export declare namespace Auth {
  export {
    type Tier as Tier,
    type UserProfile as UserProfile,
    type AuthLogoutResponse as AuthLogoutResponse,
    type AuthRequestNonceResponse as AuthRequestNonceResponse,
    type AuthRequestNonceParams as AuthRequestNonceParams,
    type AuthVerifySignatureParams as AuthVerifySignatureParams
  };
}
