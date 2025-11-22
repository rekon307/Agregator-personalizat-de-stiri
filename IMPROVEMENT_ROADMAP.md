# Project Improvement Roadmap

**Last Updated**: 2025-11-21
**Priority Framework**: 🔴 Critical → 🟡 High → 🟢 Medium → ⚪ Low

---

## Quick Wins (1-2 Days)

### 1. 🔴 Security: Remove Committed Secrets
```bash
# Immediate action required
git rm --cached .env.local
echo ".env.local" >> .gitignore
git commit -m "Remove accidentally committed environment file"

# Rotate any exposed credentials in Supabase dashboard
```

### 2. 🔴 Code Quality: Extract Duplicated Code
**Create** `lib/utils/text-sanitization.ts`:
```typescript
/**
 * Removes HTML tags, CDATA sections, and decodes HTML entities
 * @param text - Raw text that may contain HTML/CDATA
 * @returns Cleaned, plain text string
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Update imports** in:
- `components/custom/article-card.tsx`
- `components/custom/enhanced-article-card.tsx`
- `app/(main)/article/[id]/page.tsx`

### 3. 🔴 Developer Experience: Add Linting
```bash
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Create** `.eslintrc.json`:
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_"
    }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 4. 🟡 Code Organization: Add Constants
**Create** `lib/constants.ts`:
```typescript
export const PAGINATION = {
  ARTICLES_PER_PAGE: 20,
  ARTICLES_PER_BATCH: 50,
  MAX_SCROLL_CACHE: 100,
} as const;

export const INGESTION = {
  BATCH_SIZE: 3,
  MAX_BATCHES: 20,
  TIMEOUT_MS: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const USER_LIMITS = {
  SAVED_ARTICLES_DEFAULT: 50,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
} as const;

export const TIMEOUTS = {
  ADMIN_CHECK_MS: 5000,
  DATABASE_QUERY_MS: 10000,
} as const;
```

---

## Week 1-2: Foundation

### 5. 🔴 Testing: Set Up Test Framework
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitest/ui jsdom
```

**Create** `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Create** `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  }),
}));
```

**Create first test** `tests/unit/validation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validate, usernameSchema, emailSchema } from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('usernameSchema', () => {
    it('should accept valid usernames', () => {
      const result = validate(usernameSchema, 'validuser123');
      expect(result.success).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      const result = validate(usernameSchema, 'ab');
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 3');
    });

    it('should reject usernames with special characters', () => {
      const result = validate(usernameSchema, 'user@name');
      expect(result.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      const result = validate(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid emails', () => {
      const result = validate(emailSchema, 'notanemail');
      expect(result.success).toBe(false);
    });
  });
});
```

**Add to** `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 6. 🔴 Security: Add Rate Limiting
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create** `lib/rate-limit.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter (or use in-memory for development)
export const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
      analytics: true,
    })
  : {
      limit: async () => ({ success: true, limit: 10, remaining: 10, reset: 0 }),
    };
```

**Update** `app/api/trigger-ingestion/route.ts`:
```typescript
import { ratelimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', limit, reset },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }

  // ... rest of existing code
}
```

### 7. 🟡 Performance: Add Custom Hooks
**Create** `hooks/useArticleInteractions.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { analytics } from '@/lib/analytics';

interface UseArticleInteractionsOptions {
  articleId: string;
  userId: string | null;
  category?: string;
  source?: string;
}

export function useArticleInteractions({
  articleId,
  userId,
  category,
  source,
}: UseArticleInteractionsOptions) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!userId || !articleId) {
      setIsLoading(false);
      return;
    }

    async function checkStatus() {
      try {
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
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: userId, article_id: articleId });
      }

      await analytics.trackLikeEvent(userId, articleId, newLikedState, category, source);
    } catch (error) {
      setIsLiked(!newLikedState); // Revert on error
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update like status.',
      });
    }
  }, [isLiked, userId, articleId, category, source, supabase, showToast]);

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
        await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);
        setIsSaved(false);
      } else {
        const { data, error } = await supabase.rpc('save_article_with_limit_check', {
          user_uuid: userId,
          article_uuid: articleId,
        });

        if (error) throw error;

        const result = data?.[0];
        if (result?.success) {
          setIsSaved(true);
        } else if (result?.limit_reached) {
          showToast({
            type: 'warning',
            title: 'Limit Reached',
            message: result.message,
          });
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update save status.',
      });
    }
  }, [isSaved, userId, articleId, supabase, showToast]);

  return {
    isSaved,
    isLiked,
    isLoading,
    toggleLike,
    toggleSave,
  };
}
```

---

## Week 3-4: Quality & Performance

### 8. 🟡 Add Pre-commit Hooks
```bash
npm install -D husky lint-staged prettier
npx husky install
```

**Create** `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**Add to** `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**Create** `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

