/**
 * Article-specific caching layer
 * Provides cached access to article data with automatic invalidation
 */

import { getCached, setCached, deleteCached, invalidatePattern, CACHE_TTL } from './redis';
import type { ArticleWithDetails } from '@/lib/types/database';

/**
 * Cache key generators
 */
export const cacheKeys = {
  article: (id: string) => `article:${id}`,
  feed: (userId: string, page: number, categoryId?: string) =>
    `feed:${userId}:${categoryId || 'all'}:${page}`,
  userFeed: (userId: string, sourceIds: string[], limit: number, offset: number) =>
    `user-feed:${userId}:${sourceIds.sort().join(',')}:${limit}:${offset}`,
  trending: (limit: number) => `trending:${limit}`,
  category: (categoryId: string, limit: number, offset: number) =>
    `category:${categoryId}:${limit}:${offset}`,
  search: (query: string, page: number) => `search:${query}:${page}`,
};

/**
 * Get cached article by ID
 */
export async function getCachedArticle(articleId: string): Promise<ArticleWithDetails | null> {
  return getCached<ArticleWithDetails>(cacheKeys.article(articleId), {
    ttl: CACHE_TTL.ARTICLE,
  });
}

/**
 * Cache article by ID
 */
export async function setCachedArticle(
  articleId: string,
  article: ArticleWithDetails
): Promise<boolean> {
  return setCached(cacheKeys.article(articleId), article, {
    ttl: CACHE_TTL.ARTICLE,
  });
}

/**
 * Get cached feed
 */
export async function getCachedFeed<T>(
  userId: string,
  page: number,
  categoryId?: string
): Promise<T | null> {
  return getCached<T>(cacheKeys.feed(userId, page, categoryId), {
    ttl: CACHE_TTL.FEED,
  });
}

/**
 * Cache feed results
 */
export async function setCachedFeed<T>(
  userId: string,
  page: number,
  feed: T,
  categoryId?: string
): Promise<boolean> {
  return setCached(cacheKeys.feed(userId, page, categoryId), feed, {
    ttl: CACHE_TTL.FEED,
  });
}

/**
 * Get cached user feed
 */
export async function getCachedUserFeed<T>(
  userId: string,
  sourceIds: string[],
  limit: number,
  offset: number
): Promise<T | null> {
  return getCached<T>(cacheKeys.userFeed(userId, sourceIds, limit, offset), {
    ttl: CACHE_TTL.FEED,
  });
}

/**
 * Cache user feed results
 */
export async function setCachedUserFeed<T>(
  userId: string,
  sourceIds: string[],
  limit: number,
  offset: number,
  feed: T
): Promise<boolean> {
  return setCached(cacheKeys.userFeed(userId, sourceIds, limit, offset), feed, {
    ttl: CACHE_TTL.FEED,
  });
}

/**
 * Get cached trending articles
 */
export async function getCachedTrending<T>(limit: number): Promise<T | null> {
  return getCached<T>(cacheKeys.trending(limit), {
    ttl: CACHE_TTL.TRENDING,
  });
}

/**
 * Cache trending articles
 */
export async function setCachedTrending<T>(limit: number, articles: T): Promise<boolean> {
  return setCached(cacheKeys.trending(limit), articles, {
    ttl: CACHE_TTL.TRENDING,
  });
}

/**
 * Invalidate all caches for a user
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  return invalidatePattern(`*:${userId}:*`);
}

/**
 * Invalidate article cache
 */
export async function invalidateArticleCache(articleId: string): Promise<boolean> {
  return deleteCached(cacheKeys.article(articleId));
}

/**
 * Invalidate all feed caches
 */
export async function invalidateAllFeeds(): Promise<number> {
  return invalidatePattern('feed:*');
}

/**
 * Invalidate category cache
 */
export async function invalidateCategoryCache(categoryId: string): Promise<number> {
  return invalidatePattern(`category:${categoryId}:*`);
}
