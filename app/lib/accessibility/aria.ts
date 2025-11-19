/**
 * Accessibility utilities for ARIA attributes
 */

export interface AriaProps {
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-hidden"?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
  "aria-atomic"?: boolean;
  "aria-busy"?: boolean;
  "aria-disabled"?: boolean;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-pressed"?: boolean | "mixed";
  "aria-selected"?: boolean;
  "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
}

export function createAriaLabel(text: string): Pick<AriaProps, "aria-label"> {
  return { "aria-label": text };
}

export function createAriaLabelledBy(id: string): Pick<AriaProps, "aria-labelledby"> {
  return { "aria-labelledby": id };
}

export function createAriaDescribedBy(id: string): Pick<AriaProps, "aria-describedby"> {
  return { "aria-describedby": id };
}

export function createExpandableProps(
  isExpanded: boolean
): Pick<AriaProps, "aria-expanded"> {
  return { "aria-expanded": isExpanded };
}

export function createLiveRegionProps(
  level: "polite" | "assertive" = "polite",
  atomic: boolean = false
): Pick<AriaProps, "aria-live" | "aria-atomic"> {
  return {
    "aria-live": level,
    "aria-atomic": atomic,
  };
}

export function createVisuallyHidden(text: string): {
  children: string;
  className: string;
} {
  return {
    children: text,
    className: "sr-only",
  };
}

export function announceToScreenReader(message: string): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

