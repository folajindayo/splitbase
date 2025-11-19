export interface SearchOptions {
  fields: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export function searchInObjects<T extends Record<string, any>>(
  items: T[],
  query: string,
  options: SearchOptions
): T[] {
  if (!query || query.trim() === "") {
    return items;
  }

  const searchQuery = options.caseSensitive ? query : query.toLowerCase();

  return items.filter((item) => {
    return options.fields.some((field) => {
      const value = item[field];

      if (value === null || value === undefined) {
        return false;
      }

      const stringValue = String(value);
      const searchValue = options.caseSensitive
        ? stringValue
        : stringValue.toLowerCase();

      if (options.exactMatch) {
        return searchValue === searchQuery;
      }

      return searchValue.includes(searchQuery);
    });
  });
}

export function highlightMatches(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

export function fuzzySearch(items: string[], query: string): string[] {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    const lowerItem = item.toLowerCase();
    let queryIndex = 0;

    for (let i = 0; i < lowerItem.length && queryIndex < lowerQuery.length; i++) {
      if (lowerItem[i] === lowerQuery[queryIndex]) {
        queryIndex++;
      }
    }

    return queryIndex === lowerQuery.length;
  });
}

