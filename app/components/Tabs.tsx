"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "line" | "pills" | "cards";
  size?: "sm" | "md" | "lg";
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = "line",
  size = "md",
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const sizeClasses = {
    sm: "text-sm px-3 py-2",
    md: "text-base px-4 py-2.5",
    lg: "text-lg px-5 py-3",
  };

  if (variant === "pills") {
    return (
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`${sizeClasses[size]} rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`${sizeClasses[size]} rounded-lg border-2 font-medium transition-all flex flex-col items-center gap-2 ${
              activeTab === tab.id
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {tab.icon && <div className="text-2xl">{tab.icon}</div>}
            <div className="text-center">
              {tab.label}
              {tab.count !== undefined && (
                <div className="text-xs text-gray-500 mt-1">{tab.count} items</div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Default: line variant
  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`${sizeClasses[size]} font-medium transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab panels component
export function TabPanels({
  activeTab,
  children,
}: {
  activeTab: string;
  children: React.ReactNode;
}) {
  return <div className="mt-6">{children}</div>;
}

// Tab panel component
export function TabPanel({
  tabId,
  activeTab,
  children,
}: {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
}) {
  if (tabId !== activeTab) return null;

  return <div className="animate-fade-in">{children}</div>;
}

