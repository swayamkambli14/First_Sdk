import { ethers } from 'ethers';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;

/**
 * Returns a lazily-initialized ethers provider.
 * Only connects when first needed — avoids startup failures if blockchain is unavailable.
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (provider) return provider;

  provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);

  provider.on('error', (err: Error) => {
    logger.error('Blockchain provider error', { error: err.message });
  });

  return provider;
}

/**
 * Returns a lazily-initialized wallet signer for the deployer/minter account.
 * The private key is loaded from env — never hardcoded.
 */
export function getSigner(): ethers.Wallet {
  if (signer) return signer;

  signer = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, getProvider());
  return signer;
}