### 9. 🟡 Implement Structured Logging
```bash
npm install winston
```

**Create** `lib/logger.ts`:
```typescript
import winston from 'winston';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// For production, add file or cloud transport
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
}
```

**Replace** console.log/error with structured logging:
```typescript
// Before:
console.error('Error fetching articles:', error);

// After:
logger.error('Failed to fetch articles', {
  error: error.message,
  userId,
  articleId,
  context: 'article-card',
});
```

### 10. 🟡 Add Performance Monitoring
```bash
npm install @vercel/analytics @vercel/speed-insights
```

**Update** `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## Month 2: Architecture & Testing

### 11. 🟢 Create Data Access Layer
**Create** `lib/repositories/article-repository.ts`:
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { Article, ArticleWithDetails } from '@/lib/types/database';

export class ArticleRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<ArticleWithDetails | null> {
    const { data, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        sources!inner(id, name, category_id),
        article_categories(category_id)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserFeed(userId: string, limit: number, offset: number) {
    const { data, error } = await this.supabase.rpc('get_user_visible_articles', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;
    return data;
  }

  async save(userId: string, articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_articles')
      .insert({ user_id: userId, article_id: articleId });

    if (error) throw error;
  }

  async unsave(userId: string, articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) throw error;
  }
}
```

### 12. 🟢 Add Error Boundaries
**Create** `components/error-boundary.tsx`:
```typescript
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 13. 🟢 Comprehensive Test Suite
**Create** `tests/integration/article-interactions.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useArticleInteractions } from '@/hooks/useArticleInteractions';

// Mock component using the hook
function TestComponent({ articleId, userId }: any) {
  const { isSaved, isLiked, toggleLike, toggleSave } = useArticleInteractions({
    articleId,
    userId,
  });

  return (
    <div>
      <span data-testid="saved-status">{isSaved ? 'Saved' : 'Not Saved'}</span>
      <span data-testid="liked-status">{isLiked ? 'Liked' : 'Not Liked'}</span>
      <button onClick={toggleLike}>Toggle Like</button>
      <button onClick={toggleSave}>Toggle Save</button>
    </div>
  );
}

describe('Article Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should toggle like status', async () => {
    render(<TestComponent articleId="123" userId="user1" />);

    const likeButton = screen.getByText('Toggle Like');
    const likedStatus = screen.getByTestId('liked-status');

    expect(likedStatus).toHaveTextContent('Not Liked');

    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(likedStatus).toHaveTextContent('Liked');
    });
  });

  it('should show login prompt when not authenticated', async () => {
    render(<TestComponent articleId="123" userId={null} />);

    const likeButton = screen.getByText('Toggle Like');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(screen.getByText(/login required/i)).toBeInTheDocument();
    });
  });
});
```

---

## Month 3+: Advanced Features

### 14. ⚪ Add Caching Layer
```bash
npm install @upstash/redis swr
```

**Create** `lib/cache.ts`:
```typescript
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null;

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  if (!redis) return fetcher();

  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}
```

### 15. ⚪ Add CI/CD Pipeline
**Create** `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Summary: Priority Matrix

| Priority | Effort | Impact | Items |
|----------|--------|--------|-------|
| 🔴 Critical | Low | High | 1, 2, 3, 6 |
| 🔴 Critical | Medium | High | 5, 7 |
| 🟡 High | Low | Medium | 4, 8, 9 |
| 🟡 High | Medium | Medium | 10, 11 |
| 🟢 Medium | Medium | Medium | 12, 13 |
| ⚪ Low | High | Low | 14, 15 |

---

## Expected Outcomes

### After Week 1:
- ✅ No security vulnerabilities
- ✅ Consistent code style
- ✅ Basic test coverage (30%)
- ✅ Better code organization

### After Month 1:
- ✅ 70% test coverage
- ✅ Performance monitoring in place
- ✅ Structured logging
- ✅ Pre-commit hooks preventing bad code

### After Month 2:
- ✅ 85% test coverage
- ✅ Clean architecture with repositories
- ✅ Error boundaries on all critical paths
- ✅ Comprehensive integration tests

### After Month 3:
- ✅ Production-ready application
- ✅ Automated CI/CD
- ✅ Caching for better performance
- ✅ Full observability

---

**Next Action**: Choose 3-5 items from "Quick Wins" and start implementing today!
