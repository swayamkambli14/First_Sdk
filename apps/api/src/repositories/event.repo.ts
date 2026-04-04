import { PrismaClient, type Event as PrismaEvent } from '@prisma/client';

const prisma = new PrismaClient();

export async function createEvent(data: {
  walletAddress: string;
  appId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  idempotencyKey?: string;
  timestamp?: Date;
}): Promise<PrismaEvent> {
  return prisma.event.create({
    data: {
      walletAddress: data.walletAddress,
      appId: data.appId,
      eventType: data.eventType,
      metadata: data.metadata,
      idempotencyKey: data.idempotencyKey,
      timestamp: data.timestamp ?? new Date(),
      status: 'pending',
    },
  });
}

export async function findEventById(id: string): Promise<PrismaEvent | null> {
  return prisma.event.findUnique({ where: { id } });
}

export async function markEventProcessed(id: string): Promise<void> {
  await prisma.event.update({
    where: { id },
    data: { status: 'completed', processedAt: new Date() },
  });
}

export async function markEventFailed(id: string): Promise<void> {
  await prisma.event.update({
    where: { id },
    data: { status: 'failed' },
  });
}

/**
 * Returns a count of events per event_type for a given wallet.
 * Used by the rules engine to check lifetime event counts.
 */
export async function countEventsByType(
  walletAddress: string
): Promise<Record<string, number>> {
  const results = await prisma.event.groupBy({
    by: ['eventType'],
    where: { walletAddress: walletAddress.toLowerCase(), status: 'completed' },
    _count: { eventType: true },
  });

  return results.reduce<Record<string, number>>((acc, row) => {
    acc[row.eventType] = row._count.eventType;
    return acc;
  }, {});
}

/**
 * Counts events for a wallet in the last N days.
 * Used by frequency rules (e.g., "5+ events in 7 days").
 */
export async function countEventsInWindow(
  walletAddress: string,
  days: number
): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.event.count({
    where: {
      walletAddress: walletAddress.toLowerCase(),
      timestamp: { gte: since },
      status: 'completed',
    },
  });
}

/**
 * Aggregates numeric fields from event metadata per event type.
 * Example result: { purchase: { amount: 350 }, subscription: { count: 2 } }
 * Used by threshold rules (e.g., "total purchase amount >= $500").
 */
export async function getCumulativeMetadata(
  walletAddress: string
): Promise<Record<string, Record<string, number>>> {
  const events = await prisma.event.findMany({
    where: { walletAddress: walletAddress.toLowerCase(), status: 'completed' },
    select: { eventType: true, metadata: true },
  });

  const result: Record<string, Record<string, number>> = {};

  for (const event of events) {
    const meta = event.metadata as Record<string, unknown>;
    if (!result[event.eventType]) result[event.eventType] = {};

    // Aggregate all numeric fields in metadata
    for (const [key, value] of Object.entries(meta)) {
      if (typeof value === 'number') {
        result[event.eventType]![key] = (result[event.eventType]![key] ?? 0) + value;
      }
    }
  }

  return result;
}

export async function findDuplicateIdempotencyKey(key: string): Promise<boolean> {
  const count = await prisma.event.count({ where: { idempotencyKey: key } });
  return count > 0;
}
