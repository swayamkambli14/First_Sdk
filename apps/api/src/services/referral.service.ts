import crypto from 'crypto';
import type { Event as PrismaEvent } from '@prisma/client';
import { env } from '../config/env.js';
import {
  createReferral,
  findReferralByReferee,
  findReferralByCode,
  findReferralsByReferrer,
  updateReferralStatus,
  countReferralsByReferrer,
} from '../repositories/referral.repo.js';
import { findUserByWallet, findUserByReferralCode } from '../repositories/user.repo.js';
import { issuePoints } from './reward.service.js';
import { incr, expire } from '../infrastructure/redis.js';
import logger from '../utils/logger.js';

/**
 * Generates a deterministic referral code from a wallet address.
 * HMAC-SHA256 based — same wallet always produces the same code.
 * Not sequential — cannot be enumerated by attackers.
 */
export function generateReferralCode(walletAddress: string): string {
  const hash = crypto
    .createHmac('sha256', env.REFERRAL_SECRET)
    .update(walletAddress.toLowerCase())
    .digest('hex');
  return 'REF-' + hash.substring(0, 8).toUpperCase();
}

/**
 * Called when a new user signs up with a referral code.
 * Creates a pending referral record — rewards are NOT issued yet.
 * Rewards are only issued after a qualifying event (e.g., first purchase).
 */
export async function processNewUserReferral(
  refereeWallet: string,
  referralCode: string
): Promise<void> {
  const referrer = await findUserByReferralCode(referralCode);
  if (!referrer) {
    logger.warn('Referral code not found', { referralCode, referee: refereeWallet });
    return;
  }

  // Self-referral check at creation time
  if (referrer.walletAddress === refereeWallet.toLowerCase()) {
    logger.warn('Self-referral attempt blocked', { wallet: refereeWallet });
    return;
  }

  // Check if referee already has a referral
  const existing = await findReferralByReferee(refereeWallet);
  if (existing) {
    logger.warn('Referee already has a referral', { refereeWallet });
    return;
  }

  await createReferral({
    referrerWallet: referrer.walletAddress,
    refereeWallet: refereeWallet.toLowerCase(),
    referralCode,
  });

  logger.info('Pending referral created', {
    referrer: referrer.walletAddress,
    referee: refereeWallet,
    code: referralCode,
  });
}

/**
 * Processes a referral event — runs all fraud checks and issues rewards if valid.
 * Called by the event worker when event_type === 'referral'.
 */
export async function processReferralEvent(event: PrismaEvent): Promise<void> {
  const metadata = event.metadata as Record<string, unknown>;
  const referralCode = metadata['referral_code'] as string | undefined;

  if (!referralCode) return;

  const referral = await findReferralByCode(referralCode);
  if (!referral) {
    logger.warn('Referral not found for code', { referralCode });
    return;
  }

  if (referral.status !== 'pending') {
    logger.debug('Referral already processed', { referralId: referral.id, status: referral.status });
    return;
  }

  // ── Fraud checks (TRD Section 10.2) ──────────────────────────────────────

  // Check 1: Self-referral
  if (referral.referrerWallet === event.walletAddress.toLowerCase()) {
    await markFraudulent(referral.id, 'Self-referral detected');
    return;
  }

  // Check 2: Already referred
  const existingReferral = await findReferralByReferee(event.walletAddress);
  if (existingReferral && existingReferral.id !== referral.id && existingReferral.status === 'confirmed') {
    await markFraudulent(referral.id, 'Referee already has a confirmed referral');
    return;
  }

  // Check 3: Circular referral — has the referrer ever been referred by the referee?
  const referrerReferral = await findReferralByReferee(referral.referrerWallet);
  if (referrerReferral?.referrerWallet === event.walletAddress.toLowerCase()) {
    await markFraudulent(referral.id, 'Circular referral chain detected');
    return;
  }

  // Check 4: Duplicate qualifying event — was this event already used for another referral?
  const allReferrals = await findReferralsByReferrer(referral.referrerWallet);
  const duplicateEvent = allReferrals.some((r) => r.qualifyingEventId === event.id);
  if (duplicateEvent) {
    await markFraudulent(referral.id, 'Qualifying event already used for another referral');
    return;
  }

  // Check 5: Rate limit — referrer generating too many referrals (Redis counter)
  const rateLimitKey = `referral:rate:${referral.referrerWallet}`;
  const count = await incr(rateLimitKey);
  if (count === 1) {
    await expire(rateLimitKey, 86400); // 24h window
  }
  if (count > 50) {
    logger.warn('Referral rate limit exceeded', { referrer: referral.referrerWallet, count });
    await markFraudulent(referral.id, 'Referrer rate limit exceeded (>50 referrals in 24h)');
    return;
  }

  // ── All checks passed — confirm referral and issue rewards ────────────────
  await updateReferralStatus(referral.id, 'confirmed', event.id);

  // Issue rewards to both parties
  await issuePoints(
    referral.refereeWallet,
    50,
    'Welcome bonus — referred by a friend',
    event.id,
    'referral_referee_bonus'
  );

  await issuePoints(
    referral.referrerWallet,
    100,
    'Referral credit — your friend made their first action',
    event.id,
    'referral_referrer_credit'
  );

  logger.info('Referral confirmed and rewards issued', {
    referralId: referral.id,
    referrer: referral.referrerWallet,
    referee: referral.refereeWallet,
  });
}

async function markFraudulent(referralId: string, reason: string): Promise<void> {
  await updateReferralStatus(referralId, 'fraudulent', undefined, reason);
  logger.warn('Referral marked as fraudulent', { referralId, reason });
}

export async function validateReferralCode(code: string): Promise<{ valid: boolean; message: string }> {
  const referral = await findUserByReferralCode(code);
  if (!referral) {
    return { valid: false, message: 'Referral code not found' };
  }
  return { valid: true, message: 'Valid referral code' };
}
