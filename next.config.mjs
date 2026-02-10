/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',

  async headers() {
    // Define security headers common to all environments
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY', // Upgraded from SAMEORIGIN for better security
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin', // Upgraded from origin-when-cross-origin
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      // CSP is now handled by middleware.js for proper nonce support
    ];

    // Only add HSTS in production to prevent local SSL errors
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/js/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // Reduced from 1 year to 1 hour because JS files are not content-hashed
            // and browsers need to pick up updates without waiting for cache expiration
            value: 'public, max-age=3600',
          },
        ],
      },
      // Cache build metadata: no-store in development for fresh updates on reload,
      // short TTL in production to balance freshness and performance
      {
        source: '/meta.json',
        headers: [
          {
            key: 'Cache-Control',
            value:
              process.env.NODE_ENV === 'production'
                ? 'public, max-age=300, must-revalidate'
                : 'no-store',
          },
        ],
      },
      // Cache fonts for 30 days (font files are not versioned/hashed, shorter cache prevents stale fonts)
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000',
          },
        ],
      },
      // Preserve Next.js's immutable caching for hashed build assets
      // This rule must come before the general image caching rule to take precedence
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image asset caching rules for public/ directory assets
      // Matches root-level and subdirectory image files like /profile.jpg, /file.svg
      // The more specific /_next/static rule above ensures build assets keep immutable caching
      {
        source: '/:path*\\.(svg|jpg|jpeg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [],
  },
};

export default nextConfig;
