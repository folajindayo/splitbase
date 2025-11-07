/**
 * Number Utility Functions
 * Comprehensive number manipulation
 */

// Format number with thousands separator
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format as currency
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

// Format as percentage
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Format with compact notation (1K, 1M, 1B)
export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// Round to decimals
export function round(num: number, decimals = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Round up
export function roundUp(num: number, decimals = 2): number {
  return Math.ceil(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Round down
export function roundDown(num: number, decimals = 2): number {
  return Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Clamp number between min and max
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

// Check if number is in range
export function inRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

// Random integer between min and max
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
export function randomFloat(min: number, max: number, decimals = 2): number {
  const num = Math.random() * (max - min) + min;
  return round(num, decimals);
}

// Calculate percentage
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Calculate percentage change
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Average of numbers
export function average(...numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

// Median of numbers
export function median(...numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// Mode of numbers (most frequent)
export function mode(...numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const counts = new Map<number, number>();
  let maxCount = 0;
  let modeValue = numbers[0];
  
  numbers.forEach((num) => {
    const count = (counts.get(num) || 0) + 1;
    counts.set(num, count);
    
    if (count > maxCount) {
      maxCount = count;
      modeValue = num;
    }
  });
  
  return modeValue;
}

// Sum of numbers
export function sum(...numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0);
}

// Product of numbers
export function product(...numbers: number[]): number {
  return numbers.reduce((acc, num) => acc * num, 1);
}

// Greatest common divisor
export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Least common multiple
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// Check if prime
export function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  
  return true;
}

// Check if even
export function isEven(num: number): boolean {
  return num % 2 === 0;
}

// Check if odd
export function isOdd(num: number): boolean {
  return num % 2 !== 0;
}

// Check if positive
export function isPositive(num: number): boolean {
  return num > 0;
}

// Check if negative
export function isNegative(num: number): boolean {
  return num < 0;
}

// Check if zero
export function isZero(num: number): boolean {
  return num === 0;
}

// Absolute value
export function abs(num: number): number {
  return Math.abs(num);
}

// Sign of number (-1, 0, or 1)
export function sign(num: number): number {
  return Math.sign(num);
}

// Power
export function power(base: number, exponent: number): number {
  return Math.pow(base, exponent);
}

// Square root
export function sqrt(num: number): number {
  return Math.sqrt(num);
}

// Factorial
export function factorial(num: number): number {
  if (num < 0) return NaN;
  if (num === 0 || num === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= num; i++) {
    result *= i;
  }
  
  return result;
}

// Fibonacci number at position n
export function fibonacci(n: number): number {
  if (n <= 1) return n;
  
  let a = 0;
  let b = 1;
  
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
}

// Convert to roman numeral
export function toRoman(num: number): string {
  if (num < 1 || num > 3999) return "";
  
  const romanNumerals = [
    { value: 1000, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" },
  ];
  
  let result = "";
  let remaining = num;
  
  for (const { value, symbol } of romanNumerals) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  
  return result;
}

// Linear interpolation
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// Normalize value to 0-1 range
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// Map value from one range to another
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Distance between two points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Degrees to radians
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Radians to degrees
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Format as ordinal (1st, 2nd, 3rd)
export function toOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// Parse string to number
export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

// Check if valid number
export function isValidNumber(value: any): boolean {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

