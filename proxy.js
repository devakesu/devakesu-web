// proxy.js
import { NextResponse } from 'next/server';

export function proxy(request) {
  // Generate a random nonce for each request with proper entropy (192 bits)
  const nonceArray = new Uint8Array(24);
  crypto.getRandomValues(nonceArray);
  const nonce = btoa(Array.from(nonceArray, (b) => String.fromCharCode(b)).join(''));

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
  const devWebSocketProtocols = process.env.NODE_ENV !== 'production' ? ' ws: wss:' : '';
  const connectSrc = `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com${devWebSocketProtocols}`;

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-hashes' 'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk=' https://fonts.googleapis.com`,
    "style-src-attr 'self' 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    connectSrc,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  // Only upgrade insecure requests in production to avoid breaking local dev
  if (process.env.NODE_ENV === 'production') {
    cspDirectives.push('upgrade-insecure-requests');
  }

  const cspHeader = cspDirectives.join('; ');

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
     * - Static assets ending with: .svg, .jpg, .jpeg, .png, .gif, .webp, .ico, .avif, .json
     *
     * This excludes static assets from middleware processing to reduce overhead.
     * Note: In Next.js, only static files from /public have file extensions in URLs.
     * Page routes and API routes are pathname-based and don't use file extensions.
     */
    '/((?!api/|_next/static/|_next/image/|favicon\\.|js/|.*\\.(?:svg|jpg|jpeg|png|gif|webp|ico|avif|json)$).*)',
  ],
};
