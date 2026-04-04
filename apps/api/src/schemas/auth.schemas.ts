import { z } from 'zod';

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const NonceRequestSchema = z.object({
  wallet_address: z
    .string()
    .regex(WALLET_REGEX, 'Invalid Ethereum wallet address — must be 0x followed by 40 hex chars'),
});

export const VerifyRequestSchema = z.object({
  wallet_address: z
    .string()
    .regex(WALLET_REGEX, 'Invalid Ethereum wallet address'),
  signature: z
    .string()
    .min(1, 'Signature is required'),
});

export type NonceRequest = z.infer<typeof NonceRequestSchema>;
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
