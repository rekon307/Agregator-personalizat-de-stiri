/**
 * Application-wide constants
 * Centralizes magic numbers and strings for easier maintenance
 */

/**
 * Pagination configuration
 */
export const PAGINATION = {
  /** Number of articles to display per page in the feed */
  ARTICLES_PER_PAGE: 20,
  /** Number of articles to fetch per batch during infinite scroll */
  ARTICLES_PER_BATCH: 50,
  /** Maximum number of articles to keep in memory during scroll */
  MAX_SCROLL_CACHE: 100,
  /** Number of comments to load per page */
  COMMENTS_PER_PAGE: 20,
} as const;

/**
 * News ingestion configuration
 */
export const INGESTION = {
  /** Number of RSS sources to process per batch */
  BATCH_SIZE: 3,
  /** Maximum number of batches to process in one run */
  MAX_BATCHES: 20,
  /** Timeout for Edge Function call (5 minutes) */
  TIMEOUT_MS: 300000,
  /** Number of retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,
  /** Initial delay between retries (exponential backoff) */
  RETRY_DELAY_MS: 1000,
  /** Maximum backoff delay */
  MAX_RETRY_DELAY_MS: 10000,
} as const;

/**
 * User limits and constraints
 */
export const USER_LIMITS = {
  /** Default number of saved articles allowed per user */
  SAVED_ARTICLES_DEFAULT: 50,
  /** Minimum username length */
  USERNAME_MIN_LENGTH: 3,
  /** Maximum username length */
  USERNAME_MAX_LENGTH: 30,
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 8,
  /** Maximum password length */
  PASSWORD_MAX_LENGTH: 128,
  /** Maximum comment length */
  MAX_COMMENT_LENGTH: 1000,
  /** Maximum folder name length */
  MAX_FOLDER_NAME_LENGTH: 50,
  /** Maximum tag name length */
  MAX_TAG_NAME_LENGTH: 30,
} as const;

/**
 * Timeout configurations
 */
export const TIMEOUTS = {
  /** Timeout for admin role check */
  ADMIN_CHECK_MS: 5000,
  /** Default database query timeout */
  DATABASE_QUERY_MS: 10000,
  /** Authentication check timeout */
  AUTH_CHECK_MS: 5000,
  /** Debounce delay for search inputs */
  SEARCH_DEBOUNCE_MS: 300,
  /** Throttle delay for scroll events */
  SCROLL_THROTTLE_MS: 100,
} as const;

/**
 * Cache durations (in seconds)
 */
export const CACHE_TTL = {
  /** Cache duration for user feed */
  USER_FEED: 300, // 5 minutes
  /** Cache duration for article details */
  ARTICLE_DETAILS: 3600, // 1 hour
  /** Cache duration for category list */
  CATEGORIES: 86400, // 24 hours
  /** Cache duration for sources list */
  SOURCES: 3600, // 1 hour
  /** Cache duration for user profile */
  USER_PROFILE: 600, // 10 minutes
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  /** Requests per window for ingestion API */
  INGESTION_REQUESTS: 10,
  /** Time window for ingestion rate limit (seconds) */
  INGESTION_WINDOW: 60,
  /** Requests per window for general API */
  API_REQUESTS: 100,
  /** Time window for API rate limit (seconds) */
  API_WINDOW: 60,
  /** Login attempts before lockout */
  LOGIN_ATTEMPTS: 5,
  /** Lockout duration (seconds) */
  LOGIN_LOCKOUT: 900, // 15 minutes
} as const;

/**
 * Reading time calculation
 */
export const READING = {
  /** Average words per minute for reading time calculation */
  WORDS_PER_MINUTE: 250,
  /** Minimum word count to show reading time */
  MIN_WORDS_FOR_READING_TIME: 50,
} as const;

/**
 * UI configuration
 */
export const UI = {
  /** Skeleton loader count for initial load */
  SKELETON_COUNT: 6,
  /** Maximum articles to show in related articles */
  MAX_RELATED_ARTICLES: 5,
  /** Toast notification duration (ms) */
  TOAST_DURATION: 5000,
  /** Animation duration (ms) */
  ANIMATION_DURATION: 300,
} as const;

/**
 * Routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FEED: '/feed',
  SAVED: '/saved',
  PROFILE: '/profile',
  ONBOARDING: '/onboarding',
  ADMIN: '/admin/dashboard',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in.',
  LOGOUT: 'Successfully logged out.',
  SIGNUP: 'Account created successfully.',
  ARTICLE_SAVED: 'Article saved successfully.',
  ARTICLE_LIKED: 'Article liked.',
  COMMENT_POSTED: 'Comment posted successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
} as const;
