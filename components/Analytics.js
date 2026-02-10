'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { isAnalyticsEnabled } from '@/lib/analytics-config';

/**
 * Client-side Analytics component that sends events via server-side API
 * This avoids CSP issues by not loading external scripts
 */
export default function Analytics() {
  const pathname = usePathname();
  const lastTrackedPathnameRef = useRef(null);

  useEffect(() => {
    const trackPageView = async () => {
      // Short-circuit if analytics is disabled to avoid unnecessary API requests
      if (!isAnalyticsEnabled()) {
        return;
      }

      const pageLocation = window.location.href;

      // Prevent duplicate tracking in two ways:
      // 1. Check ref for current effect run (prevents same-effect duplicates)
      // 2. Check sessionStorage to prevent StrictMode remount duplicates
      // Use a single key with timestamp to avoid storage accumulation
      // Wrap sessionStorage access in try-catch for browsers with storage disabled
      const sessionKey = 'analytics_last_tracked';
      let lastTracked = null;

      try {
        lastTracked = sessionStorage.getItem(sessionKey);
      } catch (e) {
        // sessionStorage unavailable (privacy mode, disabled storage, etc.)
        // Fall back to ref-only de-duplication
      }

      const now = Date.now();

      // Only track if pathname is different or enough time has passed (debounce)
      if (lastTracked) {
        try {
          const { pathname: lastPath, timestamp } = JSON.parse(lastTracked);
          // Skip if same pathname and tracked within last 100ms (StrictMode duplicate)
          // Note: 100ms window is tight but sufficient for React StrictMode duplicate mount detection.
          // In dev, StrictMode intentionally mounts components twice in rapid succession (< 50ms apart).
          // This threshold prevents double-tracking in StrictMode while allowing legitimate rapid
          // navigation (e.g., back button). May need adjustment for slower devices if false positives occur.
          if (lastPath === pathname && now - timestamp < 100) {
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

      try {
        sessionStorage.setItem(sessionKey, JSON.stringify({ pathname, timestamp: now }));
      } catch (e) {
        // sessionStorage unavailable - continue without persisting
      }

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
 * Returns a stable trackEvent function reference via useCallback
 * When NEXT_PUBLIC_ANALYTICS_ENABLED is not truthy, returns a no-op function to avoid unnecessary API requests
 */
export function useAnalytics() {
  const trackEvent = useCallback(async (eventName, customParams = {}) => {
    // Short-circuit if analytics is disabled to avoid unnecessary API requests
    // Note: NEXT_PUBLIC_* env vars are replaced at build time, so this check is constant
    if (!isAnalyticsEnabled()) {
      return;
    }

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
  }, []);

  return { trackEvent };
}
