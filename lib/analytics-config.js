/**
 * Server-side analytics configuration utility
 * This function can be safely called from both server and client components
 * since it only uses public environment variables
 */

/**
 * Check if analytics is enabled based on the NEXT_PUBLIC_ANALYTICS_ENABLED environment variable.
 * Accepts common truthy values: 'true', '1', 'yes', 'y', 'on', 'enable', 'enabled' (case-insensitive).
 * @returns {boolean} True if analytics is enabled, false otherwise
 */
export function isAnalyticsEnabled() {
  const rawValue = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

  if (rawValue === undefined || rawValue === null) {
    return false;
  }

  const normalized = String(rawValue).trim().toLowerCase();

  if (normalized === '') {
    return false;
  }

  const truthyValues = ['true', '1', 'yes', 'y', 'on', 'enable', 'enabled'];

  return truthyValues.includes(normalized);
}
