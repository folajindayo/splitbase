/**
 * Mobile Utilities
 * Utilities for responsive design and mobile detection
 */

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile user agents
  return (
    /android/i.test(userAgent) ||
    /iPad|iPhone|iPod/.test(userAgent) ||
    /webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  );
}

/**
 * Detect if user is on tablet
 */
export function isTablet(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isTabletUA = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
  
  return isTabletUA;
}

/**
 * Detect if device has touch support
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get device type
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (isMobileDevice() && !isTablet()) return "mobile";
  if (isTablet()) return "tablet";
  return "desktop";
}

/**
 * Get screen size category
 */
export function getScreenSize(): "xs" | "sm" | "md" | "lg" | "xl" | "2xl" {
  if (typeof window === "undefined") return "lg";
  
  const width = window.innerWidth;
  
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  if (width < 1536) return "xl";
  return "2xl";
}

/**
 * Check if screen is mobile size
 */
export function isMobileScreen(): boolean {
  const size = getScreenSize();
  return size === "xs" || size === "sm";
}

/**
 * Get viewport dimensions
 */
export function getViewport(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is in portrait mode
 */
export function isPortrait(): boolean {
  return !isLandscape();
}

/**
 * Get safe area insets (for devices with notches)
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === "undefined" || typeof getComputedStyle === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue("--safe-area-inset-top") || "0"),
    right: parseInt(style.getPropertyValue("--safe-area-inset-right") || "0"),
    bottom: parseInt(style.getPropertyValue("--safe-area-inset-bottom") || "0"),
    left: parseInt(style.getPropertyValue("--safe-area-inset-left") || "0"),
  };
}

/**
 * Detect iOS version
 */
export function getIOSVersion(): number | null {
  if (typeof window === "undefined") return null;
  
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Detect Android version
 */
export function getAndroidVersion(): number | null {
  if (typeof window === "undefined") return null;
  
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/Android (\d+)\.(\d+)/);
  
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Check if app is running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[]): boolean {
  if (typeof window === "undefined" || !navigator.vibrate) {
    return false;
  }
  
  return navigator.vibrate(pattern);
}

/**
 * Lock screen orientation (if supported)
 */
export async function lockOrientation(
  orientation: "portrait" | "landscape"
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  try {
    const screen = (window.screen as any);
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock(orientation);
      return true;
    }
  } catch (err) {
    console.warn("Screen orientation lock failed:", err);
  }
  
  return false;
}

/**
 * Unlock screen orientation
 */
export function unlockOrientation(): void {
  if (typeof window === "undefined") return;
  
  try {
    const screen = (window.screen as any);
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (err) {
    console.warn("Screen orientation unlock failed:", err);
  }
}

/**
 * Get device pixel ratio
 */
export function getPixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Check if device is high DPI
 */
export function isHighDPI(): boolean {
  return getPixelRatio() > 1;
}

/**
 * Detect if keyboard is visible (mobile)
 */
export function isKeyboardVisible(): boolean {
  if (typeof window === "undefined") return false;
  
  const heightRatio = window.innerHeight / window.screen.height;
  return heightRatio < 0.75;
}

/**
 * Get network information
 */
export function getNetworkInfo(): {
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
} | null {
  if (typeof navigator === "undefined") return null;
  
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  if (!connection) return null;
  
  return {
    type: connection.type || "unknown",
    effectiveType: connection.effectiveType || "unknown",
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
  };
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const network = getNetworkInfo();
  if (!network) return false;
  
  return (
    network.effectiveType === "slow-2g" ||
    network.effectiveType === "2g" ||
    network.downlink < 1
  );
}

/**
 * Responsive breakpoints (Tailwind defaults)
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Check if current width matches breakpoint
 */
export function matchesBreakpoint(
  breakpoint: keyof typeof breakpoints
): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= breakpoints[breakpoint];
}

/**
 * Mobile-optimized copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  
  try {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older mobile browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    return success;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
}

/**
 * Prevent pull-to-refresh on mobile
 */
export function preventPullToRefresh(): () => void {
  if (typeof document === "undefined") return () => {};
  
  const preventDefault = (e: TouchEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    e.preventDefault();
  };
  
  document.addEventListener("touchmove", preventDefault, { passive: false });
  
  return () => {
    document.removeEventListener("touchmove", preventDefault);
  };
}

