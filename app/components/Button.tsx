/**
 * Button Components
 * Comprehensive button library
 */

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  onClick,
  type = "button",
}: ButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400",
    outline: "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        inline-flex items-center justify-center gap-2
      `}
    >
      {loading && (
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
      )}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </button>
  );
}

// Icon button
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizeClasses = {
    sm: "p-1.5 text-sm",
    md: "p-2 text-base",
    lg: "p-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {icon}
    </button>
  );
}

// Button group
export function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex rounded-lg shadow-sm" role="group">
      {children}
    </div>
  );
}

// Social button
export function SocialButton({
  provider,
  onClick,
}: {
  provider: "google" | "github" | "twitter";
  onClick: () => void;
}) {
  const providerConfig = {
    google: {
      icon: "🔵",
      label: "Continue with Google",
      bg: "bg-white",
      text: "text-gray-900",
      border: "border-gray-300",
    },
    github: {
      icon: "⚫",
      label: "Continue with GitHub",
      bg: "bg-gray-900",
      text: "text-white",
      border: "border-gray-900",
    },
    twitter: {
      icon: "🐦",
      label: "Continue with Twitter",
      bg: "bg-blue-400",
      text: "text-white",
      border: "border-blue-400",
    },
  };

  const config = providerConfig[provider];

  return (
    <button
      onClick={onClick}
      className={`
        ${config.bg} ${config.text} border-2 ${config.border}
        w-full px-4 py-3 rounded-lg font-medium
        hover:opacity-90 transition-opacity
        inline-flex items-center justify-center gap-3
      `}
    >
      <span className="text-xl">{config.icon}</span>
      {config.label}
    </button>
  );
}

// Floating action button
export function FloatingActionButton({
  icon,
  label,
  onClick,
  position = "bottom-right",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: "bottom-right" | "bottom-left";
}) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        fixed ${positionClasses[position]} z-50
        w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg
        hover:bg-blue-700 hover:scale-110
        transition-all duration-200
        flex items-center justify-center text-2xl
      `}
    >
      {icon}
    </button>
  );
}

