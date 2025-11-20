/**
 * Object Utilities
 */

export function filterObject<T extends object>(
  obj: T,
  predicate: (value: any, key: string) => boolean
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(value, key))
  ) as Partial<T>;
}

export function mapObject<T extends object, R>(
  obj: T,
  mapper: (value: any, key: string) => R
): Record<string, R> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, mapper(value, key)])
  );
}

