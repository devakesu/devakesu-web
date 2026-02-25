import type { MetadataRoute } from 'next';

// Use a stable lastModified date to avoid implying constant updates
const HOMEPAGE_LAST_MODIFIED = new Date('2026-02-25T00:00:00Z');
const LEGAL_LAST_MODIFIED = new Date('2026-02-10T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://devakesu.com',
      lastModified: HOMEPAGE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://devakesu.com/legal',
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
