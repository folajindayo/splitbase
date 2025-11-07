"use client";

import { useEffect, useState } from "react";
import { notificationManager, type Notification } from "@/lib/notifications";

export default function ToastNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
    }
  };

  const getColors = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: "bg-green-500",
          text: "text-green-900",
          subtext: "text-green-700",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "bg-red-500",
          text: "text-red-900",
          subtext: "text-red-700",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "bg-yellow-500",
          text: "text-yellow-900",
          subtext: "text-yellow-700",
        };
      case "info":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "bg-blue-500",
          text: "text-blue-900",
          subtext: "text-blue-700",
        };
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full px-4">
      {notifications.map((notification) => {
        const colors = getColors(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`${colors.icon} w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {getIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`${colors.text} font-semibold text-sm`}>
                  {notification.title}
                </h4>
                <p className={`${colors.subtext} text-sm mt-1`}>
                  {notification.message}
                </p>

                {/* Action Button */}
                {notification.action && (
                  <button
                    onClick={notification.action.onClick}
                    className={`${colors.text} text-sm font-medium mt-2 hover:underline`}
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => notificationManager.remove(notification.id)}
                className={`${colors.text} hover:opacity-70 flex-shrink-0`}
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Bar for Auto-Dismiss */}
            {notification.duration && notification.duration > 0 && (
              <div className="mt-3 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.icon} animate-progress`}
                  style={{
                    animationDuration: `${notification.duration}ms`,
                  }}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

