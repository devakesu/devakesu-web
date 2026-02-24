import './globals.css';
import Script from 'next/script';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { headers } from 'next/headers';
import { isAnalyticsEnabled } from '@/lib/analytics-config';
import Analytics from '@/components/Analytics';
import ErrorHandler from '@/components/ErrorHandler';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: true,
  fallback: ['monospace'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
};

// Helper function to safely construct URL with validation
function getMetadataBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devakesu.com';
  try {
    return new URL(siteUrl);
  } catch (error) {
    console.warn(
      `Invalid NEXT_PUBLIC_SITE_URL: ${siteUrl}, falling back to default. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return new URL('https://devakesu.com');
  }
}

export const metadata = {
  metadataBase: getMetadataBaseUrl(),

  // Basic Metadata
  title: {
    default: '@devakesu - Devanarayanan',
    template: '%s | @devakesu',
  },
  description: 'Disciplined chaos. Brutalist × cyberpunk portfolio. Where code meets conscience.',

  keywords: [
    // Technical Skills
    'developer',
    'full-stack developer',
    'software engineer',
    'python',
    'typescript',
    'javascript',
    'php',
    'java',
    'kotlin',
    'c',
    'next.js',
    'react',
    'node.js',
    'web development',
    'android development',
    'cloud infrastructure',
    'gcp',
    'aws',

    // Design & Aesthetics
    'brutalist design',
    'cyberpunk',
    'portfolio',
    'ui/ux',
    'human-centered design',
    'ethical design',

    // Core Values & Interests
    'science',
    'justice',
    'social good',
    'ethics-first',
    'open source',
    'systems thinking',
    'empathy',
    'sustainability',
    'environmental protection',
    'lgbtq+',
    'love peace justice',
    'united nations',
    'sdgs',

    // Personal Brand
    'devakesu',
    'devanarayanan',
    'kesu',
    'devakesu.com',

    // Interests
    'technology',
    'nature',
    'research',
    'art',
    'chemistry',
    'construction',
    'astronomy',
    'music',
    'cricket',
    'food',
    'flowers',
    'beauty',
    'love',
    'peace',
    'recycling',
    'inclusivity',
  ],
  authors: [{ name: 'Devanarayanan (Kesu)', url: 'https://devakesu.com' }],
  creator: 'Devanarayanan',
  publisher: 'Devanarayanan',

  // Robots & Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // OpenGraph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://devakesu.com',
    siteName: 'devakesu',
    title: 'devakesu - Devanarayanan',
    description: 'Where code meets conscience. Disciplined chaos meets brutalist design.',
    images: [
      {
        url: '/profile.jpg',
        width: 1200,
        height: 630,
        alt: 'devakesu - Portfolio',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'devakesu - Devanarayanan',
    description: 'Where code meets conscience. Disciplined chaos meets brutalist design.',
    creator: '@devakesu',
    images: ['/profile.jpg'],
  },

  // Additional Meta
  applicationName: 'devakesu Portfolio',
  generator: 'Next.js',
  category: 'technology',
  classification: 'Portfolio',

  // Icons & Manifest
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    // TODO: Create apple-touch-icon.png (180x180) - iOS requires PNG for home screen icons
    // apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },

  // Verification (add when you set these up)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },

  // Other
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Note: Reading headers() makes this layout render dynamically (disables static optimization).
  // This is an intentional tradeoff for security: per-request nonces in CSP provide strong
  // XSS protection. The nonce is required for inline scripts loaded via Next.js Script component.
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="ambient-noise">
        <ErrorHandler />
        {isAnalyticsEnabled() && <Analytics />}
        {children}
        <Script src="/js/cursor.js" strategy="afterInteractive" nonce={nonce} />
        <Script src="/js/parallax.js" strategy="afterInteractive" nonce={nonce} />
        <Script src="/js/reactive-glow.js" strategy="afterInteractive" nonce={nonce} />
      </body>
    </html>
  );
}
