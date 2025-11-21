/**
 * Route Helper
 */

export const ROUTES = {
  HOME: '/',
  CREATE_SPLIT: '/create',
  MY_SPLITS: '/splits',
  SPLIT_DETAILS: (id: string) => `/splits/${id}`,
  SETTINGS: '/settings',
} as const;

export function navigateTo(path: string) {
  if (typeof window === 'undefined') return;
  window.location.href = path;
}

export function buildQueryString(params: Record<string, string | number>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    query.append(key, String(value));
  });
  
  return query.toString();
}

