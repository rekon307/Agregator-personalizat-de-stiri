import { createClient } from '@/lib/supabase/server';
import VirtualizedFeedContent from '@/components/custom/virtualized-feed-content';
import ArticleCardSkeleton from '@/components/custom/article-card-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import type { UserVisibleArticle, Category } from '@/lib/types/database';

function FeedSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your News Feed</h1>
          <p className="text-gray-600 mt-1">Latest articles from your preferred topics</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/onboarding">Edit Topics</Link>
          </Button>
          <Button asChild>
            <Link href="/saved">Saved Articles</Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function FeedData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Not Logged In</h1>
        <p className="text-lg mb-8">Please log in to view your personalized news feed.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  // Get user's preferred categories
  const { data: preferredCategoriesData, error: categoriesError } = await supabase
    .from('user_preferred_categories')
    .select('category_id')
    .eq('user_id', user.id);

  if (categoriesError) {
    console.error('Error fetching preferred categories:', categoriesError);
    return <div>Error loading preferred categories.</div>;
  }

  const preferredCategoryIds = preferredCategoriesData?.map((pc) => pc.category_id) || [];

  // If user hasn't completed onboarding, redirect them
  if (preferredCategoryIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Complete Your Setup</h1>
        <p className="text-lg mb-8">Please select your preferred topics to see personalized news.</p>
        <Button asChild>
          <Link href="/onboarding">Choose Your Topics</Link>
        </Button>
      </div>
    );
  }

  // Get all articles from preferred categories, ordered by most recent
  // First get source IDs for preferred categories
  const { data: sourcesData, error: sourcesError } = await supabase
    .from('sources')
    .select(`
      id, 
      name, 
      category_id,
      categories (
        id,
        name
      )
    `)
    .in('category_id', preferredCategoryIds)
    .eq('is_enabled', true);

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError);
    return <div>Error loading news sources.</div>;
  }

  const sourceIds = sourcesData?.map(s => s.id) || [];

  if (sourceIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">No News Sources</h1>
        <p className="text-lg mb-8">No news sources found for your preferred topics.</p>
        <Button asChild>
          <Link href="/onboarding">Update Your Topics</Link>
        </Button>
      </div>
    );
  }

  // Now get user-visible articles using the new function
  const { data: articlesData, error: articlesError } = await supabase
    .rpc('get_user_visible_articles', {
      p_user_id: user.id,
      p_source_ids: sourceIds,
      p_limit: 20,
      p_offset: 0
    });

  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
    return <div>Error loading articles.</div>;
  }

  // Map articles to include category name from source data
  const articlesWithCategories = (articlesData || []).map((article: UserVisibleArticle) => {
    // Find the source info for this article
    const sourceInfo = sourcesData?.find(s => s.id === article.source_id);
    // Handle both object and array format for categories
    const categories = sourceInfo?.categories as Category | Category[] | null | undefined;
    let categoryName = 'Unknown';

    if (categories) {
      if (Array.isArray(categories)) {
        categoryName = categories[0]?.name || 'Unknown';
      } else {
        categoryName = categories.name || 'Unknown';
      }
    }

    return {
      ...article,
      category: categoryName,
      source: sourceInfo?.name || 'Unknown Source'
    };
  });

  const articles = articlesWithCategories;

  return (
    <VirtualizedFeedContent 
      initialArticles={articles} 
      userId={user.id} 
      preferredCategoryIds={preferredCategoryIds}
      sourceIds={sourceIds}
      sourcesData={sourcesData}
    />
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedData />
    </Suspense>
  );
}
