/**
 * Data prefetching utilities
 */

type PrefetchFn<T> = () => Promise<T>;

const prefetchCache = new Map<string, { data: any; timestamp: number }>();

export async function prefetch<T>(
  key: string,
  fn: PrefetchFn<T>,
  ttl: number = 300000
): Promise<T> {
  const cached = prefetchCache.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fn();
  prefetchCache.set(key, { data, timestamp: Date.now() });

  return data;
}

export function clearPrefetchCache(key?: string): void {
  if (key) {
    prefetchCache.delete(key);
  } else {
    prefetchCache.clear();
  }
}

export function getCachedPrefetch<T>(key: string): T | null {
  const cached = prefetchCache.get(key);
  return cached ? cached.data : null;
}

export function prefetchOnHover(
  element: HTMLElement,
  key: string,
  fn: PrefetchFn<any>
): () => void {
  let prefetched = false;

  const handleMouseEnter = () => {
    if (!prefetched) {
      prefetch(key, fn);
      prefetched = true;
    }
  };

  element.addEventListener("mouseenter", handleMouseEnter, { once: true });

  return () => {
    element.removeEventListener("mouseenter", handleMouseEnter);
  };
}

export function prefetchOnVisible(
  element: HTMLElement,
  key: string,
  fn: PrefetchFn<any>,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        prefetch(key, fn);
        observer.disconnect();
      }
    });
  }, options);

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}

