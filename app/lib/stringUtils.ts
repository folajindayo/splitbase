/**
 * String Utility Functions
 * Comprehensive string manipulation
 */

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Capitalize all words
export function capitalizeWords(str: string): string {
  return str.split(" ").map(capitalize).join(" ");
}

// Convert to lowercase
export function lowercase(str: string): string {
  return str.toLowerCase();
}

// Convert to uppercase
export function uppercase(str: string): string {
  return str.toUpperCase();
}

// Convert to camelCase
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

// Convert to PascalCase
export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// Convert to snake_case
export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/[-\s]+/g, "_")
    .toLowerCase()
    .replace(/^_/, "");
}

// Convert to kebab-case
export function kebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "-$1")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/^-/, "");
}

// Truncate string
export function truncate(str: string, length: number, suffix = "..."): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

// Truncate in middle
export function truncateMiddle(str: string, maxLength: number, separator = "..."): string {
  if (str.length <= maxLength) return str;
  
  const charsToShow = maxLength - separator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  
  return str.slice(0, frontChars) + separator + str.slice(-backChars);
}

// Remove whitespace
export function trim(str: string): string {
  return str.trim();
}

// Remove all whitespace
export function removeWhitespace(str: string): string {
  return str.replace(/\s/g, "");
}

// Pad start
export function padStart(str: string, length: number, char = " "): string {
  return str.padStart(length, char);
}

// Pad end
export function padEnd(str: string, length: number, char = " "): string {
  return str.padEnd(length, char);
}

// Repeat string
export function repeat(str: string, count: number): string {
  return str.repeat(count);
}

// Reverse string
export function reverse(str: string): string {
  return str.split("").reverse().join("");
}

// Check if string contains substring
export function contains(str: string, substring: string, caseSensitive = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().includes(substring.toLowerCase());
  }
  return str.includes(substring);
}

// Check if string starts with substring
export function startsWith(str: string, substring: string, caseSensitive = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().startsWith(substring.toLowerCase());
  }
  return str.startsWith(substring);
}

// Check if string ends with substring
export function endsWith(str: string, substring: string, caseSensitive = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().endsWith(substring.toLowerCase());
  }
  return str.endsWith(substring);
}

// Replace all occurrences
export function replaceAll(str: string, search: string, replace: string): string {
  return str.split(search).join(replace);
}

// Remove special characters
export function removeSpecialChars(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s]/g, "");
}

// Keep only alphanumeric
export function alphanumericOnly(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

// Keep only letters
export function lettersOnly(str: string): string {
  return str.replace(/[^a-zA-Z]/g, "");
}

// Keep only numbers
export function numbersOnly(str: string): string {
  return str.replace(/[^0-9]/g, "");
}

// Count words
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Count characters (excluding whitespace)
export function charCount(str: string): number {
  return str.replace(/\s/g, "").length;
}

// Slugify for URLs
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Extract initials
export function getInitials(name: string, maxInitials = 2): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, maxInitials)
    .join("");
}

// Mask string (for sensitive data)
export function maskString(str: string, visibleStart = 4, visibleEnd = 4, maskChar = "*"): string {
  if (str.length <= visibleStart + visibleEnd) return str;
  
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const maskLength = str.length - visibleStart - visibleEnd;
  
  return start + maskChar.repeat(maskLength) + end;
}

// Format phone number
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

// Format credit card
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, "");
  const chunks = cleaned.match(/.{1,4}/g) || [];
  return chunks.join(" ");
}

// Escape HTML
export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Unescape HTML
export function unescapeHtml(str: string): string {
  const div = document.createElement("div");
  div.innerHTML = str;
  return div.textContent || "";
}

// Generate random string
export function randomString(length: number, charset = "alphanumeric"): string {
  const charsets = {
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    numeric: "0123456789",
    hex: "0123456789abcdef",
  };
  
  const chars = charsets[charset as keyof typeof charsets] || charsets.alphanumeric;
  let result = "";
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Check if string is empty
export function isEmpty(str: string): boolean {
  return str.trim().length === 0;
}

// Check if string is blank (only whitespace)
export function isBlank(str: string): boolean {
  return /^\s*$/.test(str);
}

// Wrap text to width
export function wrapText(str: string, width: number): string {
  const words = str.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > width) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine) lines.push(currentLine.trim());
  return lines.join("\n");
}

// Strip HTML tags
export function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Pluralize
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || singular + "s";
}

// Ordinalize number
export function ordinalize(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

