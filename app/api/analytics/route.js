import { NextResponse } from 'next/server';
import { sendAnalyticsEvent, getClientId, getSessionId } from '@/lib/analytics';

// Simple in-memory rate limiter
// Maps IP -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export async function POST(request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Basic origin/referer check to reduce abuse
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Allow requests from same origin or with valid referer
    if (origin || referer) {
      // If origin is present, it should match the host
      if (origin && !origin.includes(request.headers.get('host'))) {
        // Allow for now, but log suspicious activity
        console.warn('Analytics request from unexpected origin:', origin);
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
