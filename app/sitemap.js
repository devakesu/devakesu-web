// Use a stable lastModified date to avoid implying constant updates
const HOMEPAGE_LAST_MODIFIED = new Date('2024-01-01T00:00:00Z');

export default function sitemap() {
  return [
    {
      url: 'https://devakesu.com',
      lastModified: HOMEPAGE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
