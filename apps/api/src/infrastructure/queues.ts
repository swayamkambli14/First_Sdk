import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedis } from './redis.js';
import logger from '../utils/logger.js';

const connection = { url: process.env['REDIS_URL'] ?? 'redis://localhost:6379' };

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 500 },
};

// ── Event Processing Queue ────────────────────────────────────────────────────
export const eventProcessingQueue = new Queue('event-processing', {
  connection,
  defaultJobOptions,
});

// ── Badge Minting Queue (blockchain — slower, isolated) ───────────────────────
export const badgeMintingQueue = new Queue('badge-minting', {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5, // more retries for blockchain ops
    backoff: { type: 'exponential' as const, delay: 5000 },
  },
});

// ── Webhook Retry Queue ───────────────────────────────────────────────────────
export const webhookRetryQueue = new Queue('webhook-retry', {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 30000 }, // retry after 30s
  },
});

// Log failed jobs after all retries are exhausted
function attachFailureLogger(queue: Queue, queueName: string) {
  const events = new QueueEvents(queueName, { connection });
  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed after all retries`, {
      queue: queueName,
      jobId,
      reason: failedReason,
    });
  });
}

attachFailureLogger(eventProcessingQueue, 'event-processing');
attachFailureLogger(badgeMintingQueue, 'badge-minting');
attachFailureLogger(webhookRetryQueue, 'webhook-retry');
