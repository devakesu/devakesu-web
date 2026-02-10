import { NextResponse } from 'next/server';
import { sendAnalyticsEvent, getClientId, getSessionId } from '@/lib/analytics';
import { isIP } from 'node:net';

// Simple in-memory rate limiter
// Maps IP -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP
const RATE_LIMIT_MAX_REQUESTS_UNKNOWN = 10; // Stricter limit for unknown IPs
const MAX_MAP_SIZE = 5000; // Prevent memory bloat (reduced for better performance)
const CLEANUP_BATCH_SIZE = 100; // Incremental cleanup to avoid latency spikes
const UNKNOWN_IP_KEY = '__unknown__'; // Special key for requests without valid IP

/**
 * Evicts oldest entries from the rate limit map when it exceeds the maximum size.
 * Uses a simple sort to find and delete the oldest entries.
 * @param {Map} map - The rate limit map
 * @param {number} targetSize - Target size to reduce the map to
 */
function evictOldestEntries(map, targetSize) {
  const excess = map.size - targetSize;
  if (excess <= 0) return;

  // Collect all entries and sort by resetTime (oldest first)
  const entriesArray = Array.from(map.entries());
  entriesArray.sort((a, b) => a[1].resetTime - b[1].resetTime);

  // Evict the oldest `excess` entries
  for (let i = 0; i < excess; i++) {
    const keyToDelete = entriesArray[i][0];
    map.delete(keyToDelete);
  }
}

function checkRateLimit(ip, isUnknown = false) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  const maxRequests = isUnknown ? RATE_LIMIT_MAX_REQUESTS_UNKNOWN : RATE_LIMIT_MAX_REQUESTS;

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    
    // Incremental cleanup: remove a limited number of expired entries per request
    if (rateLimitMap.size > MAX_MAP_SIZE) {
      let cleaned = 0;
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key);
          cleaned++;
          if (cleaned >= CLEANUP_BATCH_SIZE) {
            break; // Stop after cleaning batch to avoid latency spike
          }
        }
      }
      
      // Hard cap: if still over limit after cleanup, evict oldest entries
      if (rateLimitMap.size > MAX_MAP_SIZE) {
        evictOldestEntries(rateLimitMap, MAX_MAP_SIZE);
      }
    }
    
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Validate and normalize IP address using Node.js built-in isIP
function normalizeIP(rawIP) {
  if (!rawIP || typeof rawIP !== 'string') {
    return null;
  }
  
  // Trim whitespace and limit length to prevent abuse
  const trimmed = rawIP.trim();
  if (trimmed.length > 45) { // Max IPv6 length is 45 chars
    return null;
  }
  
  // Use Node.js built-in isIP for accurate IPv4/IPv6 validation
  // Returns 4 for IPv4, 6 for IPv6, 0 for invalid
  if (isIP(trimmed)) {
    return trimmed;
  }
  
  return null;
}

