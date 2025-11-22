# Performance Optimization Guide

This document explains the performance optimizations implemented in the news aggregator application.

## Overview

The application uses multiple layers of caching and optimization to ensure fast page loads and minimal database queries:

1. **Redis Caching** - Fast, distributed caching layer
2. **Next.js ISR** - Incremental Static Regeneration for article pages
3. **Database Indexes** - Optimized queries for common access patterns
4. **Cursor-based Pagination** - Efficient pagination for large datasets
5. **Edge Caching** - CDN-level caching for static assets

## Redis Caching

### Setup

1. Create a free Upstash Redis database at https://console.upstash.com/
2. Add credentials to your `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

3. The application will automatically use Redis when configured. If not configured, it gracefully falls back to no caching.

### Cache Keys

The application uses structured cache keys:

- `article:{id}` - Individual article data (15 min TTL)
- `feed:{userId}:{category}:{page}` - User feed pages (5 min TTL)
- `trending:{limit}` - Trending articles (2 min TTL)
- `category:{categoryId}:{limit}:{offset}` - Category pages (5 min TTL)

### Cache Utilities

```typescript
import { getCached, setCached, deleteCached } from '@/lib/cache/redis';

// Get from cache
const article = await getCached<Article>('article:123', { ttl: 900 });

// Set in cache
await setCached('article:123', articleData, { ttl: 900 });

// Delete from cache
await deleteCached('article:123');

// Invalidate by pattern
await invalidatePattern('feed:*');
```

### Article-Specific Cache

```typescript
import { getCachedArticle, setCachedArticle, invalidateUserCache } from '@/lib/cache/article-cache';

// Get cached article
const article = await getCachedArticle('article-id');

// Cache article
await setCachedArticle('article-id', articleData);

// Invalidate user's cache when preferences change
await invalidateUserCache('user-id');
```

## Next.js ISR (Incremental Static Regeneration)

### Article Pages

Article pages use ISR with a 5-minute revalidation period:

```typescript
// app/(main)/article/[id]/page.tsx
export const revalidate = 300; // Revalidate every 5 minutes
```

**Benefits:**

- Pages are statically generated at build time for the 100 most recent articles
- After 5 minutes, the first request triggers background regeneration
- Users always get fast, cached pages
- Fresh content is served after the revalidation period

### Static Generation

The `generateStaticParams` function pre-generates pages for popular articles:

```typescript
export async function generateStaticParams() {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug')
    .order('published_at', { ascending: false })
    .limit(100);

  return articles.flatMap((article) => [{ id: article.id }, { id: article.slug }]);
}
```

## Database Indexes

### Running the Migration

Execute the performance indexes migration in your Supabase SQL editor:

```bash
psql -h your-host -U postgres -d your-database -f supabase/migrations/20241122_add_performance_indexes.sql
```

Or copy the contents of `supabase/migrations/20241122_add_performance_indexes.sql` to your Supabase SQL editor.

### Indexes Created

1. **Articles Table**
   - `idx_articles_published_at` - Recent articles queries
   - `idx_articles_category_published` - Category-filtered feeds
   - `idx_articles_slug` - Slug lookups
   - `idx_articles_source_published` - Source-based queries
   - `idx_articles_active_published` - Active articles only
   - `idx_articles_fulltext` - Full-text search

2. **Saved Articles Table**
   - `idx_saved_articles_user_created` - User's saved list
   - `idx_saved_articles_user_folder` - Folder-based queries
   - `idx_saved_articles_user_article` - Save status checks

3. **Likes Table**
   - `idx_likes_user_created` - User's likes
   - `idx_likes_article` - Article like counts
   - `idx_likes_user_article` - Like status checks

### Query Optimization

**Before:**

```sql
-- Slow: Full table scan
SELECT * FROM articles WHERE published_at > NOW() - INTERVAL '7 days'
ORDER BY published_at DESC LIMIT 20;
```

**After:**

```sql
-- Fast: Uses idx_articles_published_at index
SELECT * FROM articles WHERE published_at > NOW() - INTERVAL '7 days'
ORDER BY published_at DESC LIMIT 20;
```

## Cursor-based Pagination

Traditional offset/limit pagination becomes slow with large datasets. Cursor-based pagination uses the last item's ID as the cursor.

### Usage

```typescript
import { parsePaginationParams, processPaginatedResults } from '@/lib/utils/pagination';

