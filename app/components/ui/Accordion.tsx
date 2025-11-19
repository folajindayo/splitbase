"use client";

import { useState } from "react";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  variant?: "default" | "bordered" | "separated";
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  variant = "default",
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = (itemId: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setOpenItems((prev) => (prev.includes(itemId) ? [] : [itemId]));
    }
  };

  const isOpen = (itemId: string) => openItems.includes(itemId);

  const containerClasses = {
    default: "divide-y divide-gray-200",
    bordered: "border border-gray-200 rounded-lg divide-y divide-gray-200",
    separated: "space-y-4",
  };

  const itemClasses = {
    default: "",
    bordered: "",
    separated: "border border-gray-200 rounded-lg overflow-hidden",
  };

  return (
    <div className={containerClasses[variant]}>
      {items.map((item) => {
        const open = isOpen(item.id);

        return (
          <div key={item.id} className={itemClasses[variant]}>
            <button
              onClick={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
              className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              } ${open ? "bg-gray-50" : ""}`}
            >
              <div className="flex items-center gap-3 flex-1">
                {item.icon && <span className="text-xl">{item.icon}</span>}
                <span className="font-medium text-gray-900">{item.title}</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
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

            {open && (
              <div className="px-6 py-4 bg-white animate-fade-in">
                <div className="text-gray-700">{item.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple accordion item (for one-off use)
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-gray-50 ${
          isOpen ? "bg-gray-50" : ""
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {isOpen && (
        <div className="px-6 py-4 bg-white border-t border-gray-200 animate-fade-in">
          <div className="text-gray-700">{children}</div>
        </div>
      )}
    </div>
  );
}


