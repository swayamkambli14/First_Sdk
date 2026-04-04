import { request } from './http.js';
import { TrackEventInput, TrackEventResult } from './types.js';

export class EventsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: () => Record<string, string>,
    private readonly timeout: number,
    private readonly retries: number,
  ) {}

  /** Submit a product event to ChainLoyalty */
  async track(
    walletAddress: string,
    eventType: string,
    metadata: Record<string, unknown> = {},
    options?: { idempotencyKey?: string; timestamp?: string }
  ): Promise<TrackEventResult> {
    const payload: TrackEventInput = {
      walletAddress,
      eventType,
      metadata,
      idempotencyKey: options?.idempotencyKey,
      timestamp: options?.timestamp,
    };

    return request<TrackEventResult>(`${this.baseUrl}/v1/events`, {
      method: 'POST',
      body: {
        wallet_address: payload.walletAddress,
        event_type: payload.eventType,
        metadata: payload.metadata,
        idempotency_key: payload.idempotencyKey,
        timestamp: payload.timestamp,
      },
      headers: this.headers(),
      timeout: this.timeout,
      retries: this.retries,
    });
  }
}
