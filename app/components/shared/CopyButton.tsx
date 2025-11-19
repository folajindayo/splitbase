"use client";

import React, { useState } from "react";
import { copyToClipboard } from "@/lib/shared/browser";

interface CopyButtonProps {
  text: string;
  label?: string;
  successMessage?: string;
  className?: string;
}

/**
 * CopyButton Component
 * Button to copy text to clipboard with feedback
 */
export default function CopyButton({
  text,
  label = "Copy",
  successMessage = "Copied!",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {successMessage}
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

