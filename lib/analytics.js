/**
 * Server-side Google Analytics tracker using Measurement Protocol
 * This avoids CSP issues with client-side gtag scripts
 */

/**
 * Check if Google Analytics is properly configured
 * @returns {boolean} true if GA_MEASUREMENT_ID and GA_API_SECRET are both set
 */
export function isAnalyticsConfigured() {
  return !!(process.env.GA_MEASUREMENT_ID && process.env.GA_API_SECRET);
}

export async function sendAnalyticsEvent(params) {
  if (!isAnalyticsConfigured()) {
    // Analytics not configured - skip silently
    return;
  }

  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;

  // Generate or retrieve client ID from headers/cookies
  const clientId = params.clientId || generateClientId();

  const payload = {
    client_id: clientId,
    events: [
      {
        name: params.eventName || 'page_view',
        params: {
          // Spread custom params first, then set reserved fields to ensure custom params can't override them
          ...params.customParams,
          // Reserved fields set afterward take precedence and can't be overridden by customParams
          page_location: params.pageLocation,
          page_title: params.pageTitle,
          page_referrer: params.referrer,
          engagement_time_msec: params.engagementTime || 100,
          session_id: params.sessionId,
        },
      },
    ],
  };

  try {
    // Build Measurement Protocol endpoint with optional client IP override
    let endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
    
    // Forward client IP to Google Analytics for accurate geolocation
    // Only include if explicitly provided (respects privacy settings)
    if (params.clientIp) {
      endpoint += `&user_ip=${encodeURIComponent(params.clientIp)}`;
    }

    // Build headers, forwarding client User-Agent when available
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Forward User-Agent to Google Analytics for accurate device/browser detection
    // Only include if explicitly provided (respects privacy settings)
    if (params.userAgent) {
      headers['User-Agent'] = params.userAgent;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Analytics event failed:', response.status);
    }
  } catch (error) {
    console.error('Failed to send analytics event:', error);
  }
}

function generateClientId() {
  // Generate a random client ID in GA format: timestamp.random
  return `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
}

export function getClientId(request) {
  const cookies = request.headers.get('cookie') || '';

  // Prefer a custom first-party tracking cookie (set by the application)
  const customMatch = cookies.match(/ga_client_id=([^;]+)(?:;|$)/);
  if (customMatch) {
    return customMatch[1];
  }

  // Fallback: Try to extract client ID from GA cookie if it exists
  const gaMatch = cookies.match(/_ga=GA1\.\d+\.(.+?)(?:;|$)/);
  if (gaMatch) {
    return gaMatch[1];
  }

  // Generate new client ID
  return generateClientId();
}

export function getSessionId(request) {
  // Try to get session ID from cookie
  const cookies = request?.headers?.get('cookie') || '';
  const sessionMatch = cookies.match(/ga_session_id=([^;]+)(?:;|$)/);
  
  if (sessionMatch) {
    return sessionMatch[1];
  }
  
  // Generate a random, opaque session ID
  return generateSessionId();
}

function generateSessionId() {
  // Generate a (best-effort) cryptographically secure random session ID
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback for environments without crypto.randomUUID but with getRandomValues
    if (typeof crypto.getRandomValues === 'function') {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  }

  // Final fallback for environments without Web Crypto (weak security)
  // Combine multiple random sources for better unpredictability
  return `${Date.now()}.${Math.random().toString(36).substring(2)}.${Math.random().toString(36).substring(2)}`;
}
