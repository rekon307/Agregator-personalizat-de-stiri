/**
 * Database type definitions
 * Generated from Supabase schema
 */

// User role types
export type UserRole = 'user' | 'admin';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Font size types
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Profile table
 */
export interface Profile {
  id: string; // UUID, FK to auth.users
  username: string | null;
  role: UserRole;
  theme: Theme;
  font_size: FontSize;
  avatar_color: string;
  banner_color: string;
  has_completed_onboarding: boolean;
  saved_articles_limit: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Category table
 */
export interface Category {
  id: string; // UUID
  name: string; // UNIQUE
  description: string | null;
  icon: string | null;
  created_at: string; // ISO timestamp
}

/**
 * Source table (RSS feeds)
 */
export interface Source {
  id: string; // UUID
  name: string;
  rss_url: string; // UNIQUE
  category_id: string | null; // FK to categories
  is_active: boolean;
  is_enabled: boolean;
  last_fetched_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Article table
 */
export interface Article {
  id: string; // UUID
  title: string;
  summary: string | null;
  content: string | null;
  url: string; // UNIQUE
  image_url: string | null;
  author: string | null;
  published_at: string | null; // ISO timestamp
  source_id: string | null; // FK to sources
  content_hash: string | null;
  tags: string[] | null; // Array of strings
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Article with joined source and category data
 */
export interface ArticleWithDetails extends Article {
  source?: {
    id: string;
    name: string;
    category_id: string | null;
  } | null;
  categories?: Category[];
  slug?: string;
  category?: string; // Category name for convenience
  is_read?: boolean; // For saved articles
  folder_id?: string | null; // For saved articles
}

/**
 * Article category junction table
 */
export interface ArticleCategory {
  article_id: string; // FK to articles
  category_id: string; // FK to categories
  created_at: string; // ISO timestamp
}

/**
 * User preferred categories
 */
export interface UserPreferredCategory {
  user_id: string; // FK to profiles
  category_id: string; // FK to categories
  created_at: string; // ISO timestamp
}

/**
 * Like table
 */
export interface Like {
  user_id: string; // FK to profiles
  article_id: string; // FK to articles
  created_at: string; // ISO timestamp
}

/**
 * Saved article table
 */
export interface SavedArticle {
  user_id: string; // FK to profiles
  article_id: string; // FK to articles
  saved_at: string; // ISO timestamp
  folder_id: string | null; // FK to saved_folders
  is_read: boolean;
  notes: string | null;
}

/**
 * Saved article with full article details
 */
export interface SavedArticleWithDetails extends SavedArticle {
  article: ArticleWithDetails;
  tags?: SavedTag[];
}

/**
 * Muted source table
 */
export interface MutedSource {
  user_id: string; // FK to profiles
  source_id: string; // FK to sources
  created_at: string; // ISO timestamp
}

/**
 * Comment table
 */
export interface Comment {
  id: string; // UUID
  user_id: string; // FK to profiles
  article_id: string; // FK to articles
  content: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Comment with user profile
 */
export interface CommentWithProfile extends Comment {
  profiles: {
    id: string;
    username: string | null;
    avatar_color: string;
  };
}

/**
 * Saved folder table
 */
export interface SavedFolder {
  id: string; // UUID
  user_id: string; // FK to profiles
  name: string;
  description: string | null;
  color: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Saved tag table
 */
export interface SavedTag {
  id: string; // UUID
  user_id: string; // FK to profiles
  name: string;
  color: string;
  created_at: string; // ISO timestamp
}

/**
 * Saved article tags junction table
 */
export interface SavedArticleTag {
  saved_article_user_id: string; // FK to saved_articles
  saved_article_article_id: string; // FK to saved_articles
  tag_id: string; // FK to saved_tags
  created_at: string; // ISO timestamp
}

/**
 * RPC function return types
 */

/**
 * get_user_visible_articles RPC return type
 */
export interface UserVisibleArticle extends ArticleWithDetails {
  category_id?: string;
  category_name?: string;
}

/**
 * save_article_with_limit_check RPC return type
 */
export interface SaveArticleResult {
  success: boolean;
  limit_reached?: boolean;
  message: string;
  current_count?: number;
  limit?: number;
}

/**
 * News ingestion types
 */

/**
 * RSS feed article data
 */
export interface RSSArticle {
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  source_id: string;
  content_hash: string;
}

/**
 * Batch ingestion result
 */
export interface BatchIngestionResult {
  success: boolean;
  processed: number;
  inserted: number;
  sources_processed: number;
  errors?: string[];
  batch_info?: {
    has_more_batches: boolean;
    next_batch_offset: number;
  };
}

/**
 * Full ingestion result
 */
export interface IngestionResult {
  success: boolean;
  message: string;
  summary: {
    total_processed: number;
    total_inserted: number;
    batches_executed: number;
    execution_time_ms: number;
    execution_time_seconds: number;
  };
  errors?: string[];
  timestamp: string;
}

/**
 * Utility types
 */

/**
 * Supabase query error
 */
export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Sort params
 */
export interface SortParams {
  column: string;
  ascending: boolean;
}
