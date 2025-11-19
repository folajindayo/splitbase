/**
 * Breadcrumb Navigation Component
 * Display current page location hierarchy
 */

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: "slash" | "chevron" | "arrow" | "dot";
  size?: "sm" | "md" | "lg";
}

export default function Breadcrumb({
  items,
  separator = "chevron",
  size = "md",
}: BreadcrumbProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const getSeparator = () => {
    switch (separator) {
      case "slash":
        return <span className="text-gray-400 mx-2">/</span>;
      case "arrow":
        return <span className="text-gray-400 mx-2">→</span>;
      case "dot":
        return <span className="text-gray-400 mx-2">•</span>;
      case "chevron":
      default:
        return (
          <svg
            className="w-4 h-4 text-gray-400 mx-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <nav className={`flex items-center ${sizeClasses[size]}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <li key={index} className="flex items-center">
              {item.href && !isCurrent ? (
                <a
                  href={item.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isCurrent
                      ? "text-gray-900 font-medium"
                      : "text-gray-600"
                  }`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </span>
              )}
              {!isLast && getSeparator()}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Breadcrumb with dropdown for mobile
export function ResponsiveBreadcrumb({
  items,
  maxVisible = 3,
}: {
  items: BreadcrumbItem[];
  maxVisible?: number;
}) {
  if (items.length <= maxVisible) {
    return <Breadcrumb items={items} />;
  }

  const firstItem = items[0];
  const lastItems = items.slice(-(maxVisible - 1));
  const hiddenItems = items.slice(1, -(maxVisible - 1));

  return (
    <nav className="flex items-center text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center">
        {/* First item */}
        <li className="flex items-center">
          {firstItem.href ? (
            <a
              href={firstItem.href}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {firstItem.label}
            </a>
          ) : (
            <span className="text-gray-600">{firstItem.label}</span>
          )}
          <svg
            className="w-4 h-4 text-gray-400 mx-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </li>

        {/* Dropdown for hidden items */}
        {hiddenItems.length > 0 && (
          <li className="flex items-center">
            <button className="text-gray-600 hover:text-gray-900 px-2">
              ...
            </button>
            <svg
              className="w-4 h-4 text-gray-400 mx-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </li>
        )}

        {/* Last items */}
        {lastItems.map((item, index) => {
          const isLast = index === lastItems.length - 1;

          return (
            <li key={index} className="flex items-center">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={isLast ? "text-gray-900 font-medium" : "text-gray-600"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


