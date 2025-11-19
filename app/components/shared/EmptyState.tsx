"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "search" | "error" | "success";
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (variant) {
      case "search":
        return "🔍";
      case "error":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "📭";
    }
  };

  const getColorScheme = () => {
    switch (variant) {
      case "search":
        return {
          bg: "bg-blue-50",
          text: "text-blue-900",
          subtext: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      case "error":
        return {
          bg: "bg-red-50",
          text: "text-red-900",
          subtext: "text-red-700",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "success":
        return {
          bg: "bg-green-50",
          text: "text-green-900",
          subtext: "text-green-700",
          button: "bg-green-600 hover:bg-green-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-900",
          subtext: "text-gray-600",
          button: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const colors = getColorScheme();
  const displayIcon = icon || getDefaultIcon();

  return (
    <div className={`${colors.bg} rounded-lg border border-gray-200 p-12 text-center`}>
      {/* Icon */}
      <div className="text-6xl mb-4 animate-bounce-slow">{displayIcon}</div>

      {/* Title */}
      <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>{title}</h3>

      {/* Description */}
      {description && (
        <p className={`${colors.subtext} max-w-md mx-auto mb-6`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {action && (
            <button
              onClick={action.onClick}
              className={`${colors.button} text-white px-6 py-3 rounded-lg font-medium transition-colors`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
export function NoEscrowsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon="💼"
      title="No Escrows Yet"
      description="Create your first escrow to securely hold funds until both parties are satisfied."
      action={{
        label: "Create First Escrow",
        onClick: onCreate,
      }}
      secondaryAction={{
        label: "Learn About Escrows",
        onClick: () => window.open("/docs/escrows", "_blank"),
      }}
    />
  );
}

export function NoSearchResultsEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      title="No Results Found"
      description={`We couldn't find any escrows matching "${query}". Try adjusting your search or filters.`}
      action={{
        label: "Clear Search",
        onClick: onClear,
      }}
    />
  );
}

export function ErrorEmptyState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      title="Something Went Wrong"
      description={message || "We encountered an error loading your data. Please try again."}
      action={{
        label: "Try Again",
        onClick: onRetry,
      }}
    />
  );
}

export function NoSplitsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon="📊"
      title="No Payment Splits"
      description="Create your first payment split to automatically distribute funds to multiple recipients."
      action={{
        label: "Create First Split",
        onClick: onCreate,
      }}
    />
  );
}

export function ComingSoonEmptyState({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon="🚀"
      title="Coming Soon"
      description={`${feature} is currently under development. Stay tuned for updates!`}
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      icon="🔔"
      title="All Caught Up"
      description="You don't have any notifications right now. We'll notify you when something important happens."
      variant="success"
    />
  );
}

export function NoActivityEmptyState() {
  return (
    <EmptyState
      icon="📝"
      title="No Activity Yet"
      description="Activity from your escrows and splits will appear here."
    />
  );
}

export function MaintenanceEmptyState() {
  return (
    <EmptyState
      icon="🔧"
      title="Under Maintenance"
      description="We're performing scheduled maintenance. We'll be back shortly. Thank you for your patience."
      variant="error"
    />
  );
}

export function OfflineEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon="📡"
      title="You're Offline"
      description="Check your internet connection and try again."
      variant="error"
      action={{
        label: "Retry Connection",
        onClick: onRetry,
      }}
    />
  );
}

