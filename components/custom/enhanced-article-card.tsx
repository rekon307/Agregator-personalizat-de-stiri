'use client';

import { useState, useEffect } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Heart,
  Folder,
  Tag,
  MoreHorizontal,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { analytics } from '@/lib/analytics';
import { getCategoryStyle } from '@/lib/category-styles';
import { cleanText } from '@/lib/utils/text-sanitization';
import Link from 'next/link';

interface SavedFolder {
  id: string;
  name: string;
  color: string;
}

interface SavedTag {
  id: string;
  name: string;
  color: string;
}

interface EnhancedArticleCardProps {
  article: {
    id: string;
    title: string;
    summary: string;
    url: string;
    image_url?: string;
    source?: string;
    published_at?: string;
    category?: string;
    folder_id?: string | null;
    is_read?: boolean;
    slug?: string;
    tags?: SavedTag[];
  };
  userId: string | null;
  showEnhancedControls?: boolean;
  onArticleUpdate?: (articleId: string, updates: any) => void;
  onDataRefresh?: () => void;
  folders: SavedFolder[];
  tags: SavedTag[];
}

export default function EnhancedArticleCard({
  article,
  userId,
  showEnhancedControls = false,
  onArticleUpdate,
  onDataRefresh,
  folders,
  tags,
}: EnhancedArticleCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRead, setIsRead] = useState(article.is_read || false);
  const [currentFolderId, setCurrentFolderId] = useState(article.folder_id);
  const [currentTags, setCurrentTags] = useState<SavedTag[]>(article.tags || []);
  const [showControls, setShowControls] = useState(false);

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

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', article.id);

      if (error) {
        console.error('Error unliking article:', error);
        setIsLiked(true);
      } else {
        await analytics.trackLikeEvent(userId, article.id, false, article.category, article.source);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: userId, article_id: article.id });

      if (error) {
        console.error('Error liking article:', error);
        setIsLiked(false);
      } else {
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
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', article.id);

      if (error) {
        console.error('Error unsaving article:', error);
      } else {
        setIsSaved(false);
        setCurrentFolderId(null);
        setCurrentTags([]);
      }
    } else {
      const { error } = await supabase
        .from('saved_articles')
        .insert({ user_id: userId, article_id: article.id });

      if (error) {
        console.error('Error saving article:', error);
      } else {
        setIsSaved(true);
      }
    }
  };

  const handleReadToggle = async () => {
    if (!userId || !isSaved) {
      return;
    }

    const newReadState = !isRead;
    setIsRead(newReadState);

    const { error } = await supabase
      .from('saved_articles')
      .update({ is_read: newReadState })
      .eq('user_id', userId)
      .eq('article_id', article.id);

    if (error) {
      console.error('Error updating read status:', error);
      setIsRead(!newReadState);
    } else if (onArticleUpdate) {
      onArticleUpdate(article.id, { is_read: newReadState });
    }
  };

  const handleFolderChange = async (folderId: string | null) => {
    if (!userId || !isSaved) {
      return;
    }

    setCurrentFolderId(folderId);

    const { error } = await supabase
      .from('saved_articles')
      .update({ folder_id: folderId })
      .eq('user_id', userId)
      .eq('article_id', article.id);

    if (error) {
      console.error('Error updating folder:', error);
      setCurrentFolderId(currentFolderId);
    } else if (onArticleUpdate) {
      onArticleUpdate(article.id, { folder_id: folderId });
    }
  };

  const handleTagToggle = async (tag: SavedTag) => {
    if (!userId || !isSaved) {
      return;
    }

    const isTagged = currentTags.some((t) => t.id === tag.id);

    if (isTagged) {
      // Remove tag
      const { error } = await supabase
        .from('saved_article_tags')
        .delete()
        .eq('saved_article_user_id', userId)
        .eq('saved_article_article_id', article.id)
        .eq('tag_id', tag.id);

      if (error) {
        console.error('Error removing tag:', error);
        showToast({
          type: 'error',
          title: 'Error removing tag',
          message: 'Please try again.',
        });
      } else {
        const newTags = currentTags.filter((t) => t.id !== tag.id);
        setCurrentTags(newTags);
        if (onArticleUpdate) {
          onArticleUpdate(article.id, { tags: newTags });
        }
        // Trigger data refresh to ensure UI consistency
        if (onDataRefresh) {
          onDataRefresh();
        }
        showToast({
          type: 'success',
          title: 'Tag removed',
          message: `"${tag.name}" has been removed from this article.`,
        });
      }
    } else {
      // Add tag (use upsert to handle duplicates gracefully)
      const { error } = await supabase.from('saved_article_tags').upsert(
        {
          saved_article_user_id: userId,
          saved_article_article_id: article.id,
          tag_id: tag.id,
        },
        {
          onConflict: 'saved_article_user_id,saved_article_article_id,tag_id',
        }
      );

      if (error) {
        console.error('Error adding tag:', error);
        showToast({
          type: 'error',
          title: 'Error adding tag',
          message: 'Please try again.',
        });
      } else {
        const newTags = [...currentTags, tag];
        setCurrentTags(newTags);
        if (onArticleUpdate) {
          onArticleUpdate(article.id, { tags: newTags });
        }
        // Trigger data refresh to ensure UI consistency
        if (onDataRefresh) {
          onDataRefresh();
        }
        showToast({
          type: 'success',
          title: 'Tag added',
          message: `"${tag.name}" has been added to this article.`,
        });
      }
    }
  };

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  return (
    <div className={`border rounded-lg p-4 flex flex-col relative ${isRead ? 'opacity-60' : ''}`}>
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

      <Link href={`/article/${article.slug || article.id}`}>
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

      {/* Organization metadata */}
      {showEnhancedControls && isSaved && (
        <div className="mb-3 space-y-2">
          {/* Folder indicator */}
          {currentFolder && (
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: currentFolder.color,
                  color: currentFolder.color,
                }}
              >
                {currentFolder.name}
              </Badge>
            </div>
          )}

          {/* Tags */}
          {currentTags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3" />
              {currentTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enhanced controls dropdown */}
      {showEnhancedControls && isSaved && showControls && (
        <div className="absolute top-2 right-2 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-48">
          {/* Read status toggle */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Mark as read</span>
            <Button variant="ghost" size="sm" onClick={handleReadToggle}>
              {isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Folder selection */}
          <div className="mb-2">
            <label className="text-sm font-medium mb-1 block">Folder</label>
            <select
              className="w-full text-sm border rounded px-2 py-1"
              value={currentFolderId || ''}
              onChange={(e) => handleFolderChange(e.target.value || null)}
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags selection */}
          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={currentTags.some((t) => t.id === tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  style={
                    currentTags.some((t) => t.id === tag.id) ? { backgroundColor: tag.color } : {}
                  }
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {showEnhancedControls && isSaved && (
            <Button variant="ghost" size="icon" onClick={() => setShowControls(!showControls)}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Click outside to close controls */}
      {showControls && <div className="fixed inset-0 z-5" onClick={() => setShowControls(false)} />}
    </div>
  );
}
