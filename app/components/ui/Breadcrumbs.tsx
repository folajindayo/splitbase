"use client";

import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail
 */
export default function Breadcrumbs({
  items,
  separator = "/",
}: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-400" aria-hidden="true">
              {separator}
            </span>
          )}

          {item.href && index < items.length - 1 ? (
            <a
              href={item.href}
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              {item.label}
            </a>
          ) : (
            <span
              className={index === items.length - 1 ? "font-medium text-gray-900" : "text-gray-600"}
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

