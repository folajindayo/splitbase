/**
 * Progress Bar Components
 * Various progress indicators and bars
 */

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger" | "gradient";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  label,
  animated = false,
  striped = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  };

  const variantClasses = {
    default: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-500",
    danger: "bg-red-600",
    gradient: "bg-gradient-to-r from-blue-500 to-purple-600",
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || `Progress: ${percentage.toFixed(0)}%`}
          </span>
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${
            animated ? "animate-progress" : ""
          } ${striped ? "bg-stripes" : ""} relative`}
          style={{ width: `${percentage}%` }}
        >
          {striped && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:40px_100%] animate-shimmer"></div>
          )}
        </div>
      </div>
    </div>
  );
}

// Circular progress
export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label,
  variant = "default",
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    default: "#2563eb",
    success: "#16a34a",
    warning: "#eab308",
    danger: "#dc2626",
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {percentage.toFixed(0)}%
          </span>
          {label && <span className="text-xs text-gray-600 mt-1">{label}</span>}
        </div>
      )}
    </div>
  );
}

// Step progress
export function StepProgress({
  steps,
  currentStep,
  variant = "default",
}: {
  steps: string[];
  currentStep: number;
  variant?: "default" | "numbered";
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : variant === "numbered" ? (
                    index + 1
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-current"></div>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 text-center ${
                    isCompleted || isCurrent ? "text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {step}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-1 mx-2">
                  <div
                    className={`h-full transition-colors ${
                      isCompleted ? "bg-green-600" : "bg-gray-200"
                    }`}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Loading bar (indeterminate)
export function LoadingBar({ variant = "default" }: { variant?: "default" | "thin" }) {
  const heightClass = variant === "thin" ? "h-1" : "h-2";

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
      <div className={`${heightClass} bg-blue-600 rounded-full animate-loading-bar`}></div>
    </div>
  );
}

// Mini progress indicator
export function MiniProgress({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-xs font-medium text-gray-600 min-w-[3ch]">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

// Stacked progress (multiple values)
export function StackedProgress({
  segments,
  showLegend = true,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  showLegend?: boolean;
}) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className="w-full">
      <div className="flex h-6 bg-gray-200 rounded-full overflow-hidden">
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          if (percentage === 0) return null;

          return (
            <div
              key={index}
              className="flex items-center justify-center text-xs font-medium text-white transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
              }}
            >
              {percentage > 10 && `${percentage.toFixed(0)}%`}
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-sm text-gray-700">
                {segment.label}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

