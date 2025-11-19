/**
 * URL utility functions
 */

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

export function addQueryParams(url: string, params: Record<string, any>): string {
  const urlObj = new URL(url, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      urlObj.searchParams.set(key, String(value));
    }
  });
  
  return urlObj.toString();
}

export function removeQueryParams(url: string, params: string[]): string {
  const urlObj = new URL(url, window.location.origin);
  
  params.forEach((param) => {
    urlObj.searchParams.delete(param);
  });
  
  return urlObj.toString();
}

export function getQueryParam(url: string, param: string): string | null {
  const urlObj = new URL(url, window.location.origin);
  return urlObj.searchParams.get(param);
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

export function getPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return "";
  }
}

export function joinPaths(...paths: string[]): string {
  return paths
    .map((path) => path.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function isRelativeUrl(url: string): boolean {
  return !isAbsoluteUrl(url);
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hash = "";
    return urlObj.toString().replace(/\/+$/, "");
  } catch {
    return url;
  }
}
