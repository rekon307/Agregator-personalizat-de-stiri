-- Performance Optimization Indexes Migration
-- Run this in your Supabase SQL editor or via migrations

-- Articles table indexes
-- Index for fetching articles by published date (most common query)
CREATE INDEX IF NOT EXISTS idx_articles_published_at
ON articles (published_at DESC NULLS LAST);

-- Composite index for category + published date queries
CREATE INDEX IF NOT EXISTS idx_articles_category_published
ON articles (category_id, published_at DESC NULLS LAST);

-- Index for article lookups by slug
CREATE INDEX IF NOT EXISTS idx_articles_slug
ON articles (slug);

-- Index for source-based queries
CREATE INDEX IF NOT EXISTS idx_articles_source_published
ON articles (source_id, published_at DESC NULLS LAST);

-- Partial index for active/published articles only
CREATE INDEX IF NOT EXISTS idx_articles_active_published
ON articles (published_at DESC NULLS LAST)
WHERE deleted_at IS NULL;

-- Saved articles table indexes
-- Index for user's saved articles queries
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_created
ON saved_articles (user_id, created_at DESC);

-- Composite index for folder-based queries
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_folder
ON saved_articles (user_id, folder_id, created_at DESC);

-- Index for checking if article is saved by user
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_article
ON saved_articles (user_id, article_id);

-- Likes table indexes
-- Index for user's likes
CREATE INDEX IF NOT EXISTS idx_likes_user_created
ON likes (user_id, created_at DESC);

-- Index for article's likes (for like counts)
CREATE INDEX IF NOT EXISTS idx_likes_article
ON likes (article_id);

-- Index for checking if user liked article
CREATE INDEX IF NOT EXISTS idx_likes_user_article
ON likes (user_id, article_id);

-- User preferences indexes
-- Index for user's category preferences
CREATE INDEX IF NOT EXISTS idx_user_categories_user
ON user_preferred_categories (user_id);

-- Index for user's source preferences
CREATE INDEX IF NOT EXISTS idx_user_sources_user
ON user_preferred_sources (user_id);

-- Comments table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_comments_article_created
ON comments (article_id, created_at DESC)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments');

-- Full-text search index for articles
CREATE INDEX IF NOT EXISTS idx_articles_fulltext
ON articles USING GIN (to_tsvector('english', title || ' ' || summary));

-- Analyze tables to update statistics
ANALYZE articles;
ANALYZE saved_articles;
ANALYZE likes;
ANALYZE user_preferred_categories;
ANALYZE user_preferred_sources;

-- Add comments explaining the indexes
COMMENT ON INDEX idx_articles_published_at IS 'Performance index for fetching recent articles';
COMMENT ON INDEX idx_articles_category_published IS 'Composite index for category-filtered article feeds';
COMMENT ON INDEX idx_articles_fulltext IS 'Full-text search index for article title and summary';
COMMENT ON INDEX idx_saved_articles_user_created IS 'Performance index for user saved articles list';
COMMENT ON INDEX idx_likes_user_article IS 'Performance index for checking if user liked an article';
