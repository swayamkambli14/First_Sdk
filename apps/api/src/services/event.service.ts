import { setex, get } from '../infrastructure/redis.js';
import { eventProcessingQueue } from '../infrastructure/queues.js';
import { createEvent } from '../repositories/event.repo.js';
import { upsertUser } from '../repositories/user.repo.js';
import logger from '../utils/logger.js';

const IDEMPOTENCY_TTL = 86400; // 24 hours

interface IngestPayload {
  wallet_address: string;
  event_type: string;
  metadata: Record<string, unknown>;
  idempotency_key?: string;
  timestamp?: string;
}

interface IngestResult {
  event_id: string;
  status: string;
}

/**
 * Ingests an event from a SaaS app.
 * Returns immediately after queuing — heavy processing is async via BullMQ.
 */
export async function ingestEvent(
  payload: IngestPayload,
  appId: string
): Promise<IngestResult> {
  // Normalize wallet address to lowercase — all DB operations use lowercase
  const walletAddress = payload.wallet_address.toLowerCase();

  // Check idempotency key — return cached response if this is a duplicate request
  if (payload.idempotency_key) {
    const cacheKey = `idempotency:${payload.idempotency_key}`;
    const cached = await get(cacheKey);
    if (cached) {
      logger.debug('Idempotency cache hit', { key: payload.idempotency_key });
      return JSON.parse(cached) as IngestResult;
    }
  }

  // Upsert user — creates the user record if this is their first event
  await upsertUser(walletAddress, appId);

  // Write event to DB with status 'pending'
  const event = await createEvent({
    walletAddress,
    appId,
    eventType: payload.event_type,
    metadata: payload.metadata,
    idempotencyKey: payload.idempotency_key,
    timestamp: payload.timestamp ? new Date(payload.timestamp) : undefined,
  });

  // Push job to BullMQ — worker will run rules engine + issue rewards asynchronously
  await eventProcessingQueue.add('process-event', { event_id: event.id });

  const result: IngestResult = { event_id: event.id, status: 'queued' };

  // Cache the response for idempotency
  if (payload.idempotency_key) {
    await setex(
      `idempotency:${payload.idempotency_key}`,
      IDEMPOTENCY_TTL,
      JSON.stringify(result)
    );
  }

  logger.info('Event ingested', { event_id: event.id, event_type: payload.event_type, wallet: walletAddress });

  return result;
}
