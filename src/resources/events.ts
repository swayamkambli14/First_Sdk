// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

/**
 * Server-to-server event ingestion. Requires API key. Events are processed async — poll GET /events/:id for status.
 */
export class Events extends APIResource {
  /**
   * Poll this endpoint after POST /events to check whether the event has been
   * processed and which rule/reward was triggered. Apps can only retrieve their own
   * events.
   *
   * @example
   * ```ts
   * const response = await client.events.retrieveStatus(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   * );
   * ```
   */
  retrieveStatus(eventID: string, options?: RequestOptions): APIPromise<EventRetrieveStatusResponse> {
    return this._client.get(path`/events/${eventID}`, { ...options, __security: { apiKeyAuth: true } });
  }

  /**
   * Main entry point for SaaS apps to report user actions. Returns 202 immediately —
   * processing is async via BullMQ. Poll GET /events/:event_id to check processing
   * status and see which rewards were issued.
   *
   * @example
   * ```ts
   * const response = await client.events.track({
   *   event_type: 'purchase',
   *   wallet_address:
   *     '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   *   metadata: { amount: 49.99, currency: 'USD' },
   * });
   * ```
   */
  track(body: EventTrackParams, options?: RequestOptions): APIPromise<EventTrackResponse> {
    return this._client.post('/events', { body, ...options, __security: { apiKeyAuth: true } });
  }
}

export type EventStatus = 'pending' | 'processed' | 'failed';

/**
 * Product event categories accepted by the rules engine
 */
export type EventType = 'purchase' | 'referral' | 'feature_usage' | 'milestone' | 'subscription';

export interface EventRetrieveStatusResponse {
  event_id: string;

  /**
   * Product event categories accepted by the rules engine
   */
  event_type: EventType;

  status: EventStatus;

  timestamp: string;

  wallet_address: string;

  processed_at?: string | null;
}

export interface EventTrackResponse {
  /**
   * Use this ID to poll GET /events/:event_id for status
   */
  event_id: string;

  status: EventStatus;

  message?: string;
}

export interface EventTrackParams {
  /**
   * Product event categories accepted by the rules engine
   */
  event_type: EventType;

  /**
   * EVM wallet address of the end user
   */
  wallet_address: string;

  /**
   * Optional UUID to deduplicate events. Submitting the same key twice returns the
   * original result without re-processing.
   */
  idempotency_key?: string;

  /**
   * Arbitrary key-value context passed to the rules engine. Examples: { amount:
   * 49.99, currency: "USD" } for purchase, { plan: "pro" } for subscription, {
   * milestone_name: "project_created" } for milestone.
   */
  metadata?: { [key: string]: unknown };

  /**
   * Event time (defaults to server time if omitted)
   */
  timestamp?: string;
}

export declare namespace Events {
  export {
    type EventStatus as EventStatus,
    type EventType as EventType,
    type EventRetrieveStatusResponse as EventRetrieveStatusResponse,
    type EventTrackResponse as EventTrackResponse,
    type EventTrackParams as EventTrackParams,
  };
}
