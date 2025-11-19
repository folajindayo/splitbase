"use client";

import { ReactNode, useState } from "react";

interface AccordionItemProps {
  id: string;
  title: string;
  children: ReactNode;
  isOpen?: boolean;
  onToggle?: (id: string) => void;
}

export function AccordionItem({
  id,
  title,
  children,
  isOpen = false,
  onToggle,
}: AccordionItemProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-blue-600"
        onClick={() => onToggle?.(id)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg
          className={`h-5 w-5 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="pb-4 text-sm text-gray-600">{children}</div>}
    </div>
  );
}

interface AccordionProps {
  children: ReactNode;
  multiple?: boolean;
  defaultOpen?: string[];
}

export function Accordion({ children, multiple = false, defaultOpen = [] }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = (id: string) => {
    if (multiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {Array.isArray(children)
        ? children.map((child: any) =>
            child
              ? {
                  ...child,
                  props: {
                    ...child.props,
                    isOpen: openItems.includes(child.props.id),
                    onToggle: toggleItem,
                  },
                }
              : null
          )
        : children}
    </div>
  );
}