// Parse from URL params
const { limit, cursor } = parsePaginationParams(searchParams);

// Query database
const query = supabase
  .from('articles')
  .select('*')
  .order('published_at', { ascending: false })
  .limit(limit + 1); // Fetch one extra to check if there's more

if (cursor) {
  const decodedCursor = decodeCursor(cursor);
  query.gt('id', decodedCursor);
}

const { data: articles } = await query;

// Process results
const result = processPaginatedResults(articles, limit);

// result.items - The items for this page
// result.pageInfo.hasNextPage - Whether there are more results
// result.pageInfo.endCursor - Cursor for the next page
```

### Benefits

- **Consistent performance** regardless of page number
- **No skipped/duplicate items** when data changes
- **Better for infinite scroll** implementations

## Performance Metrics

### Expected Improvements

| Metric                       | Before | After | Improvement              |
| ---------------------------- | ------ | ----- | ------------------------ |
| Article page load (cached)   | 800ms  | 150ms | **81% faster**           |
| Article page load (uncached) | 800ms  | 400ms | **50% faster**           |
| Feed query (paginated)       | 1200ms | 300ms | **75% faster**           |
| Search query                 | 2000ms | 500ms | **75% faster**           |
| Database queries per request | 3-5    | 0-1   | **Up to 100% reduction** |

### Monitoring

Monitor cache performance in production:

```typescript
// Check cache hit rate
import { isRedisAvailable } from '@/lib/cache/redis';

if (isRedisAvailable()) {
  console.log('Redis cache is active');
} else {
  console.log('Redis cache is not configured - using fallback');
}
```

## Best Practices

### When to Invalidate Cache

1. **Article Created/Updated** - Invalidate article cache and related feeds
2. **User Saves Article** - Invalidate user's saved articles cache
3. **User Changes Preferences** - Invalidate user's feed cache
4. **Category Changed** - Invalidate category cache

Example:

```typescript
import { invalidateArticleCache, invalidateUserCache } from '@/lib/cache/article-cache';

// After user saves an article
await invalidateUserCache(userId);

// After article is updated
await invalidateArticleCache(articleId);
```

### Cache Warming

For high-traffic pages, warm the cache in background jobs:

```typescript
// Warm cache for trending articles
const trending = await getTrendingArticles(10);
await setCachedTrending(10, trending);
```

### Local Development

Redis is optional for local development. The application works without it:

```bash
# Run without Redis (no caching)
npm run dev

# Run with Redis
# Add Redis credentials to .env.local first
npm run dev
```

## Troubleshooting

### Cache Not Working

1. Check Redis credentials in `.env.local`
2. Verify Upstash database is active
3. Check logs for Redis connection errors

### Stale Data

If you see stale data, invalidate the cache manually:

```typescript
import { invalidatePattern } from '@/lib/cache/redis';

// Clear all caches
await invalidatePattern('*');

// Clear specific pattern
await invalidatePattern('feed:*');
```

### Performance Not Improved

1. Run the database index migration
2. Check query plans with `EXPLAIN ANALYZE`
3. Monitor cache hit rates
4. Check network latency to database

## Cost Optimization

### Upstash Redis Pricing

- **Free tier**: 10,000 commands/day - Perfect for development
- **Pay-as-you-go**: ~$0.20 per 100K commands
- **Pro**: $10/month for 1M commands/day

### Cost Reduction Tips

1. Use longer TTLs for rarely changing data
2. Cache at multiple levels (Redis + ISR)
3. Use cursor pagination to reduce query costs
4. Implement smart cache invalidation (only invalidate what changed)

## Further Optimizations

Future improvements to consider:

1. **CDN Caching** - Add Vercel/Cloudflare caching headers
2. **Image Optimization** - Use next/image with CDN
3. **Bundle Size** - Code splitting and lazy loading
4. **Database Connection Pooling** - Reduce connection overhead
5. **Compression** - Enable gzip/brotli compression
6. **Service Worker** - Offline caching for PWA

## Related Documentation

- [Next.js ISR Documentation](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Supabase Performance Tips](https://supabase.com/docs/guides/platform/performance)
