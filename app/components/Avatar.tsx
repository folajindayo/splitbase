/**
 * Avatar Components
 * User avatars and profile pictures
 */

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  rounded?: boolean;
  status?: "online" | "offline" | "away" | "busy";
  border?: boolean;
  fallbackColor?: string;
}

export default function Avatar({
  src,
  alt = "Avatar",
  name,
  size = "md",
  rounded = true,
  status,
  border = false,
  fallbackColor,
}: AvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-20 h-20 text-2xl",
  };

  const statusSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
    "2xl": "w-4 h-4",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative inline-block">
      <div
        className={`
          ${sizeClasses[size]}
          ${rounded ? "rounded-full" : "rounded-lg"}
          ${border ? "ring-2 ring-white ring-offset-2" : ""}
          overflow-hidden
          flex items-center justify-center
          ${!src ? (fallbackColor || (name ? getColorFromName(name) : "bg-gray-300")) : ""}
        `}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : name ? (
          <span className="font-semibold text-white">{getInitials(name)}</span>
        ) : (
          <svg className="w-2/3 h-2/3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSizes[size]}
            ${statusColors[status]}
            rounded-full border-2 border-white
          `}
        />
      )}
    </div>
  );
}

// Avatar group
export function AvatarGroup({
  avatars,
  max = 3,
  size = "md",
}: {
  avatars: Array<{ src?: string; name?: string; alt?: string }>;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayAvatars.map((avatar, index) => (
        <div key={index} className="relative">
          <Avatar {...avatar} size={size} border />
        </div>
      ))}
      {remaining > 0 && (
        <div className="relative">
          <Avatar
            name={`+${remaining}`}
            size={size}
            border
            fallbackColor="bg-gray-500"
          />
        </div>
      )}
    </div>
  );
}

// Avatar with info
export function AvatarWithInfo({
  src,
  name,
  subtitle,
  size = "md",
  status,
}: {
  src?: string;
  name: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "away" | "busy";
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={src} name={name} size={size} status={status} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-gray-600 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

