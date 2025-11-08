interface CacheEntry<T> {
  data: T;
  expiry: number;
  tags?: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  compress?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  keys: number;
  hitRate: number;
}

class CacheSystem {
  private static instance: CacheSystem;
  private cache: Map<string, CacheEntry<any>>;
  private stats: { hits: number; misses: number };
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.maxSize = 1000; // Maximum number of cache entries
    this.defaultTTL = 300000; // 5 minutes default
    this.startCleanup();
  }

  static getInstance(): CacheSystem {
    if (!CacheSystem.instance) {
      CacheSystem.instance = new CacheSystem();
    }
    return CacheSystem.instance;
  }

  // Set a cache entry
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    // Check if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const ttl = options.ttl || this.defaultTTL;
    const expiry = Date.now() + ttl;

    const entry: CacheEntry<T> = {
      data: options.compress ? this.compress(data) : data,
      expiry,
      tags: options.tags,
    };

    this.cache.set(key, entry);
  }

  // Get a cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  // Get or set (fetch if not in cache)
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete a cache entry
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Delete multiple entries
  deleteMany(keys: string[]): number {
    let count = 0;
    keys.forEach(key => {
      if (this.cache.delete(key)) {
        count++;
      }
    });
    return count;
  }

  // Delete entries by tag
  deleteByTag(tag: string): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  // Clear expired entries
  clearExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get keys by tag
  getKeysByTag(tag: string): string[] {
    const keys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        keys.push(key);
      }
    }

    return keys;
  }

  // Get cache statistics
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    // Calculate total size in bytes (approximate)
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: totalSize,
      keys: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Set maximum cache size
  setMaxSize(size: number): void {
    this.maxSize = size;
    
    // Evict entries if over limit
    while (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  // Set default TTL
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  // Evict oldest entry
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < oldestExpiry) {
        oldestExpiry = entry.expiry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Start automatic cleanup
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, 60000);
  }

  // Stop automatic cleanup
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Compress data (simple JSON stringify)
  private compress<T>(data: T): string {
    return JSON.stringify(data);
  }

  // Decompress data
  private decompress<T>(data: string): T {
    return JSON.parse(data);
  }

  // Memoize a function
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    options: CacheOptions & { keyGenerator?: (...args: Parameters<T>) => string } = {}
  ): T {
    const keyGenerator = options.keyGenerator || ((...args: any[]) => JSON.stringify(args));

    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = `memoized:${fn.name}:${keyGenerator(...args)}`;
      const cached = this.get<ReturnType<T>>(key);

      if (cached !== null) {
        return cached;
      }

      const result = fn(...args);

      // Handle promises
      if (result instanceof Promise) {
        return result.then(value => {
          this.set(key, value, options);
          return value;
        }) as ReturnType<T>;
      }

      this.set(key, result, options);
      return result;
    }) as T;
  }

  // Refresh a cache entry (extend TTL)
  refresh(key: string, additionalTTL?: number): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const ttl = additionalTTL || this.defaultTTL;
    entry.expiry = Date.now() + ttl;
    this.cache.set(key, entry);

    return true;
  }

  // Get TTL for a key
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const ttl = entry.expiry - Date.now();
    return ttl > 0 ? ttl : null;
  }

  // Export cache to JSON
  export(): string {
    const data: Record<string, any> = {};

    for (const [key, entry] of this.cache.entries()) {
      data[key] = {
        data: entry.data,
        expiry: entry.expiry,
        tags: entry.tags,
      };
    }

    return JSON.stringify(data);
  }

  // Import cache from JSON
  import(json: string): void {
    try {
      const data = JSON.parse(json);

      for (const [key, value] of Object.entries(data)) {
        this.cache.set(key, value as CacheEntry<any>);
      }
    } catch (error) {
      console.error('Failed to import cache:', error);
    }
  }

  // Warm up cache with multiple entries
  warmUp<T>(entries: Array<{ key: string; data: T; options?: CacheOptions }>): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  // Get cache entry details
  getEntry(key: string): { data: any; expiry: number; ttl: number; tags?: string[] } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const ttl = entry.expiry - Date.now();

    if (ttl <= 0) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      expiry: entry.expiry,
      ttl,
      tags: entry.tags,
    };
  }
}

