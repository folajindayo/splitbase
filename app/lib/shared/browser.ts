/**
 * Browser utilities
 * Functions for browser detection and feature checking
 */

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Check if code is running on server
 */
export const isServer = !isBrowser;

/**
 * Get user agent
 */
export function getUserAgent(): string {
  return isBrowser ? navigator.userAgent : "";
}

/**
 * Detect if user is on mobile device
 */
export function isMobile(): boolean {
  if (!isBrowser) return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  if (!isBrowser) return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  if (!isBrowser) return false;

  return /Android/.test(navigator.userAgent);
}

/**
 * Get browser name
 */
export function getBrowserName(): string {
  if (!isBrowser) return "unknown";

  const ua = navigator.userAgent;

  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Safari")) return "safari";
  if (ua.includes("Edge")) return "edge";
  if (ua.includes("MSIE") || ua.includes("Trident")) return "ie";

  return "unknown";
}

/**
 * Check if feature is supported
 */
export function isFeatureSupported(feature: string): boolean {
  if (!isBrowser) return false;

  switch (feature) {
    case "localStorage":
      return typeof localStorage !== "undefined";
    case "sessionStorage":
      return typeof sessionStorage !== "undefined";
    case "indexedDB":
      return typeof indexedDB !== "undefined";
    case "serviceWorker":
      return "serviceWorker" in navigator;
    case "clipboard":
      return "clipboard" in navigator;
    case "geolocation":
      return "geolocation" in navigator;
    case "webgl":
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Get viewport dimensions
 */
export function getViewport(): { width: number; height: number } {
  if (!isBrowser) return { width: 0, height: 0 };

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Scroll to top of page
 */
export function scrollToTop(smooth: boolean = true): void {
  if (!isBrowser) return;

  window.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
}

/**
 * Scroll to element
 */
export function scrollToElement(
  element: HTMLElement | string,
  options?: ScrollIntoViewOptions
): void {
  if (!isBrowser) return;

  const el =
    typeof element === "string" ? document.querySelector(element) : element;

  if (el) {
    el.scrollIntoView({ behavior: "smooth", ...options });
  }
}

