/**
 * Sort utilities
 * Helper functions for sorting data
 */

type SortOrder = "asc" | "desc";

/**
 * Sort array by field
 */
export function sortBy<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  order: SortOrder = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return order === "asc" ? 1 : -1;
    if (bVal == null) return order === "asc" ? -1 : 1;

    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;

    return 0;
  });
}

/**
 * Sort by multiple fields
 */
export function sortByMultiple<T extends Record<string, any>>(
  items: T[],
  sorts: Array<{ field: keyof T; order: SortOrder }>
): T[] {
  return [...items].sort((a, b) => {
    for (const { field, order } of sorts) {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal !== bVal) {
        if (aVal == null) return order === "asc" ? 1 : -1;
        if (bVal == null) return order === "asc" ? -1 : 1;

        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
      }
    }

    return 0;
  });
}

/**
 * Sort by date
 */
export function sortByDate<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  order: SortOrder = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const aDate = new Date(a[dateField]).getTime();
    const bDate = new Date(b[dateField]).getTime();

    return order === "asc" ? aDate - bDate : bDate - aDate;
  });
}

/**
 * Sort by custom comparator
 */
export function sortByComparator<T>(
  items: T[],
  comparator: (a: T, b: T) => number
): T[] {
  return [...items].sort(comparator);
}

/**
 * Natural sort (handles numbers in strings)
 */
export function naturalSort<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  order: SortOrder = "asc"
): T[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  return [...items].sort((a, b) => {
    const result = collator.compare(String(a[field]), String(b[field]));
    return order === "asc" ? result : -result;
  });
}

