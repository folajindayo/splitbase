/**
 * Array Utility Functions
 * Comprehensive array manipulation
 */

// Remove duplicates
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Remove duplicates by key
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// Flatten array
export function flatten<T>(arr: any[]): T[] {
  return arr.reduce(
    (acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val),
    []
  );
}

// Chunk array into smaller arrays
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Shuffle array
export function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Random element from array
export function sample<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random N elements from array
export function sampleSize<T>(arr: T[], n: number): T[] {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// Group by key
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Count occurrences
export function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce((counts, item) => {
    const value = String(item[key]);
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

// Sort by key
export function sortBy<T>(arr: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return order === "asc" ? comparison : -comparison;
  });
}

// Find index by predicate
export function findIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  return arr.findIndex(predicate);
}

// Find last index by predicate
export function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

// Partition array by predicate
export function partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  arr.forEach((item) => (predicate(item) ? pass : fail).push(item));
  return [pass, fail];
}

// Difference between arrays
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

// Intersection of arrays
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return unique(arr1.filter((item) => set2.has(item)));
}

// Union of arrays
export function union<T>(...arrays: T[][]): T[] {
  return unique(flatten(arrays));
}

// Remove falsy values
export function compact<T>(arr: (T | null | undefined | false | 0 | "")[]): T[] {
  return arr.filter(Boolean) as T[];
}

// Zip arrays together
export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  return Array.from({ length: maxLength }, (_, i) =>
    arrays.map((arr) => arr[i])
  );
}

// Unzip arrays
export function unzip<T>(arr: T[][]): T[][] {
  return zip(...arr);
}

// Take first N elements
export function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

// Take last N elements
export function takeLast<T>(arr: T[], n: number): T[] {
  return arr.slice(-n);
}

// Drop first N elements
export function drop<T>(arr: T[], n: number): T[] {
  return arr.slice(n);
}

// Drop last N elements
export function dropLast<T>(arr: T[], n: number): T[] {
  return arr.slice(0, -n);
}

// Range array
export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

// Fill array with value
export function fill<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

// Sum of array
export function sum(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0);
}

// Average of array
export function average(arr: number[]): number {
  return arr.length ? sum(arr) / arr.length : 0;
}

// Min value
export function min(arr: number[]): number {
  return Math.min(...arr);
}

// Max value
export function max(arr: number[]): number {
  return Math.max(...arr);
}

// Min by key
export function minBy<T>(arr: T[], key: keyof T): T | undefined {
  return arr.reduce((min, item) =>
    !min || item[key] < min[key] ? item : min
  , undefined as T | undefined);
}

// Max by key
export function maxBy<T>(arr: T[], key: keyof T): T | undefined {
  return arr.reduce((max, item) =>
    !max || item[key] > max[key] ? item : max
  , undefined as T | undefined);
}

// First element
export function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Last element
export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

// Check if array is empty
export function isEmpty<T>(arr: T[]): boolean {
  return arr.length === 0;
}

// Check if arrays are equal
export function isEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => item === arr2[index]);
}

// Move element
export function move<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

// Insert at index
export function insertAt<T>(arr: T[], index: number, ...items: T[]): T[] {
  const result = [...arr];
  result.splice(index, 0, ...items);
  return result;
}

// Remove at index
export function removeAt<T>(arr: T[], index: number): T[] {
  const result = [...arr];
  result.splice(index, 1);
  return result;
}

// Update at index
export function updateAt<T>(arr: T[], index: number, value: T): T[] {
  const result = [...arr];
  result[index] = value;
  return result;
}

// Paginate array
export function paginate<T>(arr: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return arr.slice(start, start + pageSize);
}

// Get pagination info
export function getPaginationInfo<T>(arr: T[], page: number, pageSize: number) {
  const totalItems = arr.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
    hasNext,
    hasPrev,
    items: paginate(arr, page, pageSize),
  };
}

// Binary search
export function binarySearch<T>(arr: T[], target: T): number {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return -1;
}

// Rotate array
export function rotate<T>(arr: T[], n: number): T[] {
  const len = arr.length;
  const shift = ((n % len) + len) % len;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}


