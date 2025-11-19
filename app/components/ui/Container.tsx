"use client";

import React, { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  noPadding?: boolean;
}

/**
 * Container Component
 * Responsive container with max-width variants
 */
export default function Container({
  children,
  maxWidth = "xl",
  className = "",
  noPadding = false,
}: ContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  const paddingClass = noPadding ? "" : "px-4 sm:px-6 lg:px-8";

  return (
    <div className={`mx-auto w-full ${maxWidthClasses[maxWidth]} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

