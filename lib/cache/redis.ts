/**
 * Redis caching utilities using Upstash Redis
 * Provides simple get/set/delete operations with TTL support
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client (will use environment variables)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Cache configuration for different data types
 */
export const CACHE_TTL = {
  FEED: 5 * 60, // 5 minutes for article feeds
  ARTICLE: 15 * 60, // 15 minutes for individual articles
  CATEGORIES: 30 * 60, // 30 minutes for category list
  USER_PREFERENCES: 10 * 60, // 10 minutes for user preferences
  TRENDING: 2 * 60, // 2 minutes for trending articles
  SOURCES: 60 * 60, // 1 hour for source list
} as const;

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

/**
 * Get value from cache
 */
export async function getCached<T>(key: string, options?: CacheOptions): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    const value = await redis.get<T>(fullKey);
    return value;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options?.ttl || CACHE_TTL.FEED;

    await redis.setex(fullKey, ttl, value);
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string, options?: CacheOptions): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    await redis.del(fullKey);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Redis pattern invalidation error:', error);
    return 0;
  }
}

/**
 * Get or set pattern - fetches from cache or executes function and caches result
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, fetch and cache
  const value = await fetchFn();
  await setCached(key, value, options);
  return value;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Export redis instance for advanced usage
 */
export { redis };