// Export singleton instance
export const cache = CacheSystem.getInstance();

// Namespace-specific cache instances
export class NamespacedCache {
  constructor(private namespace: string, private cacheInstance: CacheSystem = cache) {}

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  set<T>(key: string, data: T, options?: CacheOptions): void {
    this.cacheInstance.set(this.getKey(key), data, options);
  }

  get<T>(key: string): T | null {
    return this.cacheInstance.get<T>(this.getKey(key));
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return this.cacheInstance.getOrSet(this.getKey(key), fetcher, options);
  }

  has(key: string): boolean {
    return this.cacheInstance.has(this.getKey(key));
  }

  delete(key: string): boolean {
    return this.cacheInstance.delete(this.getKey(key));
  }

  clear(): void {
    const keys = this.cacheInstance.keys().filter(k => k.startsWith(`${this.namespace}:`));
    this.cacheInstance.deleteMany(keys);
  }

  keys(): string[] {
    return this.cacheInstance
      .keys()
      .filter(k => k.startsWith(`${this.namespace}:`))
      .map(k => k.replace(`${this.namespace}:`, ''));
  }
}

// Convenience functions
export const createNamespacedCache = (namespace: string) => new NamespacedCache(namespace);

// Pre-defined namespaced caches
export const userCache = new NamespacedCache('user');
export const escrowCache = new NamespacedCache('escrow');
export const transactionCache = new NamespacedCache('transaction');
export const sessionCache = new NamespacedCache('session');

// Decorator for caching method results
export function Cached(options: CacheOptions & { keyPrefix?: string } = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const keyPrefix = options.keyPrefix || `${target.constructor.name}:${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      const cached = cache.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = originalMethod.apply(this, args);

      // Handle promises
      if (result instanceof Promise) {
        return result.then(value => {
          cache.set(key, value, options);
          return value;
        });
      }

      cache.set(key, result, options);
      return result;
    };

    return descriptor;
  };
}

// Cache strategies
export class CacheStrategy {
  // Cache-aside (lazy loading)
  static async cacheAside<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return cache.getOrSet(key, fetcher, options);
  }

  // Write-through (write to cache and database)
  static async writeThrough<T>(
    key: string,
    data: T,
    writer: (data: T) => Promise<void>,
    options?: CacheOptions
  ): Promise<void> {
    await writer(data);
    cache.set(key, data, options);
  }

  // Write-behind (write to cache immediately, database later)
  static async writeBehind<T>(
    key: string,
    data: T,
    writer: (data: T) => Promise<void>,
    options?: CacheOptions
  ): Promise<void> {
    cache.set(key, data, options);
    // Write to database in background
    writer(data).catch(error => {
      console.error('Write-behind failed:', error);
      cache.delete(key);
    });
  }

  // Read-through (fetch from database if not in cache)
  static async readThrough<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return cache.getOrSet(key, fetcher, options);
  }

  // Refresh-ahead (proactively refresh before expiry)
  static async refreshAhead<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions & { refreshThreshold?: number }
  ): Promise<T> {
    const entry = cache.getEntry(key);
    const threshold = options?.refreshThreshold || 60000; // 1 minute

    if (entry && entry.ttl < threshold) {
      // Refresh in background
      fetcher().then(data => {
        cache.set(key, data, options);
      });
    }

    return cache.getOrSet(key, fetcher, options);
  }
}

// Example usage
export const exampleUsage = () => {
  // Basic usage
  cache.set('user:123', { name: 'John', email: 'john@example.com' }, { ttl: 60000 });
  const user = cache.get('user:123');

  // With tags
  cache.set('products:123', { name: 'Product' }, { tags: ['products', 'inventory'] });
  cache.deleteByTag('products'); // Delete all products

  // Memoization
  const expensiveFunction = cache.memoize(
    (a: number, b: number) => {
      console.log('Computing...');
      return a + b;
    },
    { ttl: 30000 }
  );

  // Namespaced cache
  userCache.set('123', { name: 'John' });
  const cachedUser = userCache.get('123');

  // Cache strategies
  CacheStrategy.cacheAside('data:123', async () => {
    // Fetch from database
    return { data: 'value' };
  });
};

