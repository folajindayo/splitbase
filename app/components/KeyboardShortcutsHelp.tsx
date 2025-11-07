"use client";

import { useState, useEffect } from "react";
import { shortcutManager, shortcutGroups, formatModifier } from "@/lib/keyboardShortcuts";

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Open with Shift + ?
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-40"
        title="Keyboard Shortcuts (Shift + ?)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                ⌨️ Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Speed up your workflow with these shortcuts
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {Object.entries(shortcutGroups).map(([groupKey, group]) => (
              <div key={groupKey}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {group.name === "Navigation" && "🧭"}
                  {group.name === "Actions" && "⚡"}
                  {group.name === "Escrow" && "💼"}
                  {group.name === "Interface" && "🎨"}
                  {group.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.meta && (
                          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">
                            ⌘
                          </kbd>
                        )}
                        {shortcut.ctrl && (
                          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">
                            {formatModifier()}
                          </kbd>
                        )}
                        {shortcut.shift && (
                          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">
                            Shift
                          </kbd>
                        )}
                        {shortcut.alt && (
                          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">
                            Alt
                          </kbd>
                        )}
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 shadow-sm">
                          {shortcut.key.toUpperCase()}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Tips */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Pro Tips</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Quick Search:</strong> Press {formatModifier()} + K from anywhere to open search
                  </p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Navigation:</strong> Use {formatModifier()} + D/E/S to quickly switch between pages
                  </p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <strong>Escrow Actions:</strong> Hold {formatModifier()} + Shift for quick escrow actions
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>Close Anything:</strong> Press Escape to close modals, dialogs, and dropdowns
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Note */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
              <p>
                Shortcuts are automatically adjusted for your platform.
                {" "}
                {formatModifier() === "⌘" ? "You're using Mac shortcuts." : "You're using Windows/Linux shortcuts."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold">Shift</kbd>
              {" + "}
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold">?</kbd>
              {" "}to open this help anytime
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

