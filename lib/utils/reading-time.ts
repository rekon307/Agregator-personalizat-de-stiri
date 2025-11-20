/**
 * Reading time calculation utilities
 * Estimates reading time based on word count and average reading speed
 */

/**
 * Average reading speed in words per minute
 * - Slow readers: ~200 WPM
 * - Average readers: ~250 WPM
 * - Fast readers: ~300+ WPM
 * We use 250 WPM as a reasonable average
 */
const WORDS_PER_MINUTE = 250;

/**
 * Minimum content length (in words) to show reading time
 * Articles shorter than this are too short to need a reading time indicator
 */
const MIN_WORDS_FOR_READING_TIME = 50;

/**
 * Count words in a text string
 * @param text - The text to count words in
 * @returns Number of words
 */
function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Remove HTML tags if present
  const cleanText = text.replace(/<[^>]*>/g, ' ');

  // Split by whitespace and filter out empty strings
  const words = cleanText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return words.length;
}

/**
 * Calculate reading time in minutes
 * @param content - The article content (can be HTML or plain text)
 * @param summary - Optional article summary
 * @param wordsPerMinute - Optional custom reading speed (default: 250 WPM)
 * @returns Reading time in minutes (rounded up)
 */
export function calculateReadingTime(
  content: string | null | undefined,
  summary?: string | null,
  wordsPerMinute: number = WORDS_PER_MINUTE
): number {
  let totalWords = 0;

  // Count words in content
  if (content) {
    totalWords += countWords(content);
  }

  // Count words in summary if content is not available
  if (!content && summary) {
    totalWords += countWords(summary);
  }

  // Calculate reading time in minutes
  const minutes = totalWords / wordsPerMinute;

  // Round up to nearest minute (minimum 1 minute)
  return Math.max(1, Math.ceil(minutes));
}

/**
 * Format reading time as a human-readable string
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read", "< 1 min read")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) {
    return '< 1 min read';
  }

  if (minutes === 1) {
    return '1 min read';
  }

  return `${minutes} min read`;
}

/**
 * Determine if reading time should be shown
 * @param content - The article content
 * @param summary - Optional article summary
 * @param minWords - Minimum word count threshold (default: 50 words)
 * @returns True if reading time should be displayed
 */
export function shouldShowReadingTime(
  content: string | null | undefined,
  summary?: string | null,
  minWords: number = MIN_WORDS_FOR_READING_TIME
): boolean {
  let totalWords = 0;

  if (content) {
    totalWords += countWords(content);
  }

  if (!content && summary) {
    totalWords += countWords(summary);
  }

  return totalWords >= minWords;
}

/**
 * Get reading time info for an article
 * @param content - The article content
 * @param summary - Optional article summary
 * @returns Object with reading time data
 */
export function getReadingTimeInfo(
  content: string | null | undefined,
  summary?: string | null
): {
  minutes: number;
  formatted: string;
  shouldShow: boolean;
  wordCount: number;
} {
  let wordCount = 0;

  if (content) {
    wordCount += countWords(content);
  }

  if (!content && summary) {
    wordCount += countWords(summary);
  }

  const minutes = calculateReadingTime(content, summary);
  const formatted = formatReadingTime(minutes);
  const shouldShow = wordCount >= MIN_WORDS_FOR_READING_TIME;

  return {
    minutes,
    formatted,
    shouldShow,
    wordCount,
  };
}

/**
 * Calculate reading progress percentage
 * @param scrollPosition - Current scroll position in pixels
 * @param contentHeight - Total content height in pixels
 * @returns Progress percentage (0-100)
 */
export function calculateReadingProgress(
  scrollPosition: number,
  contentHeight: number
): number {
  if (contentHeight <= 0) {
    return 0;
  }

  const progress = (scrollPosition / contentHeight) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, progress));
}

/**
 * Estimate time remaining based on reading progress
 * @param totalMinutes - Total reading time in minutes
 * @param progressPercentage - Current progress (0-100)
 * @returns Estimated minutes remaining
 */
export function estimateTimeRemaining(
  totalMinutes: number,
  progressPercentage: number
): number {
  if (progressPercentage >= 100) {
    return 0;
  }

  const remainingPercentage = 100 - progressPercentage;
  const timeRemaining = (totalMinutes * remainingPercentage) / 100;

  return Math.ceil(timeRemaining);
}
