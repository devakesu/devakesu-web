import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy & Legal',
  description:
    'Privacy Policy, Terms of Use, and Cookie Notice for devakesu.com — the personal portfolio of Devanarayanan (Kesu).',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://devakesu.com/legal',
  },
  openGraph: {
    type: 'website',
    url: 'https://devakesu.com/legal',
    title: 'Privacy & Legal | @devakesu',
    description:
      'Privacy Policy, Terms of Use, and Cookie Notice for devakesu.com.',
    siteName: 'devakesu',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy & Legal | @devakesu',
    description:
      'Privacy Policy, Terms of Use, and Cookie Notice for devakesu.com.',
    creator: '@devakesu',
    site: '@devakesu',
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
