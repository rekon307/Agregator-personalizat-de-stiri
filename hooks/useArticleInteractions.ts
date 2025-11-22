import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { analytics } from '@/lib/analytics';

interface UseArticleInteractionsOptions {
  articleId: string;
  userId: string | null;
  category?: string;
  source?: string;
}

interface UseArticleInteractionsReturn {
  isSaved: boolean;
  isLiked: boolean;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
  toggleSave: () => Promise<void>;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
}

/**
 * Custom hook for managing article interactions (like, save)
 * Provides optimistic UI updates and proper error handling
 *
 * @param options - Configuration for article interactions
 * @returns Article interaction state and handlers
 *
 * @example
 * ```tsx
 * const { isSaved, isLiked, toggleLike, toggleSave } = useArticleInteractions({
 *   articleId: '123',
 *   userId: 'user-456',
 *   category: 'Technology',
 *   source: 'TechNews'
 * });
 * ```
 */
export function useArticleInteractions({
  articleId,
  userId,
  category,
  source,
}: UseArticleInteractionsOptions): UseArticleInteractionsReturn {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();

  // Check initial saved and liked status
  useEffect(() => {
    if (!userId || !articleId) {
      setIsLoading(false);
      return;
    }

    async function checkStatus() {
      try {
        // Fetch both statuses in parallel for better performance
        const [savedResult, likedResult] = await Promise.all([
          supabase
            .from('saved_articles')
            .select('*')
            .eq('user_id', userId)
            .eq('article_id', articleId)
            .maybeSingle(),
          supabase
            .from('likes')
            .select('*')
            .eq('user_id', userId)
            .eq('article_id', articleId)
            .maybeSingle(),
        ]);

        if (savedResult.error && savedResult.error.code !== 'PGRST116') {
          console.error('Error checking saved status:', savedResult.error);
        }

        if (likedResult.error && likedResult.error.code !== 'PGRST116') {
          console.error('Error checking liked status:', likedResult.error);
        }

        setIsSaved(!!savedResult.data);
        setIsLiked(!!likedResult.data);
      } catch (error) {
        console.error('Error checking article status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [articleId, userId, supabase]);

  // Toggle like status
  const toggleLike = useCallback(async () => {
    if (!userId) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'You need to be logged in to like articles.',
      });
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState); // Optimistic update

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);

        if (error) {
          throw error;
        }

        await analytics.trackLikeEvent(userId, articleId, false, category, source);

        showToast({
          type: 'success',
          title: 'Article Unliked',
          message: 'Article removed from your liked articles.',
        });
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, article_id: articleId });

        if (error) {
          throw error;
        }

        await analytics.trackLikeEvent(userId, articleId, true, category, source);

        showToast({
          type: 'success',
          title: 'Article Liked',
          message: 'Article added to your liked articles.',
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      console.error('Error toggling like:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update like status. Please try again.',
      });
    }
  }, [isLiked, userId, articleId, category, source, supabase, showToast]);

  // Toggle save status
  const toggleSave = useCallback(async () => {
    if (!userId) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'You need to be logged in to save articles.',
      });
      return;
    }

    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);

        if (error) {
          throw error;
        }

        setIsSaved(false);
        showToast({
          type: 'success',
          title: 'Article Unsaved',
          message: 'Article removed from your saved list.',
        });
      } else {
        // Save with limit check
        const { data, error } = await supabase.rpc('save_article_with_limit_check', {
          user_uuid: userId,
          article_uuid: articleId,
        });

        if (error) {
          throw error;
        }

        const result = data?.[0];
        if (result?.success) {
          setIsSaved(true);
          showToast({
            type: 'success',
            title: 'Article Saved',
            message: result.message,
          });
        } else if (result?.limit_reached) {
          showToast({
            type: 'warning',
            title: 'Saved Articles Limit Reached',
            message: result.message,
          });
          setShowLimitModal(true);
        } else {
          showToast({
            type: 'info',
            title: 'Info',
            message: result?.message || 'Unable to save article.',
          });
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update save status. Please try again.',
      });
    }
  }, [isSaved, userId, articleId, supabase, showToast]);

  return {
    isSaved,
    isLiked,
    isLoading,
    toggleLike,
    toggleSave,
    showLimitModal,
    setShowLimitModal,
  };
}
