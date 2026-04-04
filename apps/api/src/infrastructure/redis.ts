import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

let redisClient: Redis | null = null;

/**
 * Returns a singleton Redis client.
 * Upstash uses rediss:// (TLS) — ioredis handles this automatically from the URL.
 * On connection error, logs and retries with backoff — does NOT crash the server.
 */
export function getRedis(): Redis {
  if (redisClient) return redisClient;

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    // Upstash requires TLS — enable when URL starts with rediss://
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    reconnectOnError(err: Error) {
      logger.error('Redis connection error', { error: err.message });
      return true;
    },
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err: Error) => logger.error('Redis error', { error: err.message }));

  redisClient = client;
  return redisClient;
}

export async function setex(key: string, ttlSeconds: number, value: string): Promise<void> {
  await getRedis().setex(key, ttlSeconds, value);
}

export async function get(key: string): Promise<string | null> {
  return getRedis().get(key);
}

export async function del(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function incr(key: string): Promise<number> {
  return getRedis().incr(key);
}

export async function expire(key: string, ttlSeconds: number): Promise<void> {
  await getRedis().expire(key, ttlSeconds);
}
