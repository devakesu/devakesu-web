import { NextResponse } from 'next/server';
import { sendAnalyticsEvent, getClientId, getSessionId } from '@/lib/analytics';

// Simple in-memory rate limiter
// Maps IP -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP
const MAX_MAP_SIZE = 5000; // Prevent memory bloat (reduced for better performance)
const CLEANUP_BATCH_SIZE = 100; // Incremental cleanup to avoid latency spikes

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

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
        const entriesToRemove = Array.from(rateLimitMap.entries())
          .sort((a, b) => a[1].resetTime - b[1].resetTime)
          .slice(0, CLEANUP_BATCH_SIZE);
        
        for (const [key] of entriesToRemove) {
          rateLimitMap.delete(key);
        }
      }
    }
    
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Validate and normalize IP address
function normalizeIP(rawIP) {
  if (!rawIP || typeof rawIP !== 'string') {
    return null;
  }
  
  // Trim whitespace and limit length to prevent abuse
  const trimmed = rawIP.trim();
  if (trimmed.length > 45) { // Max IPv6 length is 45 chars
    return null;
  }
  
  // Basic IPv4/IPv6 validation (simple check)
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Pattern.test(trimmed) || ipv6Pattern.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

export async function POST(request) {
  try {
    // Rate limiting by IP - extract and normalize
    const headerIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     '';
    const headerNormalized = normalizeIP(headerIP);
    const fallbackNormalized = normalizeIP(request.ip);
    const ip = headerNormalized || fallbackNormalized;
    
    // Skip rate limiting if IP cannot be determined
    if (ip && !checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Origin/referer check to prevent cross-origin abuse
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // Enforce same-origin policy when origin or referer is present
    if ((origin || referer) && host) {
      const source = origin || referer;
      try {
        const url = new URL(source);
        if (url.host !== host) {
          console.warn('Analytics request from unexpected origin:', source, 'expected host:', host);
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch (e) {
        // Malformed origin/referer: treat as suspicious and block
        console.warn('Analytics request with invalid origin/referer:', source, 'error:', e.message);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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

    // Send event to Google Analytics
    await sendAnalyticsEvent({
      eventName,
      pageLocation,
      pageTitle,
      referrer,
      clientId,
      sessionId,
      customParams,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
