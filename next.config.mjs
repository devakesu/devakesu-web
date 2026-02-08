/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP is now handled by middleware.js for proper nonce support
        ],
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
      // Image asset caching rules
      // Reduced from immutable because public/ assets are not content-hashed
      // and browsers need to pick up updates without long cache times
      ...['svg', 'jpg', 'jpeg', 'png', 'webp', 'avif', 'ico'].map((ext) => ({
        source: `/:path*\\.${ext}`,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      })),
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'grainy-gradients.vercel.app',
      },
    ],
  },
};

export default nextConfig;
