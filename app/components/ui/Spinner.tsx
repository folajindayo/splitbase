/**
 * Spinner/Loading Components
 * Loading indicators and spinners
 */

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray";
  label?: string;
}

export default function Spinner({
  size = "md",
  color = "primary",
  label,
}: SpinnerProps) {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white",
    gray: "text-gray-400",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      )}
    </div>
  );
}

// Dots spinner
export function DotsSpinner({
  size = "md",
  color = "primary",
}: {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
}) {
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const colorClasses = {
    primary: "bg-blue-600",
    secondary: "bg-gray-600",
    white: "bg-white",
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSizes[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// Pulse spinner
export function PulseSpinner({
  size = "md",
  color = "primary",
}: {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary";
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const colorClasses = {
    primary: "bg-blue-600",
    secondary: "bg-gray-600",
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full opacity-60 absolute animate-ping`}
      />
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full opacity-80`}
      />
    </div>
  );
}

// Bar spinner
export function BarSpinner({
  size = "md",
  color = "primary",
}: {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
}) {
  const barHeights = {
    sm: ["h-4", "h-6", "h-4", "h-6", "h-4"],
    md: ["h-6", "h-8", "h-6", "h-8", "h-6"],
    lg: ["h-8", "h-12", "h-8", "h-12", "h-8"],
  };

  const colorClasses = {
    primary: "bg-blue-600",
    secondary: "bg-gray-600",
    white: "bg-white",
  };

  return (
    <div className="flex items-end gap-1">
      {barHeights[size].map((height, i) => (
        <div
          key={i}
          className={`w-1 ${height} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// Full page loader
export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" label={message} />
      </div>
    </div>
  );
}

// Inline loader
export function InlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Spinner size="sm" color="secondary" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Button loader
export function ButtonLoader() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}


