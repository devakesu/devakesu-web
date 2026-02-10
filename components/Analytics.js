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
      // Use a single key with timestamp to avoid storage accumulation
      const sessionKey = 'analytics_last_tracked';
      const lastTracked = sessionStorage.getItem(sessionKey);
      const now = Date.now();
      
      // Only track if pathname is different or enough time has passed (debounce)
      if (lastTracked) {
        try {
          const { pathname: lastPath, timestamp } = JSON.parse(lastTracked);
          // Skip if same pathname and tracked within last 100ms (StrictMode duplicate)
          if (lastPath === pathname && (now - timestamp) < 100) {
            return;
          }
        } catch (e) {
          // Invalid storage data, continue with tracking
        }
      }

      if (lastTrackedPathnameRef.current === pathname) {
        return;
      }

      lastTrackedPathnameRef.current = pathname;
      sessionStorage.setItem(sessionKey, JSON.stringify({ pathname, timestamp: now }));

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
