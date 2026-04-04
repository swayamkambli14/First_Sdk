import { Worker, Job } from 'bullmq';
import { mintBadgeOnChain } from '../blockchain/badge-minter.js';
import { updateOnChainStatus } from '../repositories/reward.repo.js';
import logger from '../utils/logger.js';

interface BadgeMintJob {
  walletAddress: string;
  badgeId: string;
  rewardId: string;
}

/**
 * BullMQ worker for on-chain badge minting.
 * Runs in isolation from the main event pipeline — blockchain ops are slow.
 * On all retries exhausted: marks the reward record with on_chain_status: 'failed'.
 */
export function startBadgeMinterWorker(): Worker {
  const worker = new Worker<BadgeMintJob>(
    'badge-minting',
    async (job: Job<BadgeMintJob>) => {
      const { walletAddress, badgeId, rewardId } = job.data;

      logger.info('Processing badge mint job', {
        walletAddress,
        badgeId,
        rewardId,
        attempt: job.attemptsMade + 1,
      });

      const txHash = await mintBadgeOnChain(walletAddress, badgeId, rewardId);

      if (txHash) {
        logger.info('Badge minted on-chain', { txHash, walletAddress, badgeId });
      } else {
        // mintBadgeOnChain already logged the error and updated DB
        // Throw to trigger BullMQ retry
        throw new Error(`On-chain minting failed for badge ${badgeId} wallet ${walletAddress}`);
      }
    },
    {
      connection: { url: process.env['REDIS_URL'] ?? 'redis://localhost:6379' },
      concurrency: 2, // Blockchain ops are slow — limit concurrency
    }
  );

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 5) - 1) {
      // All retries exhausted — mark as permanently failed
      logger.error('Badge minting permanently failed after all retries', {
        walletAddress: job.data.walletAddress,
        badgeId: job.data.badgeId,
        rewardId: job.data.rewardId,
        error: err.message,
      });

      try {
        await updateOnChainStatus(job.data.rewardId, '', 'failed');
      } catch (updateErr) {
        logger.error('Failed to update on-chain status', { error: updateErr });
      }
    }
  });

  logger.info('Badge minter worker started');
  return worker;
}
