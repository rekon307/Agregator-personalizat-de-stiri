import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Article,
  ArticleWithDetails,
  UserVisibleArticle,
  SaveArticleResult,
} from '@/lib/types/database';

/**
 * Article Repository
 * Data access layer for article-related operations
 * Abstracts database queries and provides a clean API
 */
export class ArticleRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get article by ID with full details
   */
  async getById(id: string): Promise<ArticleWithDetails | null> {
    const { data, error } = await this.supabase
      .from('articles')
      .select(
        `
        *,
        sources!inner(id, name, category_id),
        article_categories(category_id)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch article: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's personalized feed
   */
  async getUserFeed(
    userId: string,
    sourceIds: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<UserVisibleArticle[]> {
    const { data, error } = await this.supabase.rpc('get_user_visible_articles', {
      p_user_id: userId,
      p_source_ids: sourceIds,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new Error(`Failed to fetch user feed: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Save article for user
   */
  async save(userId: string, articleId: string): Promise<SaveArticleResult> {
    const { data, error } = await this.supabase.rpc('save_article_with_limit_check', {
      user_uuid: userId,
      article_uuid: articleId,
    });

    if (error) {
      throw new Error(`Failed to save article: ${error.message}`);
    }

    return data?.[0] || { success: false, message: 'Failed to save article' };
  }

  /**
   * Unsave article for user
   */
  async unsave(userId: string, articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) {
      throw new Error(`Failed to unsave article: ${error.message}`);
    }
  }

  /**
   * Like article
   */
  async like(userId: string, articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('likes')
      .insert({ user_id: userId, article_id: articleId });

    if (error) {
      throw new Error(`Failed to like article: ${error.message}`);
    }
  }

  /**
   * Unlike article
   */
  async unlike(userId: string, articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) {
      throw new Error(`Failed to unlike article: ${error.message}`);
    }
  }

  /**
   * Check if article is saved by user
   */
  async isSaved(userId: string, articleId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('saved_articles')
      .select('*')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check saved status: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Check if article is liked by user
   */
  async isLiked(userId: string, articleId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check liked status: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get saved articles for user
   */
  async getSavedArticles(userId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await this.supabase
      .from('saved_articles')
      .select(
        `
        *,
        articles:article_id(*)
      `
      )
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch saved articles: ${error.message}`);
    }

    return data || [];
  }
}
