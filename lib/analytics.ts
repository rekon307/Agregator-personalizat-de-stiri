/**
 * Analytics module for tracking user interactions and events
 * This can be extended to integrate with services like Google Analytics, Mixpanel, etc.
 */

interface LikeEventData {
  userId: string;
  articleId: string;
  isLiked: boolean;
  category?: string;
  source?: string;
  timestamp: string;
}

interface AnalyticsEvent {
  eventName: string;
  eventData: Record<string, any>;
  timestamp: string;
}

class Analytics {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Track a like/unlike event on an article
   * @param userId - The ID of the user performing the action
   * @param articleId - The ID of the article being liked/unliked
   * @param isLiked - Whether the article was liked (true) or unliked (false)
   * @param category - Optional category of the article
   * @param source - Optional source of the article
   */
  async trackLikeEvent(
    userId: string,
    articleId: string,
    isLiked: boolean,
    category?: string,
    source?: string
  ): Promise<void> {
    const eventData: LikeEventData = {
      userId,
      articleId,
      isLiked,
      category,
      source,
      timestamp: new Date().toISOString(),
    };

    // Log in development mode
    if (this.isDevelopment) {
      console.log('[Analytics] Like Event:', eventData);
    }

    // Track the event
    await this.trackEvent('article_like', eventData);
  }

  /**
   * Generic event tracking method
   * Can be extended to send data to analytics services
   * @param eventName - Name of the event
   * @param eventData - Data associated with the event
   */
  private async trackEvent(
    eventName: string,
    eventData: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      eventName,
      eventData,
      timestamp: new Date().toISOString(),
    };

    try {
      // TODO: Integrate with analytics services
      // Examples:
      // - Google Analytics: gtag('event', eventName, eventData)
      // - Mixpanel: mixpanel.track(eventName, eventData)
      // - PostHog: posthog.capture(eventName, eventData)
      // - Custom backend: await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })

      // For now, we'll just log the event
      if (this.isDevelopment) {
        console.log('[Analytics] Event Tracked:', event);
      }

      // Optional: Store analytics in local storage for debugging
      if (typeof window !== 'undefined' && this.isDevelopment) {
        const storedEvents = this.getStoredEvents();
        storedEvents.push(event);

        // Keep only last 100 events to prevent storage overflow
        const recentEvents = storedEvents.slice(-100);
        localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
      }
    } catch (error) {
      // Silently fail - analytics should never break the app
      if (this.isDevelopment) {
        console.error('[Analytics] Error tracking event:', error);
      }
    }
  }

  /**
   * Get stored analytics events from local storage (development only)
   */
  private getStoredEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored analytics events (development utility)
   */
  clearStoredEvents(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_events');
    }
  }

  /**
   * Track page view
   * @param path - The path of the page being viewed
   * @param title - Optional title of the page
   */
  async trackPageView(path: string, title?: string): Promise<void> {
    await this.trackEvent('page_view', {
      path,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }

  /**
   * Track article read
   * @param userId - The ID of the user
   * @param articleId - The ID of the article
   * @param readDuration - Duration in seconds
   */
  async trackArticleRead(
    userId: string,
    articleId: string,
    readDuration?: number
  ): Promise<void> {
    await this.trackEvent('article_read', {
      userId,
      articleId,
      readDuration,
    });
  }

  /**
   * Track article save
   * @param userId - The ID of the user
   * @param articleId - The ID of the article
   * @param isSaved - Whether saved or unsaved
   */
  async trackSaveEvent(
    userId: string,
    articleId: string,
    isSaved: boolean
  ): Promise<void> {
    await this.trackEvent('article_save', {
      userId,
      articleId,
      isSaved,
    });
  }

  /**
   * Track article share
   * @param userId - The ID of the user
   * @param articleId - The ID of the article
   * @param method - Share method (e.g., 'native', 'clipboard')
   */
  async trackShareEvent(
    userId: string,
    articleId: string,
    method: string
  ): Promise<void> {
    await this.trackEvent('article_share', {
      userId,
      articleId,
      method,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();
