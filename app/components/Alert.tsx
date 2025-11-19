/**
 * Alert and Banner Components
 * Display important messages and notifications
 */

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Alert({
  type = "info",
  title,
  message,
  icon,
  onClose,
  action,
}: AlertProps) {
  const typeConfig = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      icon: "text-blue-600",
      defaultIcon: "ℹ️",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      icon: "text-green-600",
      defaultIcon: "✓",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
      icon: "text-yellow-600",
      defaultIcon: "⚠",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      icon: "text-red-600",
      defaultIcon: "✕",
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-lg p-4`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl flex-shrink-0 ${config.icon}`}>
          {icon || config.defaultIcon}
        </span>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold ${config.text} mb-1`}>{title}</h3>
          )}
          <p className={`text-sm ${config.text}`}>{message}</p>

          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 text-sm font-medium ${config.text} hover:underline`}
            >
              {action.label} →
            </button>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.text} hover:opacity-70`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Banner component (full-width)
export function Banner({
  type = "info",
  message,
  action,
  onClose,
}: {
  type?: "info" | "success" | "warning" | "error";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}) {
  const typeConfig = {
    info: {
      bg: "bg-blue-600",
      text: "text-white",
    },
    success: {
      bg: "bg-green-600",
      text: "text-white",
    },
    warning: {
      bg: "bg-yellow-500",
      text: "text-white",
    },
    error: {
      bg: "bg-red-600",
      text: "text-white",
    },
  };

  const config = typeConfig[type];

  return (
    <div className={`${config.bg} ${config.text}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{message}</p>

          <div className="flex items-center gap-4">
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm font-semibold hover:underline whitespace-nowrap"
              >
                {action.label}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="hover:opacity-70"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline alert (no background, just text and icon)
export function InlineAlert({
  type = "info",
  message,
}: {
  type?: "info" | "success" | "warning" | "error";
  message: string;
}) {
  const typeConfig = {
    info: { text: "text-blue-700", icon: "ℹ️" },
    success: { text: "text-green-700", icon: "✓" },
    warning: { text: "text-yellow-700", icon: "⚠" },
    error: { text: "text-red-700", icon: "✕" },
  };

  const config = typeConfig[type];

  return (
    <div className={`flex items-center gap-2 text-sm ${config.text}`}>
      <span>{config.icon}</span>
      <span>{message}</span>
    </div>
  );
}


