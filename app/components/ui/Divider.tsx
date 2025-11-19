/**
 * Divider Component
 * Visual separator with optional text
 */

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  text?: string;
  textPosition?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  spacing?: "sm" | "md" | "lg";
  color?: "light" | "default" | "dark";
}

export default function Divider({
  orientation = "horizontal",
  text,
  textPosition = "center",
  size = "md",
  spacing = "md",
  color = "default",
}: DividerProps) {
  const spacingClasses = {
    horizontal: {
      sm: "my-2",
      md: "my-4",
      lg: "my-8",
    },
    vertical: {
      sm: "mx-2",
      md: "mx-4",
      lg: "mx-8",
    },
  };

  const sizeClasses = {
    horizontal: {
      sm: "h-px",
      md: "h-0.5",
      lg: "h-1",
    },
    vertical: {
      sm: "w-px",
      md: "w-0.5",
      lg: "w-1",
    },
  };

  const colorClasses = {
    light: "bg-gray-100",
    default: "bg-gray-200",
    dark: "bg-gray-400",
  };

  if (orientation === "vertical") {
    return (
      <div
        className={`
          ${sizeClasses.vertical[size]}
          ${spacingClasses.vertical[spacing]}
          ${colorClasses[color]}
        `}
        style={{ minHeight: "1rem" }}
      />
    );
  }

  if (!text) {
    return (
      <div
        className={`
          ${sizeClasses.horizontal[size]}
          ${spacingClasses.horizontal[spacing]}
          ${colorClasses[color]}
          w-full
        `}
      />
    );
  }

  return (
    <div className={`relative ${spacingClasses.horizontal[spacing]}`}>
      <div className="absolute inset-0 flex items-center">
        <div className={`w-full ${sizeClasses.horizontal[size]} ${colorClasses[color]}`} />
      </div>
      <div
        className={`relative flex ${
          textPosition === "left"
            ? "justify-start"
            : textPosition === "right"
            ? "justify-end"
            : "justify-center"
        }`}
      >
        <span className="px-3 text-sm text-gray-600 bg-white">{text}</span>
      </div>
    </div>
  );
}

// Icon divider
export function IconDivider({
  icon,
  spacing = "md",
  color = "default",
}: {
  icon: React.ReactNode;
  spacing?: "sm" | "md" | "lg";
  color?: "light" | "default" | "dark";
}) {
  const spacingClasses = {
    sm: "my-2",
    md: "my-4",
    lg: "my-8",
  };

  const colorClasses = {
    light: "bg-gray-100",
    default: "bg-gray-200",
    dark: "bg-gray-400",
  };

  return (
    <div className={`relative ${spacingClasses[spacing]}`}>
      <div className="absolute inset-0 flex items-center">
        <div className={`w-full h-px ${colorClasses[color]}`} />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 text-gray-600 bg-white">{icon}</span>
      </div>
    </div>
  );
}

// Dashed divider
export function DashedDivider({
  orientation = "horizontal",
  spacing = "md",
  color = "default",
}: {
  orientation?: "horizontal" | "vertical";
  spacing?: "sm" | "md" | "lg";
  color?: "light" | "default" | "dark";
}) {
  const spacingClasses = {
    horizontal: {
      sm: "my-2",
      md: "my-4",
      lg: "my-8",
    },
    vertical: {
      sm: "mx-2",
      md: "mx-4",
      lg: "mx-8",
    },
  };

  const colorClasses = {
    light: "border-gray-100",
    default: "border-gray-200",
    dark: "border-gray-400",
  };

  if (orientation === "vertical") {
    return (
      <div
        className={`
          ${spacingClasses.vertical[spacing]}
          border-l border-dashed ${colorClasses[color]}
        `}
        style={{ minHeight: "1rem" }}
      />
    );
  }

  return (
    <div
      className={`
        ${spacingClasses.horizontal[spacing]}
        w-full border-t border-dashed ${colorClasses[color]}
      `}
    />
  );
}

// Gradient divider
export function GradientDivider({
  spacing = "md",
  fromColor = "transparent",
  viaColor = "rgb(229, 231, 235)",
  toColor = "transparent",
}: {
  spacing?: "sm" | "md" | "lg";
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
}) {
  const spacingClasses = {
    sm: "my-2",
    md: "my-4",
    lg: "my-8",
  };

  return (
    <div
      className={`w-full h-px ${spacingClasses[spacing]}`}
      style={{
        background: `linear-gradient(to right, ${fromColor}, ${viaColor}, ${toColor})`,
      }}
    />
  );
}


