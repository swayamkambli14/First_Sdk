// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as KeysAPI from './keys';
import { KeyRotateResponse, Keys } from './keys';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * App registration and API key lifecycle management.
 */
export class Apps extends APIResource {
  keys: KeysAPI.Keys = new KeysAPI.Keys(this._client);

  /**
   * Returns app metadata. API key hash is never included.
   *
   * @example
   * ```ts
   * const app = await client.apps.retrieve(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   * );
   * ```
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<AppRetrieveResponse> {
    return this._client.get(path`/apps/${id}`, { ...options, __security: {} });
  }

  /**
   * Creates a new ChainLoyalty app integration and returns the raw API key. The raw
   * API key is shown ONCE in this response — it is never stored and cannot be
   * retrieved again. Save it immediately.
   *
   * @example
   * ```ts
   * const response = await client.apps.register({
   *   name: 'My SaaS App',
   * });
   * ```
   */
  register(body: AppRegisterParams, options?: RequestOptions): APIPromise<AppRegisterResponse> {
    return this._client.post('/apps/register', { body, ...options, __security: {} });
  }

  /**
   * Sets or updates the webhook endpoint for reward event notifications.
   *
   * @example
   * ```ts
   * const response = await client.apps.updateWebhook(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *   {
   *     webhook_url: 'https://myapp.com/webhooks/chainloyalty',
   *   },
   * );
   * ```
   */
  updateWebhook(
    id: string,
    body: AppUpdateWebhookParams,
    options?: RequestOptions,
  ): APIPromise<AppUpdateWebhookResponse> {
    return this._client.put(path`/apps/${id}/webhook`, { body, ...options, __security: {} });
  }
}

export interface AppRetrieveResponse {
  app_id: string;

  created_at: string;

  is_active: boolean;

  name: string;

  webhook_url?: string | null;
}

export interface AppRegisterResponse {
  /**
   * Raw API key — shown ONCE, never stored. Save this immediately. Format:
   * sk*live*<64 hex chars>
   */
  api_key: string;

  app_id: string;

  created_at: string;

  name: string;
}

export interface AppUpdateWebhookResponse {
  app_id?: string;

  webhook_url?: string;
}

export interface AppRegisterParams {
  name: string;

  webhook_url?: string | null;
}

export interface AppUpdateWebhookParams {
  webhook_url: string;
}

Apps.Keys = Keys;

export declare namespace Apps {
  export {
    type AppRetrieveResponse as AppRetrieveResponse,
    type AppRegisterResponse as AppRegisterResponse,
    type AppUpdateWebhookResponse as AppUpdateWebhookResponse,
    type AppRegisterParams as AppRegisterParams,
    type AppUpdateWebhookParams as AppUpdateWebhookParams,
  };

  export { Keys as Keys, type KeyRotateResponse as KeyRotateResponse };
}
