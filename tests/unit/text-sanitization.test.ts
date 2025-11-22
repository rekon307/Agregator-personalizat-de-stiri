import { describe, it, expect } from 'vitest';
import {
  cleanText,
  truncateText,
  sanitizeText,
  htmlToPlainText,
} from '@/lib/utils/text-sanitization';

describe('Text Sanitization', () => {
  describe('cleanText', () => {
    it('should remove CDATA sections', () => {
      expect(cleanText('<![CDATA[Hello World]]>')).toBe('Hello World');
    });

    it('should decode HTML entities', () => {
      expect(cleanText('Hello &amp; World')).toBe('Hello & World');
      expect(cleanText('&lt;Test&gt;')).toBe('<Test>');
      expect(cleanText('&quot;Quote&quot;')).toBe('"Quote"');
      expect(cleanText('&#39;Apostrophe&#39;')).toBe("'Apostrophe'");
    });

    it('should remove HTML tags', () => {
      expect(cleanText('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
      expect(cleanText('<div><span>Test</span></div>')).toBe('Test');
    });

    it('should handle complex HTML with entities', () => {
      const input = '<![CDATA[<p>Test &amp; data</p>]]>';
      expect(cleanText(input)).toBe('Test & data');
    });

    it('should normalize whitespace', () => {
      expect(cleanText('Hello    World')).toBe('Hello World');
      expect(cleanText('  Trim me  ')).toBe('Trim me');
    });

    it('should handle null and undefined', () => {
      expect(cleanText(null)).toBe('');
      expect(cleanText(undefined)).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short text', () => {
      expect(truncateText('Hi', 10)).toBe('Hi');
    });

    it('should use custom ellipsis', () => {
      expect(truncateText('Hello World', 8, '…')).toBe('Hello W…');
    });
  });

  describe('sanitizeText', () => {
    it('should remove javascript: URLs', () => {
      expect(sanitizeText('Click javascript:alert(1)')).toBe('Click alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeText('<img onerror=alert(1)>')).toBe('');
    });

    it('should remove script tags', () => {
      expect(sanitizeText('<script>alert(1)</script>')).toBe('alert(1)');
    });
  });

  describe('htmlToPlainText', () => {
    it('should extract plain text from HTML', () => {
      expect(htmlToPlainText('<p>Hello</p><p>World</p>')).toBe('Hello World');
    });
  });
});
