import { ethers } from 'ethers';
import { getSigner } from './provider.js';
import { env } from '../config/env.js';
import { updateOnChainStatus } from '../repositories/reward.repo.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Minimal ABI — only the functions we call
const BADGE_NFT_ABI = [
  'function mint(address to, uint256 badgeTypeId, string calldata uri) external',
  'function balanceOf(address account, uint256 id) external view returns (uint256)',
  'event BadgeMinted(address indexed recipient, uint256 indexed badgeTypeId, string uri)',
];

/**
 * Derives a deterministic uint256 badge type ID from a string badge ID.
 * Uses keccak256 hash truncated to fit in uint256.
 */
function deriveBadgeTypeId(badgeId: string): bigint {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(badgeId));
  // Take first 31 bytes to stay safely within uint256 range
  return BigInt(hash) % (2n ** 248n);
}

/**
 * Mints a badge NFT on-chain for a wallet address.
 * On error: logs the failure but does NOT throw — badge still exists off-chain.
 * Sets a retry flag in the DB for manual recovery if needed.
 */
export async function mintBadgeOnChain(
  walletAddress: string,
  badgeId: string,
  rewardId: string
): Promise<string | null> {
  try {
    const signer = getSigner();
    const contract = new ethers.Contract(
      env.BADGE_NFT_CONTRACT_ADDRESS,
      BADGE_NFT_ABI,
      signer
    );

    // Get badge URI from badge_definitions
    const badgeDef = await prisma.badgeDefinition.findUnique({ where: { badgeId } });
    const uri = badgeDef?.imageUrl ?? `https://chainloyalty.io/badges/${badgeId}.json`;

    const badgeTypeId = deriveBadgeTypeId(badgeId);

    logger.info('Minting badge on-chain', {
      wallet: walletAddress,
      badgeId,
      badgeTypeId: badgeTypeId.toString(),
      contract: env.BADGE_NFT_CONTRACT_ADDRESS,
    });

    const tx = await (contract['mint'] as (
      to: string,
      id: bigint,
      uri: string
    ) => Promise<ethers.TransactionResponse>)(walletAddress, badgeTypeId, uri);

    // Wait for 1 confirmation
    await tx.wait(1);

    await updateOnChainStatus(rewardId, tx.hash, 'confirmed');

    logger.info('Badge minted on-chain', {
      txHash: tx.hash,
      wallet: walletAddress,
      badgeId,
    });

    return tx.hash;
  } catch (err) {
    // Do NOT throw — badge exists off-chain, on-chain minting is best-effort
    logger.error('On-chain badge minting failed', {
      wallet: walletAddress,
      badgeId,
      rewardId,
      error: err instanceof Error ? err.message : String(err),
    });

    await updateOnChainStatus(rewardId, '', 'failed');
    return null;
  }
}
