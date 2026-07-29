/**
 * redis.ts — Redis client برای caching RAG results
 * ──────────────────────────────────────────────────────────────────
 * Host: 192.168.1.46:7617
 * Prefix: iwcs_offl_ms_frontend_
 * ──────────────────────────────────────────────────────────────────
 */

import { Redis } from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || '192.168.1.46';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '7617', 10);
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'iwcs_offl_ms_frontend_';

// Singleton Redis client
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    try {
      redisClient = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('[Redis] Max retry attempts reached, disabling cache');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      redisClient.on('error', (err) => {
        console.warn('[Redis] Connection error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected to', REDIS_HOST, REDIS_PORT);
      });

      redisClient.connect().catch((err) => {
        console.warn('[Redis] Failed to connect:', err.message);
        redisClient = null;
      });
    } catch (err) {
      console.warn('[Redis] Failed to initialize:', err);
      return null;
    }
  }
  return redisClient;
}

/**
 * Get cached value from Redis
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const fullKey = `${REDIS_PREFIX}${key}`;
    const value = await client.get(fullKey);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.warn('[Redis] Get error:', err);
    return null;
  }
}

/**
 * Set cached value in Redis with TTL
 */
export async function redisSet<T>(key: string, value: T, ttlSeconds = 300): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const fullKey = `${REDIS_PREFIX}${key}`;
    await client.setex(fullKey, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[Redis] Set error:', err);
    return false;
  }
}

/**
 * Delete cached value from Redis
 */
export async function redisDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const fullKey = `${REDIS_PREFIX}${key}`;
    await client.del(fullKey);
    return true;
  } catch (err) {
    console.warn('[Redis] Del error:', err);
    return false;
  }
}

/**
 * Generate cache key for RAG search
 */
export function ragCacheKey(query: string, count: number): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, '_').slice(0, 100);
  return `rag:${normalized}:${count}`;
}
