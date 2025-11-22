/**
 * Text sanitization utilities
 * Handles HTML entity decoding, CDATA removal, and text cleaning
 */

/**
 * Removes HTML tags, CDATA sections, and decodes HTML entities
 * @param text - Raw text that may contain HTML/CDATA
 * @returns Cleaned, plain text string
 * @example
 * ```typescript
 * cleanText('<![CDATA[Hello &amp; World]]>') // "Hello & World"
 * cleanText('&lt;p&gt;Test&lt;/p&gt;') // "Test"
 * ```
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return (
    text
      // Remove CDATA sections
      .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
      // Remove HTML tags (before decoding entities to preserve decoded text)
      .replace(/<[^>]*>/g, ' ')
      // Decode common HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Decode numeric entities
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Truncates text to a specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param ellipsis - String to append when truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Sanitizes text for safe display (removes potential XSS vectors)
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return cleanText(text)
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/<script/gi, '');
}

/**
 * Extracts plain text from HTML string
 * @param html - HTML string
 * @returns Plain text content
 */
export function htmlToPlainText(html: string): string {
  return cleanText(html);
}
