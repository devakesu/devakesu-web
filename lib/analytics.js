/**
 * Server-side Google Analytics tracker using Measurement Protocol
 * This avoids CSP issues with client-side gtag scripts
 */

export async function sendAnalyticsEvent(params) {
  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;

  if (!measurementId || !apiSecret) {
    // Analytics not configured - skip silently
    return;
  }

  // Generate or retrieve client ID from headers/cookies
  const clientId = params.clientId || generateClientId();

  const payload = {
    client_id: clientId,
    events: [
      {
        name: params.eventName || 'page_view',
        params: {
          page_location: params.pageLocation,
          page_title: params.pageTitle,
          page_referrer: params.referrer,
          engagement_time_msec: params.engagementTime || 100,
          session_id: params.sessionId,
          ...params.customParams,
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

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
  // Try to extract client ID from GA cookie
  const cookies = request.headers.get('cookie') || '';
  const gaMatch = cookies.match(/_ga=GA1\.\d+\.(.+?)(?:;|$)/);

  if (gaMatch) {
    return gaMatch[1];
  }

  // Try custom tracking cookie
  const customMatch = cookies.match(/_gid=(.+?)(?:;|$)/);
  if (customMatch) {
    return customMatch[1];
  }

  // Generate new client ID
  return generateClientId();
}

export function getSessionId() {
  // Generate session ID (timestamp-based)
  return Date.now().toString();
}
