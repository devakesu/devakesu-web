// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Generate a random nonce for each request with proper entropy (192 bits)
  const nonceArray = new Uint8Array(24);
  crypto.getRandomValues(nonceArray);
  const nonce = btoa(Array.from(nonceArray, b => String.fromCharCode(b)).join(''));
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Build CSP with nonce - add WebSocket support for development
  const wsPolicy = process.env.NODE_ENV !== 'production' ? ' ws: wss:' : '';
  const connectSrc = `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com${wsPolicy}`;
  
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    connectSrc,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  // Set CSP header on response
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/ (API routes)
     * - _next/static/ (static files from Next.js)
     * - _next/image/ (image optimization files)
     * - favicon files (favicon.ico, favicon.svg, etc.)
     * - js/ (static JavaScript files in /public/js/)
     * - Static assets ending with: .svg, .jpg, .jpeg, .png, .gif, .webp
     * 
     * This excludes static assets from middleware processing to reduce overhead.
     * Note: In Next.js, only static files from /public have file extensions in URLs.
     * Page routes and API routes are pathname-based and don't use file extensions.
     */
    {
      source: '/((?!api/|_next/static/|_next/image/|favicon\\.|js/|.*\\.(?:svg|jpg|jpeg|png|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
