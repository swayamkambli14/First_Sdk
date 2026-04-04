import crypto from 'crypto';
import { findAppById } from '../repositories/app.repo.js';
import { get, setex } from '../infrastructure/redis.js';
import { webhookRetryQueue } from '../infrastructure/queues.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const APP_CACHE_TTL = 300; // 5 minutes

/**
 * Dispatches a signed webhook POST to the SaaS app's configured webhook URL.
 * Signs the payload with HMAC-SHA256 so the receiver can verify authenticity.
 * On failure, queues a retry after 30 seconds.
 */
export async function dispatch(appId: string, payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = await getWebhookUrl(appId);
  if (!webhookUrl) {
    logger.debug('No webhook URL configured for app', { appId });
    return;
  }

  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.WEBHOOK_TIMEOUT_MS);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ChainLoyalty-Signature': signature,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    logger.info('Webhook dispatched', {
      appId,
      event_id: payload['event_id'],
      status: response.status,
      url: webhookUrl,
    });
  } catch (err) {
    logger.warn('Webhook dispatch failed — queuing retry', {
      appId,
      event_id: payload['event_id'],
      error: err instanceof Error ? err.message : String(err),
    });

    // Queue a single retry after 30 seconds
    await webhookRetryQueue.add('retry-webhook', { appId, payload });
  }
}

/**
 * Gets the webhook URL for an app, with Redis caching to avoid DB hits on every event.
 */
async function getWebhookUrl(appId: string): Promise<string | null> {
  const cacheKey = `app:webhook:${appId}`;
  const cached = await get(cacheKey);
  if (cached !== null) return cached || null;

  const app = await findAppById(appId);
  const url = app?.webhookUrl ?? '';

  await setex(cacheKey, APP_CACHE_TTL, url);
  return url || null;
}
