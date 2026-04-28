// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * App registration and API key lifecycle management.
 */
export class Keys extends APIResource {
  /**
   * Revokes the current API key and issues a new one. The new raw key is shown once
   * in the response. Update your environment variables immediately — the old key
   * stops working instantly.
   *
   * @example
   * ```ts
   * const response = await client.apps.keys.rotate(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   * );
   * ```
   */
  rotate(id: string, options?: RequestOptions): APIPromise<KeyRotateResponse> {
    return this._client.post(path`/apps/${id}/keys/rotate`, { ...options, __security: {} });
  }
}

export interface KeyRotateResponse {
  app_id: string;

  message: string;

  /**
   * New raw API key — shown once. Previous key is now revoked.
   */
  new_api_key: string;
}

export declare namespace Keys {
  export { type KeyRotateResponse as KeyRotateResponse };
}
