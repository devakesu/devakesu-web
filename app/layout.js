import './globals.css';
import Script from 'next/script';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { headers } from 'next/headers';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
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
    console.warn(`Invalid NEXT_PUBLIC_SITE_URL: ${siteUrl}, falling back to default`);
    return new URL('https://devakesu.com');
  }
}

export const metadata = {
  metadataBase: getMetadataBaseUrl(),

  // Basic Metadata
  title: {
    default: '@devakesu - System Online',
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
    'devakesu',

    // Interests
    'technology',
    'nature',
    'science',
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
    'justice',
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
    title: 'devakesu - System Online',
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
    title: 'devakesu - System Online',
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
    apple: [{ url: '/profile.jpg', sizes: '180x180', type: 'image/jpeg' }],
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

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get('x-nonce');
  
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <head>
      </head>
      <body className="ambient-noise">
        {children}
        <Script src="/js/cursor.js" strategy="lazyOnload" nonce={nonce} />
        <Script src="/js/parallax.js" strategy="lazyOnload" nonce={nonce} />
        <Script src="/js/reactive-glow.js" strategy="lazyOnload" nonce={nonce} />
      </body>
    </html>
  );
}
