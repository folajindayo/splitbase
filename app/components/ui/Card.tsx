/**
 * Card Components
 * Versatile card layouts
 */

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = "default",
  padding = "md",
  hoverable = false,
  clickable = false,
  onClick,
}: CardProps) {
  const variantClasses = {
    default: "bg-white border border-gray-200",
    elevated: "bg-white shadow-lg",
    outlined: "bg-white border-2 border-gray-300",
    ghost: "bg-transparent",
  };

  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const interactiveClasses =
    hoverable || clickable
      ? "transition-all duration-200 hover:shadow-md"
      : "";

  const cursorClass = clickable || onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${cursorClass}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Card with header
export function CardWithHeader({
  title,
  subtitle,
  action,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card padding="none">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
      {footer && <div className="p-6 border-t border-gray-200 bg-gray-50">{footer}</div>}
    </Card>
  );
}

// Stat card
export function StatCard({
  icon,
  label,
  value,
  change,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <Card hoverable>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && trend && (
            <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
              {trend === "up" && "↗"}
              {trend === "down" && "↘"}
              {trend === "neutral" && "→"}
              <span className="font-medium">{change}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl flex-shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Feature card
export function FeatureCard({
  icon,
  title,
  description,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: { label: string; href: string };
}) {
  return (
    <Card hoverable clickable>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {link && (
        <a
          href={link.href}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
        >
          {link.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      )}
    </Card>
  );
}

// Image card
export function ImageCard({
  imageSrc,
  imageAlt,
  title,
  description,
  tags,
  action,
}: {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  tags?: string[];
  action?: React.ReactNode;
}) {
  return (
    <Card padding="none" hoverable>
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {action}
      </div>
    </Card>
  );
}

// Pricing card
export function PricingCard({
  name,
  price,
  period,
  features,
  highlighted,
  cta,
}: {
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  cta: { label: string; onClick: () => void };
}) {
  return (
    <Card
      variant={highlighted ? "elevated" : "outlined"}
      padding="lg"
    >
      {highlighted && (
        <div className="mb-4">
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full uppercase">
            Popular
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {period && <span className="text-gray-600">/{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-700">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={cta.onClick}
        className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
          highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        {cta.label}
      </button>
    </Card>
  );
}


