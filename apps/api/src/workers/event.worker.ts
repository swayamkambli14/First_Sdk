import { Worker, Job } from 'bullmq';
import { findEventById, markEventProcessed, markEventFailed } from '../repositories/event.repo.js';
import { evaluate } from '../services/rules.engine.js';
import { issue } from '../services/reward.service.js';
import logger from '../utils/logger.js';

interface EventJob {
  event_id: string;
}

/**
 * BullMQ worker that processes events asynchronously.
 * This is the core async pipeline: event → rules → rewards → webhook → websocket.
 */
export function startEventWorker(): Worker {
  const worker = new Worker<EventJob>(
    'event-processing',
    async (job: Job<EventJob>) => {
      const { event_id } = job.data;
      logger.info('Processing event job', { event_id, attempt: job.attemptsMade + 1 });

      // Step 1: Load event from DB
      const event = await findEventById(event_id);
      if (!event) {
        logger.error('Event not found in worker', { event_id });
        return; // Don't retry — event doesn't exist
      }

      try {
        // Step 2: Run Rules Engine — get reward instructions
        const instructions = await evaluate(event);

        // Step 3: Execute each reward instruction
        for (const instruction of instructions) {
          await issue(instruction, event);
        }

        // Step 4: If referral event, process referral chain
        if (event.eventType === 'referral') {
          // Lazy import to avoid circular dependency
          const { processReferralEvent } = await import('../services/referral.service.js');
          await processReferralEvent(event);
        }

        // Step 5: Mark event as processed
        await markEventProcessed(event_id);

        // Step 6: Dispatch webhook to SaaS app
        const { dispatch } = await import('../services/webhook.service.js');
        await dispatch(event.appId, {
          event_id,
          event_type: event.eventType,
          wallet_address: event.walletAddress,
          rewards_issued: instructions,
        });

        // Step 7: Emit WebSocket event to wallet room
        const { emitToWallet } = await import('../infrastructure/websocket.js');
        for (const instruction of instructions) {
          emitToWallet(event.walletAddress, 'reward_earned', instruction);
        }

        logger.info('Event processed successfully', {
          event_id,
          rewards_count: instructions.length,
        });
      } catch (err) {
        // Mark event as failed — BullMQ will retry based on job options
        await markEventFailed(event_id);
        logger.error('Event processing failed', {
          event_id,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
        throw err; // Rethrow so BullMQ handles retry
      }
    },
    {
      connection: { url: process.env['REDIS_URL'] ?? 'redis://localhost:6379' },
      concurrency: 5, // Process up to 5 events simultaneously
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Event job failed after all retries', {
      job_id: job?.id,
      event_id: job?.data.event_id,
      error: err.message,
    });
  });

  logger.info('Event worker started');
  return worker;
}
