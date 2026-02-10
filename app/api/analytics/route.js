import { NextResponse } from 'next/server';
import { sendAnalyticsEvent, getClientId, getSessionId, isAnalyticsConfigured } from '@/lib/analytics';
import { isIP } from 'node:net';

// Module-level flag to prevent log flooding during misconfiguration
let hasLoggedMissingUrl = false;
// Module-level flag to prevent log flooding for dev IP warnings
let hasLoggedDevIpWarning = false;
// Module-level flag to prevent log flooding for production IP warnings
let hasLoggedProdIpWarning = false;

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

/**
 * Extracts the client IP address from request headers.
 * 
 * DEPLOYMENT ARCHITECTURE ASSUMPTIONS:
 * This function prioritizes headers in the following order, which assumes a specific deployment setup:
 * 1. cf-connecting-ip (Cloudflare CDN) - Most trusted when behind Cloudflare
 * 2. x-real-ip (nginx/Apache reverse proxy) - Common for traditional reverse proxies
 * 3. x-forwarded-for (various proxies/load balancers) - Takes first IP in chain
 * 
 * CONFIGURATION NOTES:
 * - If NOT behind Cloudflare: Consider prioritizing x-real-ip or x-forwarded-for
 * - Behind AWS ALB/ELB: x-forwarded-for is the standard header
 * - Behind Google Cloud Load Balancer: x-forwarded-for is used
 * - Behind Azure Front Door: x-azure-clientip or x-forwarded-for
 * 
 * The current order assumes Cloudflare as the primary CDN. If your deployment differs,
 * adjust the priority order or make it configurable via environment variables.
 * 
 * SECURITY WARNING:
 * These headers can be spoofed if not properly configured at the reverse proxy level.
 * Ensure your reverse proxy strips/overwrites these headers from client requests.
 * 
 * DEVELOPMENT TESTING:
 * In development mode, set TEST_CLIENT_IP environment variable to test IP-based logic
 * with a specific IP address (e.g., TEST_CLIENT_IP=203.0.113.45).
 * 
 * @param {Headers} headerList - The Headers object from the request
 * @returns {string|null} The client IP address or null if it cannot be determined
 */
function getClientIp(headerList) {
  const cf = headerList.get("cf-connecting-ip")?.trim();
  if (cf && isIP(cf)) return cf;

  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) return realIp;

  const forwarded = headerList.get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",")[0]?.trim();
  if (forwardedIp && isIP(forwardedIp)) return forwardedIp;

  // In development, allow testing with a specific IP via environment variable
  // SECURITY NOTE: NODE_ENV should be set securely in deployment configuration
  // to prevent accidental exposure of development-only behavior in production
  if (process.env.NODE_ENV === "development") {
    const testIp = process.env.TEST_CLIENT_IP;
    
    // Log warning once per server start to make it prominent but avoid spam
    if (!hasLoggedDevIpWarning) {
      hasLoggedDevIpWarning = true;
      console.warn(
        "\n" +
        "═══════════════════════════════════════════════════════════════════════\n" +
        "⚠️  DEVELOPMENT MODE: Client IP Detection\n" +
        "═══════════════════════════════════════════════════════════════════════\n" +
        "No IP forwarding headers found. This affects IP-based security features\n" +
        "such as rate limiting, geolocation, and audit logging.\n\n" +
        "To test real IP logic in development:\n" +
        "  1. Set TEST_CLIENT_IP environment variable (e.g., TEST_CLIENT_IP=203.0.113.45)\n" +
        "  2. Or send x-real-ip or cf-connecting-ip headers in your requests\n" +
        `\nCurrent fallback: ${testIp || "127.0.0.1"}\n` +
        "═══════════════════════════════════════════════════════════════════════\n"
      );
    }
    
    return testIp || "127.0.0.1";
  }

  // In production, return null to signal that IP extraction failed
  // Callers must handle this null case appropriately (e.g., by rejecting the request)
  // Log warning once per server start to avoid flooding logs under high traffic
  if (!hasLoggedProdIpWarning) {
    hasLoggedProdIpWarning = true;
    console.warn(
      "[getClientIp] No IP forwarding headers found in production. " +
      "Ensure reverse proxy is configured to set x-forwarded-for, x-real-ip, or cf-connecting-ip headers. " +
      "Request will be rejected if IP is required for security checks."
    );
  }
  return null;
}

export async function POST(request) {
  try {
    // Extract client IP using the priority-ordered header check
    // This replaces the old TRUST_PROXY-based logic with a more robust approach
    // that handles multiple CDN/proxy scenarios (Cloudflare, nginx, AWS, etc.)
    const ip = getClientIp(request.headers);

    // Use shared bucket with stricter limit if IP cannot be determined
    // WARNING: When `ip` is null, all clients share the '__unknown__' rate-limit key.
    // This means the stricter unknown limit (10 req/min) applies globally, potentially
    // causing false-positive 429s for legitimate traffic. To avoid this in production:
    // 1. Ensure your reverse proxy/CDN sets proper headers (cf-connecting-ip, x-real-ip, or x-forwarded-for)
    // 2. Verify the proxy strips/overwrites these headers from client requests
    // 3. For platforms like Vercel/Netlify, headers are usually configured automatically
    // 4. In development, use TEST_CLIENT_IP environment variable to test IP-based logic
    const rateLimitKey = ip || UNKNOWN_IP_KEY;
    const isUnknown = !ip;

    if (!checkRateLimit(rateLimitKey, isUnknown)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Reject requests when both Origin and Referer are absent (non-browser clients)
    // This cheap header check provides defense-in-depth even when GA is disabled
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!origin && !referer) {
      console.warn('Analytics request missing both Origin and Referer headers - rejecting non-browser request');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Short-circuit early when GA is not configured to keep optional analytics low-overhead
    // Rate limiting and basic header checks above provide minimal defense against abuse
    if (!isAnalyticsConfigured()) {
      // Analytics not configured - return success without further processing
      return new NextResponse(null, { status: 204 });
    }

    // Origin/referer check to prevent cross-origin abuse
    // Validate against server-side allowlist instead of client-controlled Host header
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
    } else if (process.env.NODE_ENV === 'production') {
      // Missing NEXT_PUBLIC_SITE_URL in production is a server misconfiguration
      // Guard log to emit only once per process to prevent log flooding
      if (!hasLoggedMissingUrl) {
        console.error('NEXT_PUBLIC_SITE_URL is not configured. Analytics origin validation cannot be performed.');
        hasLoggedMissingUrl = true;
      }
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
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
    
    // Forward client IP to Google Analytics if it was successfully extracted
    // The IP was already extracted using getClientIp() which validates headers
    // and ensures we only forward IPs from trusted proxy headers
    const clientIp = ip || undefined;

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
