'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Client-side Analytics component that sends events via server-side API
 * This avoids CSP issues by not loading external scripts
 */
export default function Analytics() {
  const pathname = usePathname();
  const sentEvents = useRef(new Set());

  useEffect(() => {
    const trackPageView = async () => {
      const pageLocation = window.location.href;
      const eventKey = `pageview:${pageLocation}`;

      // Prevent duplicate tracking
      if (sentEvents.current.has(eventKey)) return;
      sentEvents.current.add(eventKey);

      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventName: 'page_view',
            pageLocation,
            pageTitle: document.title,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    // Track initial page view
    trackPageView();
  }, [pathname]);

  return null;
}

/**
 * Hook for tracking custom events
 */
export function useAnalytics() {
  const trackEvent = async (eventName, customParams = {}) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          pageLocation: window.location.href,
          pageTitle: document.title,
          customParams,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  return { trackEvent };
}
