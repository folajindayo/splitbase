/**
 * Rating Component
 * Star rating input and display
 */

import { useState } from "react";

interface RatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  allowHalf?: boolean;
  showValue?: boolean;
  color?: "yellow" | "orange" | "red" | "blue";
  icon?: "star" | "heart" | "circle";
}

export default function Rating({
  value = 0,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  allowHalf = false,
  showValue = false,
  color = "yellow",
  icon = "star",
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClasses = {
    yellow: "text-yellow-400",
    orange: "text-orange-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange?.(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const getIcon = (filled: boolean, half: boolean = false) => {
    if (icon === "heart") {
      return (
        <svg
          className={sizeClasses[size]}
          fill={filled || half ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {half ? (
            <defs>
              <linearGradient id="halfHeart">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          ) : null}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            fill={half ? "url(#halfHeart)" : undefined}
          />
        </svg>
      );
    }

    if (icon === "circle") {
      return (
        <svg className={sizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
          <circle
            cx="10"
            cy="10"
            r="8"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
    }

    // Default: star
    return (
      <svg
        className={sizeClasses[size]}
        fill={filled || half ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {half ? (
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
        ) : null}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          fill={half ? "url(#halfStar)" : undefined}
        />
      </svg>
    );
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: max }, (_, i) => {
          const rating = i + 1;
          const isFilled = displayValue >= rating;
          const isHalf = allowHalf && displayValue >= rating - 0.5 && displayValue < rating;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              disabled={readonly}
              className={`
                ${colorClasses[color]}
                ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}
                transition-transform
                ${isFilled || isHalf ? "" : "text-gray-300"}
              `}
            >
              {getIcon(isFilled, isHalf)}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {value.toFixed(allowHalf ? 1 : 0)} / {max}
        </span>
      )}
    </div>
  );
}

// Display-only rating
export function DisplayRating({
  value,
  max = 5,
  size = "sm",
  showValue = true,
  reviewCount,
}: {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Rating value={value} max={max} size={size} readonly />
      {showValue && (
        <span className="text-sm text-gray-700">
          {value.toFixed(1)}
          {reviewCount !== undefined && (
            <span className="text-gray-500"> ({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}

// Rating summary
export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
}: {
  averageRating: number;
  totalReviews: number;
  distribution: { stars: number; count: number; percentage: number }[];
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-900">
          {averageRating.toFixed(1)}
        </div>
        <Rating value={averageRating} size="lg" readonly />
        <p className="text-sm text-gray-600 mt-2">
          Based on {totalReviews.toLocaleString()} reviews
        </p>
      </div>

      <div className="space-y-2">
        {distribution.map((item) => (
          <div key={item.stars} className="flex items-center gap-3">
            <span className="text-sm text-gray-700 w-12">
              {item.stars} star{item.stars !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-12 text-right">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

