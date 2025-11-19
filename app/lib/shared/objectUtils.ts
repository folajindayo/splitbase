/**
 * Object Utility Functions
 * Comprehensive object manipulation
 */

// Deep clone object
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Deep merge objects
export function merge<T extends object>(...objects: Partial<T>[]): T {
  return objects.reduce((result, obj) => {
    Object.keys(obj).forEach((key) => {
      const value = obj[key as keyof typeof obj];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key as keyof T] = merge(
          result[key as keyof T] || ({} as any),
          value
        );
      } else {
        result[key as keyof T] = value as any;
      }
    });
    return result;
  }, {} as T);
}

// Get nested value by path
export function get<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T {
  const keys = Array.isArray(path) ? path : path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result == null) return defaultValue as T;
    result = result[key];
  }

  return result ?? defaultValue;
}

// Set nested value by path
export function set<T extends object>(
  obj: T,
  path: string | string[],
  value: any
): T {
  const keys = Array.isArray(path) ? path : path.split(".");
  const result = clone(obj);
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

// Delete nested value by path
export function unset<T extends object>(obj: T, path: string | string[]): T {
  const keys = Array.isArray(path) ? path : path.split(".");
  const result = clone(obj);
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) return result;
    current = current[keys[i]];
  }

  delete current[keys[keys.length - 1]];
  return result;
}

// Check if path exists
export function has(obj: any, path: string | string[]): boolean {
  const keys = Array.isArray(path) ? path : path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current == null || !(key in current)) return false;
    current = current[key];
  }

  return true;
}

// Pick keys from object
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

// Omit keys from object
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}

// Get object keys
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

// Get object values
export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

// Get object entries
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

// From entries
export function fromEntries<K extends string | number | symbol, V>(
  entries: [K, V][]
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

// Map object values
export function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => R
): Record<keyof T, R> {
  return fromEntries(
    entries(obj).map(([key, value]) => [key, fn(value, key)])
  ) as Record<keyof T, R>;
}

// Map object keys
export function mapKeys<T extends object, K extends string | number | symbol>(
  obj: T,
  fn: (key: keyof T, value: T[keyof T]) => K
): Record<K, T[keyof T]> {
  return fromEntries(
    entries(obj).map(([key, value]) => [fn(key, value), value])
  ) as Record<K, T[keyof T]>;
}

// Filter object
export function filter<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  return fromEntries(
    entries(obj).filter(([key, value]) => predicate(value, key))
  ) as Partial<T>;
}

// Invert object
export function invert<T extends Record<string, string>>(
  obj: T
): Record<string, string> {
  return fromEntries(entries(obj).map(([key, value]) => [value, key]));
}

// Flatten object
export function flatten(
  obj: any,
  prefix = "",
  result: Record<string, any> = {}
): Record<string, any> {
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

// Unflatten object
export function unflatten(obj: Record<string, any>): any {
  const result: any = {};

  for (const key in obj) {
    set(result, key, obj[key]);
  }

  return result;
}

// Check if object is empty
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

// Check if objects are equal (deep)
export function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => isEqual(obj1[key], obj2[key]));
}

// Find key by value
export function findKey<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): keyof T | undefined {
  for (const key in obj) {
    if (predicate(obj[key], key)) return key;
  }
  return undefined;
}

// Defaults (assign default values for undefined)
export function defaults<T extends object>(...objects: Partial<T>[]): T {
  return objects.reduce((result, obj) => {
    Object.keys(obj).forEach((key) => {
      if (result[key as keyof T] === undefined) {
        result[key as keyof T] = obj[key as keyof T] as any;
      }
    });
    return result;
  }, {} as T);
}

// Transform object
export function transform<T extends object, R>(
  obj: T,
  transformer: (result: R, value: T[keyof T], key: keyof T) => void,
  accumulator: R
): R {
  const result = accumulator;
  entries(obj).forEach(([key, value]) => transformer(result, value, key));
  return result;
}

// Compact object (remove null/undefined)
export function compact<T extends object>(obj: T): Partial<T> {
  return filter(obj, (value) => value != null);
}

// Assign (shallow merge)
export function assign<T extends object>(...objects: Partial<T>[]): T {
  return Object.assign({}, ...objects) as T;
}

// Size of object
export function size(obj: object): number {
  return Object.keys(obj).length;
}

// Convert to array of values
export function toArray<T extends object>(obj: T): T[keyof T][] {
  return values(obj);
}

// Convert to map
export function toMap<T extends object>(obj: T): Map<keyof T, T[keyof T]> {
  return new Map(entries(obj));
}

// From map
export function fromMap<K extends string | number | symbol, V>(
  map: Map<K, V>
): Record<K, V> {
  return fromEntries(Array.from(map.entries()));
}

// Sort object keys
export function sortKeys<T extends object>(obj: T): T {
  const sorted = {} as T;
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key as keyof T] = obj[key as keyof T];
    });
  return sorted;
}

// Group by property
export function groupBy<T>(
  arr: T[],
  keyFn: (item: T) => string | number
): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const key = String(keyFn(item));
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Index by property
export function indexBy<T>(
  arr: T[],
  keyFn: (item: T) => string | number
): Record<string, T> {
  return arr.reduce((index, item) => {
    const key = String(keyFn(item));
    index[key] = item;
    return index;
  }, {} as Record<string, T>);
}


