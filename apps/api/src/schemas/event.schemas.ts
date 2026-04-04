import { z } from 'zod';

// Exact schema from TRD Section 6.2
export const EventSchema = z.object({
  wallet_address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  event_type: z.enum([
    'purchase',
    'referral',
    'feature_usage',
    'milestone',
    'subscription',
  ]),
  metadata: z.record(z.unknown()).optional().default({}),
  idempotency_key: z.string().uuid('idempotency_key must be a UUID').optional(),
  timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
});

export type EventPayload = z.infer<typeof EventSchema>;
