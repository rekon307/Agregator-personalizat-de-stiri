import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Bookmark,
  BookmarkCheck,
  Heart,
  Calendar,
  User,
  ExternalLink,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Suspense } from 'react';
import ArticleInteractions from '@/components/custom/article-interactions';
import RelatedArticles from '@/components/custom/related-articles';
import ArticleErrorBoundary from '@/components/custom/article-error-boundary';
import ArticleDetailSkeleton from '@/components/custom/article-detail-skeleton';
import ArticleNotFound from '@/components/custom/article-not-found';
import {
  calculateReadingTime,
  formatReadingTime,
  shouldShowReadingTime,
} from '@/lib/utils/reading-time';
import { cleanText } from '@/lib/utils/text-sanitization';
import { getCachedArticle, setCachedArticle } from '@/lib/cache/article-cache';

// Enable ISR with revalidation every 5 minutes
export const revalidate = 300;

// Dynamic segments config - static params will be generated at build time
export const dynamicParams = true;

interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  slug: string;
  image_url?: string;
  source?: string;
  author?: string;
  published_at?: string;
  created_at: string;
  category_id?: string;
  categories?: {
    id: string;
    name: string;
  };
  sources?: {
    id: string;
    name: string;
    categories?: {
      id: string;
      name: string;
    };
  };
}

// Helper function to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function getArticle(slugOrId: string): Promise<Article | null> {
  try {
    // Try to get from cache first (only for UUID lookups)
    const isId = isUUID(slugOrId);
    if (isId) {
      const cached = await getCachedArticle(slugOrId);
      if (cached) {
        return cached as Article;
      }
    }

    const supabase = createClient();

    // Determine if we're looking for a slug or UUID
    const searchField = isId ? 'id' : 'slug';

    const { data: article, error } = await supabase
      .from('articles')
      .select(
        `
        *,
        sources (
          id,
          name,
          categories (
            id,
            name
          )
        ),
        article_categories (
          categories (
            id,
            name
          )
        )
      `
      )
      .eq(searchField, slugOrId)
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      // If it's a "not found" error, return null to trigger 404
      if (error.code === 'PGRST116') {
        return null;
      }
      // For other errors, throw to trigger error boundary
      throw new Error(`Failed to fetch article: ${error.message}`);
    }

    // Validate that we have essential article data
    if (!article || !article.id || !article.title) {
      console.error('Article data is incomplete:', article);
      return null;
    }

    // Extract category from sources or article_categories
    let categoryInfo = null;

    // First try to get category from source
    if (article.sources?.categories) {
      categoryInfo = article.sources.categories;
    }
    // Fallback to article_categories if available
    else if (article.article_categories && article.article_categories.length > 0) {
      categoryInfo = article.article_categories[0].categories;
    }

    // Add the category info to the article object for easier access
    const enrichedArticle = {
      ...article,
      categories: categoryInfo,
    };

    // Cache the article for future requests
    await setCachedArticle(enrichedArticle.id, enrichedArticle as any);

    return enrichedArticle;
  } catch (error) {
    console.error('Unexpected error fetching article:', error);
    throw error; // Re-throw to trigger error boundary
  }
}

async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Create a separate component for the article content to wrap with error boundary
async function ArticleContent({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  const user = await getUser();

  if (!article) {
    return <ArticleNotFound />;
  }

  const readingTime = calculateReadingTime(article.summary || '');
  const showReadingTime = shouldShowReadingTime(article.summary || '');
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/feed"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:bg-blue-950 dark:hover:bg-blue-900 dark:hover:text-blue-300 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Link>
            <Link
              href="/saved"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:bg-green-950 dark:hover:bg-green-900 dark:hover:text-green-300 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Saved Articles
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <article className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          {/* Hero Image with error handling */}
          {article.image_url && (
            <div className="w-full h-64 md:h-96 relative">
              <img
                src={article.image_url}
                alt={article.title || 'Article image'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Category Badge */}
            {article.categories && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                >
                  {article.categories.name}
                </Badge>
              </div>
            )}

            {/* Article Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {cleanText(article.title) || 'Untitled Article'}
            </h1>

            {/* Article Meta Information */}
            <div className="mb-6 pb-6 border-b border-border">
              {/* Source Line */}
              {(article.sources?.name || article.source) && (
                <div className="mb-3">
                  <span className="text-lg font-semibold text-foreground">
                    {cleanText(article.sources?.name || article.source)}
                  </span>
                </div>
              )}

              {/* Author, Date, and Reading Time Line */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {article.author && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>{cleanText(article.author)}</span>
                  </div>
                )}

                {publishedDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{publishedDate}</span>
                  </div>
                )}

                {showReadingTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatReadingTime(readingTime)}</span>
                  </div>
                )}

                {!showReadingTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Quick read</span>
                  </div>
                )}
              </div>
            </div>

            {/* Article Interactions with error boundary */}
            <div className="mb-8">
              <Suspense
                fallback={
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
                  </div>
                }
              >
                <ArticleErrorBoundary>
                  <ArticleInteractions article={article} userId={user?.id || null} />
                </ArticleErrorBoundary>
              </Suspense>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className="text-foreground leading-relaxed text-lg mb-8">
                {cleanText(article.summary) || 'No summary available for this article.'}
              </div>

              {/* Read Full Article Link */}
              {article.url && (
                <div className="bg-muted rounded-lg p-6 text-center border border-border">
                  <p className="text-muted-foreground mb-4">
                    This is a summary of the article. To read the full content, visit the original
                    source.
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                  >
                    Read Full Article
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Related Articles Section with error boundary */}
        <div className="mt-12">
          <Suspense
            fallback={
              <div className="bg-card rounded-lg shadow-sm p-6 md:p-8 border border-border">
                <div className="mb-6">
                  <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="aspect-video w-full bg-muted animate-pulse"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 w-4/5 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <ArticleErrorBoundary>
              <RelatedArticles
                currentArticleId={article.id}
                categoryId={article.category_id}
                categoryName={article.categories?.name}
              />
            </ArticleErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <ArticleErrorBoundary>
      <Suspense fallback={<ArticleDetailSkeleton />}>
        <ArticleContent params={params} />
      </Suspense>
    </ArticleErrorBoundary>
  );
}

// Generate static params for the most recent articles at build time
export async function generateStaticParams() {
  const supabase = createClient();

  // Get the 100 most recent articles to pre-generate at build time
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug')
    .order('published_at', { ascending: false })
    .limit(100);

  if (!articles) {
    return [];
  }

  // Return both ID and slug variants for better coverage
  return articles.flatMap((article) => [{ id: article.id }, { id: article.slug }]);
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: cleanText(article.title) || 'Article',
    description:
      cleanText(article.summary)?.slice(0, 160) || 'Read this article on our news aggregator',
    openGraph: {
      title: cleanText(article.title) || 'Article',
      description: cleanText(article.summary)?.slice(0, 160),
      images: article.image_url ? [{ url: article.image_url }] : [],
      type: 'article',
      publishedTime: article.published_at,
      authors: article.author ? [article.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanText(article.title) || 'Article',
      description: cleanText(article.summary)?.slice(0, 160),
      images: article.image_url ? [article.image_url] : undefined,
    },
  };
}
