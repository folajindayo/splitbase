/**
 * URL Utilities
 * Helper functions for URL manipulation
 */

/**
 * Build URL with query parameters
 */
export function buildUrl(
  base: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return base;

  const url = new URL(base, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url, window.location.origin);

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Get query parameter value
 */
export function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Update query parameters without reload
 */
export function updateQueryParams(
  params: Record<string, string | null>,
  options: { replace?: boolean } = {}
): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  const method = options.replace ? "replaceState" : "pushState";
  window.history[method]({}, "", url.toString());
}

/**
 * Remove query parameters
 */
export function removeQueryParams(...keys: string[]): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  keys.forEach((key) => {
    url.searchParams.delete(key);
  });

  window.history.replaceState({}, "", url.toString());
}

/**
 * Check if URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Join URL parts
 */
export function joinUrls(...parts: string[]): string {
  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.replace(/\/+$/, "");
      }
      return part.replace(/^\/+/, "").replace(/\/+$/, "");
    })
    .filter(Boolean)
    .join("/");
}

