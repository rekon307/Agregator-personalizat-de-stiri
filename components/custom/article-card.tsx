'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { analytics } from '@/lib/analytics';
import { getCategoryStyle } from '@/lib/category-styles';
import { cleanText } from '@/lib/utils/text-sanitization';
import SavedArticlesLimitModal from './saved-articles-limit-modal';
import Link from 'next/link';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    summary: string;
    url: string;
    slug: string; // Added slug prop
    image_url?: string;
    source?: string;
    published_at?: string;
    category?: string; // Added category prop
  };
  userId: string | null;
}

export default function ArticleCard({ article, userId }: ArticleCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    async function checkSavedAndLikedStatus() {
      if (!userId || !article.id) {
        return;
      }

      // Check saved status
      const { data: savedData, error: savedError } = await supabase
        .from('saved_articles')
        .select('*')
        .eq('user_id', userId)
        .eq('article_id', article.id)
        .single();

      if (savedError && savedError.code !== 'PGRST116') {
        // PGRST116 means no rows found
        console.error('Error checking saved status:', savedError);
      }
      setIsSaved(!!savedData);

      // Check liked status
      const { data: likedData, error: likedError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('article_id', article.id)
        .single();

      if (likedError && likedError.code !== 'PGRST116') {
        // PGRST116 means no rows found
        console.error('Error checking liked status:', likedError);
      }
      setIsLiked(!!likedData);
    }

    checkSavedAndLikedStatus();
  }, [article.id, userId, supabase]);

  const handleLikeToggle = async () => {
    if (!userId) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'You need to be logged in to like articles.',
      });
      return;
    }

    // Optimistic UI update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    if (isLiked) {
      // Unlike article
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', article.id);

      if (error) {
        console.error('Error unliking article:', error);
        // Revert optimistic update on error
        setIsLiked(true);
      } else {
        // Track analytics for unlike
        await analytics.trackLikeEvent(userId, article.id, false, article.category, article.source);
      }
    } else {
      // Like article
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: userId, article_id: article.id });

      if (error) {
        console.error('Error liking article:', error);
        // Revert optimistic update on error
        setIsLiked(false);
      } else {
        // Track analytics for like
        await analytics.trackLikeEvent(userId, article.id, true, article.category, article.source);
      }
    }
  };

  const handleSaveToggle = async () => {
    if (!userId) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'You need to be logged in to save articles.',
      });
      return;
    }

    if (isSaved) {
      // Unsave article (unchanged)
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', article.id);

      if (error) {
        console.error('Error unsaving article:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to unsave article. Please try again.',
        });
      } else {
        setIsSaved(false);
        showToast({
          type: 'success',
          title: 'Article Unsaved',
          message: 'Article removed from your saved list.',
        });
      }
    } else {
      // Save article with limit check
      const { data, error } = await supabase.rpc('save_article_with_limit_check', {
        user_uuid: userId,
        article_uuid: article.id,
      });

      if (error) {
        console.error('Error saving article:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to save article. Please try again.',
        });
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        setIsSaved(true);
        showToast({
          type: 'success',
          title: 'Article Saved',
          message: result.message,
        });
      } else {
        // Show limit reached message with beautiful modal
        if (result?.limit_reached) {
          showToast({
            type: 'warning',
            title: 'Saved Articles Limit Reached',
            message: result.message,
          });
          // Show the beautiful limit management modal
          setShowLimitModal(true);
        } else {
          showToast({
            type: 'info',
            title: 'Info',
            message: result?.message || 'Unable to save article.',
          });
        }
      }
    }
  };

  const handleArticleRemoved = () => {
    // This will be called when an article is removed from the modal
    // We can try to save the current article again
    handleSaveToggle();
  };

  return (
    <>
      <SavedArticlesLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        userId={userId || ''}
        onArticleRemoved={handleArticleRemoved}
      />

      <div className="border rounded-lg p-4 flex flex-col">
        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}

        {/* Category badge */}
        {article.category &&
          (() => {
            const categoryStyle = getCategoryStyle(cleanText(article.category));
            const IconComponent = categoryStyle.icon;

            return (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 w-fit"
                style={{
                  backgroundColor: categoryStyle.bgColor,
                  color: categoryStyle.color,
                }}
              >
                <IconComponent className="h-3 w-3" />
                {cleanText(article.category)}
              </span>
            );
          })()}

        <Link href={`/article/${article.slug}`}>
          <h2 className="text-xl font-semibold mb-2 hover:text-blue-600 cursor-pointer transition-colors">
            {cleanText(article.title)}
          </h2>
        </Link>
        <div className="text-sm text-gray-500 mb-2 space-y-1">
          {article.source && <p className="font-medium">{cleanText(article.source)}</p>}
          {article.published_at && (
            <p>
              {new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
        <p className="text-gray-700 flex-grow mb-4">{cleanText(article.summary)}</p>
        <div className="flex items-center justify-between mt-auto">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Read More
          </a>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleLikeToggle} disabled={!userId}>
              <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSaveToggle} disabled={!userId}>
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5 text-blue-500" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
