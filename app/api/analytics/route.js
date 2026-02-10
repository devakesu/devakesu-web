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
        const excess = rateLimitMap.size - MAX_MAP_SIZE;
        
        // Collect all entries and find the oldest `excess` entries to evict
        const entriesArray = Array.from(rateLimitMap.entries());
        
        // Partial sort to find the oldest N entries (QuickSelect algorithm)
        // Uses nth_element approach to partition around the Nth smallest resetTime
        
        /**
         * Partitions array segment around a pivot element by resetTime
         * @param {Array} arr - Array of [key, {count, resetTime}] entries
         * @param {number} left - Left boundary index (inclusive)
         * @param {number} right - Right boundary index (inclusive)
         * @param {number} pivotIndex - Index of pivot element
         * @returns {number} Final position of pivot after partitioning
         */
        function partitionByResetTime(arr, left, right, pivotIndex) {
          const pivotValue = arr[pivotIndex][1].resetTime;
          
          // Move pivot to end
          [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];
          
          let storeIndex = left;
          for (let i = left; i < right; i++) {
            if (arr[i][1].resetTime < pivotValue) {
              [arr[storeIndex], arr[i]] = [arr[i], arr[storeIndex]];
              storeIndex++;
            }
          }
          
          // Move pivot to final position
          [arr[storeIndex], arr[right]] = [arr[right], arr[storeIndex]];
          return storeIndex;
        }
        
        /**
         * QuickSelect: Partitions arr around index k so that elements at indices
         * 0..k-1 have resetTime less than or equal to arr[k].resetTime, and elements
         * at k+1..end have resetTime greater than or equal to arr[k].resetTime.
         * Note: Elements with equal resetTime to the pivot may appear on either side.
         * @param {Array} arr - Array of [key, {count, resetTime}] entries
         * @param {number} k - Target index (0-based) to partition around
         */
        function quickSelect(arr, k) {
          let left = 0;
          let right = arr.length - 1;
          
          while (left < right) {
            // Median-of-three pivot selection for better performance
            const mid = left + Math.floor((right - left) / 2);
            
            // Find median of three values using direct comparisons
            const leftTime = arr[left][1].resetTime;
            const midTime = arr[mid][1].resetTime;
            const rightTime = arr[right][1].resetTime;
            
            let pivotIndex;
            if ((leftTime <= midTime && midTime <= rightTime) || 
                (rightTime <= midTime && midTime <= leftTime)) {
              pivotIndex = mid;
            } else if ((midTime <= leftTime && leftTime <= rightTime) || 
                       (rightTime <= leftTime && leftTime <= midTime)) {
              pivotIndex = left;
            } else {
              pivotIndex = right;
            }
            
            const newPivot = partitionByResetTime(arr, left, right, pivotIndex);
            
            if (k === newPivot) {
              return;
            } else if (k < newPivot) {
              right = newPivot - 1;
            } else {
              left = newPivot + 1;
            }
          }
        }
        
        // Partition array to find the element at index (excess - 1)
        // After partitioning, elements at indices 0..excess-1 are the oldest
        // Use QuickSelect to find and evict the oldest 'excess' entries
        quickSelect(entriesArray, excess - 1);
        
        // All entries at indices 0..excess-1 now have oldest resetTime values
        // Delete them from the map
        for (let i = 0; i < excess; i++) {
          rateLimitMap.delete(entriesArray[i][0]);
        }
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
    // Rate limiting by IP - extract and normalize
    const headerIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     '';
    const headerNormalized = normalizeIP(headerIP);
    const fallbackNormalized = normalizeIP(request.ip);
    const ip = headerNormalized || fallbackNormalized;
    
    // Use shared bucket with stricter limit if IP cannot be determined
    const rateLimitKey = ip || UNKNOWN_IP_KEY;
    const isUnknown = !ip;
    
    if (!checkRateLimit(rateLimitKey, isUnknown)) {
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
