import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMITS } from '@/lib/constants';

/**
 * Rate limiter for API endpoints
 * Uses Upstash Redis for distributed rate limiting
 * Falls back to in-memory limiting for development
 */

// Check if Upstash Redis is configured
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Rate limiter for ingestion API endpoint
 * Limits: 10 requests per 60 seconds
 */
export const ingestionRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.INGESTION_REQUESTS,
        `${RATE_LIMITS.INGESTION_WINDOW}s`
      ),
      analytics: true,
      prefix: 'ratelimit:ingestion',
    })
  : createMockRateLimiter(RATE_LIMITS.INGESTION_REQUESTS);

/**
 * Rate limiter for general API endpoints
 * Limits: 100 requests per 60 seconds
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.API_REQUESTS, `${RATE_LIMITS.API_WINDOW}s`),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : createMockRateLimiter(RATE_LIMITS.API_REQUESTS);

/**
 * Creates a mock rate limiter for development (no Redis)
 */
function createMockRateLimiter(limit: number) {
  const requests = new Map<string, number[]>();

  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const windowMs = 60000; // 1 minute

      // Get or create request timestamps for this identifier
      const timestamps = requests.get(identifier) || [];

      // Filter out old requests outside the window
      const recentRequests = timestamps.filter((time) => now - time < windowMs);

      if (recentRequests.length >= limit) {
        const oldestRequest = Math.min(...recentRequests);
        const resetTime = oldestRequest + windowMs;

        return {
          success: false,
          limit,
          remaining: 0,
          reset: Math.floor(resetTime / 1000),
        };
      }

      // Add current request
      recentRequests.push(now);
      requests.set(identifier, recentRequests);

      return {
        success: true,
        limit,
        remaining: limit - recentRequests.length,
        reset: Math.floor((now + windowMs) / 1000),
      };
    },
    resetKey: async (identifier: string) => {
      requests.delete(identifier);
    },
  };
}

/**
 * Helper to check rate limit and return appropriate response
 */
export function getRateLimitHeaders(result: { limit: number; remaining: number; reset: number }) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
