/**
 * Color Utility Functions
 * Comprehensive color manipulation
 */

// Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Hex to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

// RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// Lighten color
export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  hsl.l = Math.min(100, hsl.l + amount);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Darken color
export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Saturate color
export function saturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  hsl.s = Math.min(100, hsl.s + amount);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Desaturate color
export function desaturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  hsl.s = Math.max(0, hsl.s - amount);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Get complementary color
export function complementary(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  hsl.h = (hsl.h + 180) % 360;
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Get analogous colors
export function analogous(hex: string): [string, string] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex];
  
  const hsl1 = { ...hsl, h: (hsl.h + 30) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h - 30 + 360) % 360 };
  
  return [hslToHex(hsl1.h, hsl1.s, hsl1.l), hslToHex(hsl2.h, hsl2.s, hsl2.l)];
}

// Get triadic colors
export function triadic(hex: string): [string, string] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex];
  
  const hsl1 = { ...hsl, h: (hsl.h + 120) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h + 240) % 360 };
  
  return [hslToHex(hsl1.h, hsl1.s, hsl1.l), hslToHex(hsl2.h, hsl2.s, hsl2.l)];
}

// Get split complementary colors
export function splitComplementary(hex: string): [string, string] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex];
  
  const hsl1 = { ...hsl, h: (hsl.h + 150) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h + 210) % 360 };
  
  return [hslToHex(hsl1.h, hsl1.s, hsl1.l), hslToHex(hsl2.h, hsl2.s, hsl2.l)];
}

// Mix two colors
export function mix(hex1: string, hex2: string, weight = 0.5): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return hex1;
  
  const r = Math.round(rgb1.r * (1 - weight) + rgb2.r * weight);
  const g = Math.round(rgb1.g * (1 - weight) + rgb2.g * weight);
  const b = Math.round(rgb1.b * (1 - weight) + rgb2.b * weight);
  
  return rgbToHex(r, g, b);
}

// Get color luminance
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio
export function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = luminance(hex1);
  const lum2 = luminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if color is light
export function isLight(hex: string): boolean {
  return luminance(hex) > 0.5;
}

// Check if color is dark
export function isDark(hex: string): boolean {
  return luminance(hex) <= 0.5;
}

// Get readable text color for background
export function getTextColor(bgHex: string): string {
  return isLight(bgHex) ? "#000000" : "#ffffff";
}

// Generate color palette
export function generatePalette(baseHex: string, count = 5): string[] {
  const colors: string[] = [];
  const hsl = hexToHsl(baseHex);
  if (!hsl) return [baseHex];
  
  for (let i = 0; i < count; i++) {
    const lightness = 90 - (i * (80 / (count - 1)));
    colors.push(hslToHex(hsl.h, hsl.s, Math.round(lightness)));
  }
  
  return colors;
}

// Generate shades
export function generateShades(baseHex: string, count = 10): string[] {
  const shades: string[] = [];
  const step = 100 / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const amount = step * i;
    shades.push(darken(baseHex, amount));
  }
  
  return shades;
}

// Generate tints
export function generateTints(baseHex: string, count = 10): string[] {
  const tints: string[] = [];
  const step = 100 / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const amount = step * i;
    tints.push(lighten(baseHex, amount));
  }
  
  return tints;
}

// Random color
export function randomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
}

// Random color from palette
export function randomFromPalette(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Validate hex color
export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex);
}

// Format hex (ensure # prefix)
export function formatHex(hex: string): string {
  return hex.startsWith("#") ? hex : `#${hex}`;
}

// Color name to hex (basic colors)
export function nameToHex(colorName: string): string | null {
  const colors: Record<string, string> = {
    red: "#ff0000",
    green: "#00ff00",
    blue: "#0000ff",
    yellow: "#ffff00",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    black: "#000000",
    white: "#ffffff",
    gray: "#808080",
    orange: "#ffa500",
    purple: "#800080",
    pink: "#ffc0cb",
    brown: "#a52a2a",
  };
  
  return colors[colorName.toLowerCase()] || null;
}

// Get color temperature
export function getTemperature(hex: string): "warm" | "cool" | "neutral" {
  const hsl = hexToHsl(hex);
  if (!hsl) return "neutral";
  
  if (hsl.h >= 30 && hsl.h <= 150) return "warm";
  if (hsl.h >= 150 && hsl.h <= 270) return "cool";
  return "neutral";
}


