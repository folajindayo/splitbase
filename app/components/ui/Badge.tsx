/**
 * Badge Components
 * Status badges and labels
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "dark";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  rounded = false,
  icon,
  onRemove,
}: BadgeProps) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-cyan-100 text-cyan-800",
    dark: "bg-gray-800 text-white",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${variantClasses[variant]} ${
        sizeClasses[size]
      } ${rounded ? "rounded-full" : "rounded"}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// Status badge with dot indicator
export function StatusBadge({
  status,
  size = "md",
}: {
  status: "active" | "pending" | "inactive" | "error";
  size?: "sm" | "md" | "lg";
}) {
  const statusConfig = {
    active: { label: "Active", color: "bg-green-500", variant: "success" as const },
    pending: { label: "Pending", color: "bg-yellow-500", variant: "warning" as const },
    inactive: { label: "Inactive", color: "bg-gray-500", variant: "default" as const },
    error: { label: "Error", color: "bg-red-500", variant: "danger" as const },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} rounded>
      <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
      {config.label}
    </Badge>
  );
}

// Escrow status badge
export function EscrowStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { icon: string; variant: "default" | "primary" | "success" | "warning" | "danger" }> = {
    pending: { icon: "⏳", variant: "warning" },
    funded: { icon: "💰", variant: "primary" },
    released: { icon: "✅", variant: "success" },
    disputed: { icon: "⚠️", variant: "warning" },
    cancelled: { icon: "❌", variant: "danger" },
    expired: { icon: "⏰", variant: "default" },
  };

  const config = statusConfig[status] || { icon: "❓", variant: "default" as const };

  return (
    <Badge variant={config.variant} rounded>
      {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Count badge (notification style)
export function CountBadge({ count, max = 99 }: { count: number; max?: number }) {
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full">
      {displayCount}
    </span>
  );
}

// Tag badge (for categories, filters)
export function TagBadge({
  label,
  onRemove,
  color,
}: {
  label: string;
  onRemove?: () => void;
  color?: string;
}) {
  const bgColor = color || "bg-blue-100";
  const textColor = color ? "text-gray-800" : "text-blue-800";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 ${bgColor} ${textColor} text-sm font-medium rounded-full`}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remove tag"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// New badge (for new features)
export function NewBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded uppercase animate-pulse">
      New
    </span>
  );
}

// Beta badge
export function BetaBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded uppercase">
      Beta
    </span>
  );
}

// Pro badge
export function ProBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded uppercase">
      Pro
    </span>
  );
}

// Verified badge
export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <span className="inline-flex items-center" title="Verified">
      <svg
        className={`${sizeClasses[size]} text-blue-600`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

// Percentage badge
export function PercentageBadge({
  percentage,
  showSign = true,
}: {
  percentage: number;
  showSign?: boolean;
}) {
  const isPositive = percentage > 0;
  const isNegative = percentage < 0;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-semibold rounded ${
        isPositive
          ? "bg-green-100 text-green-800"
          : isNegative
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {showSign && isPositive && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {showSign && isNegative && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {Math.abs(percentage).toFixed(1)}%
    </span>
  );
}

// Priority badge
export function PriorityBadge({
  priority,
}: {
  priority: "low" | "medium" | "high" | "urgent";
}) {
  const priorityConfig = {
    low: { label: "Low", variant: "default" as const, icon: "⚪" },
    medium: { label: "Medium", variant: "warning" as const, icon: "🟡" },
    high: { label: "High", variant: "danger" as const, icon: "🟠" },
    urgent: { label: "Urgent", variant: "danger" as const, icon: "🔴" },
  };

  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon} {config.label}
    </Badge>
  );
}

// Network badge
export function NetworkBadge({ chainId }: { chainId: number }) {
  const networks: Record<number, { name: string; color: string }> = {
    1: { name: "Ethereum", color: "bg-blue-100 text-blue-800" },
    8453: { name: "Base", color: "bg-indigo-100 text-indigo-800" },
    84532: { name: "Base Sepolia", color: "bg-purple-100 text-purple-800" },
    137: { name: "Polygon", color: "bg-purple-100 text-purple-800" },
  };

  const network = networks[chainId] || {
    name: `Chain ${chainId}`,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${network.color}`}
    >
      <span className="w-2 h-2 rounded-full bg-current"></span>
      {network.name}
    </span>
  );
}

