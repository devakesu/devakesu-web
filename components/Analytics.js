'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Client-side Analytics component that sends events via server-side API
 * This avoids CSP issues by not loading external scripts
 */
export default function Analytics() {
  const pathname = usePathname();
  const lastTrackedPathnameRef = useRef(null);

  useEffect(() => {
    const trackPageView = async () => {
      const pageLocation = window.location.href;

      // Prevent duplicate tracking in two ways:
      // 1. Check ref for current effect run (prevents same-effect duplicates)
      // 2. Check sessionStorage to prevent StrictMode remount duplicates
      const sessionKey = `analytics_tracked_${pathname}`;
      const alreadyTracked = sessionStorage.getItem(sessionKey);

      if (lastTrackedPathnameRef.current === pathname || alreadyTracked) {
        return;
      }

      lastTrackedPathnameRef.current = pathname;
      sessionStorage.setItem(sessionKey, 'true');

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
        // Keep request alive even if page navigates away (e.g., opening links in new tabs)
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  return { trackEvent };
}
