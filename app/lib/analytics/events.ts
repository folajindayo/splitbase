/**
 * Analytics event tracking
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class AnalyticsTracker {
  private queue: AnalyticsEvent[] = [];
  private enabled: boolean = true;

  track(name: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    this.queue.push(event);
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", event);
    }

    // Flush if queue is large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  page(pageName: string, properties?: Record<string, any>): void {
    this.track("page_view", {
      page: pageName,
      ...properties,
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.track("identify", {
      userId,
      ...traits,
    });
  }

  flush(): void {
    if (this.queue.length === 0) return;

    // Send events to analytics service
    // Implementation depends on your analytics provider
    console.log(`[Analytics] Flushing ${this.queue.length} events`);
    
    this.queue = [];
  }

  disable(): void {
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  getQueue(): AnalyticsEvent[] {
    return [...this.queue];
  }
}

export const analytics = new AnalyticsTracker();

// Common event tracking functions
export function trackClick(elementName: string, properties?: Record<string, any>): void {
  analytics.track("click", {
    element: elementName,
    ...properties,
  });
}

export function trackFormSubmit(formName: string, properties?: Record<string, any>): void {
  analytics.track("form_submit", {
    form: formName,
    ...properties,
  });
}

export function trackError(error: Error, context?: Record<string, any>): void {
  analytics.track("error", {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

