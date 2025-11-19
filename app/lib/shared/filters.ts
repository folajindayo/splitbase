/**
 * Filter utilities
 * Helper functions for filtering and searching data
 */

/**
 * Filter array by search query
 */
export function filterBySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (value == null) return false;

      return String(value).toLowerCase().includes(lowerQuery);
    })
  );
}

/**
 * Filter array by multiple criteria
 */
export function filterByMultiple<T extends Record<string, any>>(
  items: T[],
  filters: Partial<Record<keyof T, any>>
): T[] {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === "") return true;

      if (Array.isArray(value)) {
        return value.includes(item[key as keyof T]);
      }

      return item[key as keyof T] === value;
    })
  );
}

/**
 * Filter array by date range
 */
export function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  startDate?: Date,
  endDate?: Date
): T[] {
  return items.filter((item) => {
    const itemDate = new Date(item[dateField]);

    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    return true;
  });
}

/**
 * Filter array by numeric range
 */
export function filterByRange<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  min?: number,
  max?: number
): T[] {
  return items.filter((item) => {
    const value = Number(item[field]);

    if (isNaN(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;

    return true;
  });
}

/**
 * Filter unique items by field
 */
export function filterUnique<T extends Record<string, any>>(
  items: T[],
  field: keyof T
): T[] {
  const seen = new Set();

  return items.filter((item) => {
    const value = item[field];
    if (seen.has(value)) return false;

    seen.add(value);
    return true;
  });
}

/**
 * Fuzzy search filter
 */
export function fuzzyFilter<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase().replace(/\s+/g, "");

  return items.filter((item) =>
    searchFields.some((field) => {
      const value = String(item[field] || "")
        .toLowerCase()
        .replace(/\s+/g, "");

      let queryIndex = 0;
      for (let i = 0; i < value.length && queryIndex < lowerQuery.length; i++) {
        if (value[i] === lowerQuery[queryIndex]) {
          queryIndex++;
        }
      }

      return queryIndex === lowerQuery.length;
    })
  );
}