export async function POST(request) {
  try {
    // Rate limiting by IP - use request.ip as primary source to prevent spoofing
    // Only trust forwarded-IP headers when explicitly configured (e.g., behind a trusted proxy)
    const trustProxy = process.env.TRUST_PROXY === 'true';
    let ip = null;
    
    if (trustProxy) {
      // When behind a trusted proxy, use forwarded headers
      const headerIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       '';
      ip = normalizeIP(headerIP);
    }
    
    // Fallback to request.ip (the direct connection IP)
    if (!ip) {
      ip = normalizeIP(request.ip);
    }
    
    // Use shared bucket with stricter limit if IP cannot be determined
    const rateLimitKey = ip || UNKNOWN_IP_KEY;
    const isUnknown = !ip;
    
    if (!checkRateLimit(rateLimitKey, isUnknown)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Origin/referer check to prevent cross-origin abuse
    // Validate against server-side allowlist instead of client-controlled Host header
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    
    // Pre-validate and parse the allowed origin configuration
    let allowedUrl = null;
    if (allowedOrigin) {
      try {
        allowedUrl = new URL(allowedOrigin);
      } catch (configError) {
        // Misconfigured NEXT_PUBLIC_SITE_URL - log and reject
        console.error('Invalid NEXT_PUBLIC_SITE_URL configuration:', allowedOrigin, configError.message);
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
    }
    
    // Reject requests when both Origin and Referer are absent (non-browser clients)
    // Additionally validate Sec-Fetch-Site to make it harder for non-browser clients to bypass
    if (!origin && !referer) {
      console.warn('Analytics request missing both Origin and Referer headers - rejecting non-browser request');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Additional validation: check Sec-Fetch-Site header (browser-controlled, harder to spoof)
    // Sec-Fetch-Site is sent by modern browsers and indicates the relationship between request origin and target
    // Note: Older browsers may not send these headers; validation is opt-in when present for defense-in-depth
    const secFetchSite = request.headers.get('sec-fetch-site');
    const secFetchMode = request.headers.get('sec-fetch-mode');
    
    // If Sec-Fetch headers are present (modern browser), validate them
    if (secFetchSite !== null) {
      // Allow same-origin, same-site, and none (direct navigation)
      // Reject cross-site requests
      if (secFetchSite === 'cross-site') {
        console.warn('Analytics request rejected: cross-site Sec-Fetch-Site header');
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    // If Sec-Fetch-Mode is present, validate it's an appropriate mode for analytics
    if (secFetchMode !== null) {
      // Only allow modes typically used for legitimate fetch/navigation requests:
      // - 'cors': cross-origin resource sharing fetch
      // - 'navigate': page navigation
      // - 'same-origin': same-origin fetch
      // Reject all other modes including 'no-cors', 'websocket', 'nested-navigate' etc.
      const allowedModes = ['cors', 'navigate', 'same-origin'];
      if (!allowedModes.includes(secFetchMode)) {
        console.warn('Analytics request rejected: invalid Sec-Fetch-Mode:', secFetchMode);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    // Enforce same-origin policy
    const source = origin || referer;
    try {
      const url = new URL(source);
      
      // In production, validate against NEXT_PUBLIC_SITE_URL
      // In development, allow localhost and 127.0.0.1 with common dev ports
      const isDevelopmentLocal = process.env.NODE_ENV !== 'production' && 
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
        (url.port === '3000' || url.port === '3001' || url.port === '' || url.port === '80' || url.port === '443');
      
      // Compare full origin (protocol + host) to prevent http/https scheme mismatches
      const isAllowed = 
        (allowedUrl && url.origin === allowedUrl.origin) ||
        isDevelopmentLocal;
      
      if (!isAllowed) {
        console.warn(
          'Analytics request from unexpected origin:', 
          source, 
          'expected:', 
          allowedOrigin || 'localhost:3000/3001'
        );
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (e) {
      // Malformed origin/referer from client: treat as suspicious and block
      console.warn('Analytics request with invalid origin/referer:', source, 'error:', e.message);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { eventName, pageLocation, pageTitle, referrer, customParams } = body;

    // Basic validation
    if (!eventName || typeof eventName !== 'string' || eventName.length > 100) {
      return NextResponse.json({ error: 'Invalid eventName' }, { status: 400 });
    }

    if (pageLocation && (typeof pageLocation !== 'string' || pageLocation.length > 500)) {
      return NextResponse.json({ error: 'Invalid pageLocation' }, { status: 400 });
    }

    if (pageTitle && (typeof pageTitle !== 'string' || pageTitle.length > 500)) {
      return NextResponse.json({ error: 'Invalid pageTitle' }, { status: 400 });
    }

    if (referrer && (typeof referrer !== 'string' || referrer.length > 500)) {
      return NextResponse.json({ error: 'Invalid referrer' }, { status: 400 });
    }

    if (customParams !== undefined && customParams !== null) {
      if (typeof customParams !== 'object' || Array.isArray(customParams)) {
        return NextResponse.json({ error: 'Invalid customParams: must be a plain object' }, { status: 400 });
      }
      
      const keys = Object.keys(customParams);
      if (keys.length > 20) {
        return NextResponse.json({ error: 'Invalid customParams: too many keys (max 20)' }, { status: 400 });
      }
      
      for (const key of keys) {
        if (typeof key !== 'string' || key.length > 100) {
          return NextResponse.json({ error: 'Invalid customParams: key too long' }, { status: 400 });
        }
        
        const value = customParams[key];
        const valueType = typeof value;
        if (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean' && value !== null) {
          return NextResponse.json({ error: 'Invalid customParams: values must be string/number/boolean/null' }, { status: 400 });
        }
        
        if (valueType === 'string' && value.length > 500) {
          return NextResponse.json({ error: 'Invalid customParams: string value too long' }, { status: 400 });
        }
      }
    }

    // Get client ID and session ID from request
    const clientId = getClientId(request);
    const sessionId = getSessionId(request);

    // Extract client context for forwarding to Google Analytics
    // This enables accurate device/browser/location attribution
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // Only forward client IP if explicitly allowed via TRUST_PROXY.
    // This reuses the same trust decision used when extracting `ip` from headers
    // to avoid inconsistent behavior between rate limiting and analytics.
    let clientIp = undefined;
    
    if (trustProxy) {
      if (ip) {
        // Prefer the previously extracted client IP when available
        clientIp = ip;
      } else if (request.ip && isIP(request.ip)) {
        // Fallback to platform-provided IP when available (e.g., Vercel, Netlify),
        // but only if it is a valid IP address.
        clientIp = request.ip;
      }
    }
    // Otherwise, don't forward IP to avoid data pollution/privacy issues

    // Send event to Google Analytics
    await sendAnalyticsEvent({
      eventName,
      pageLocation,
      pageTitle,
      referrer,
      clientId,
      sessionId,
      customParams,
      userAgent,
      clientIp,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
