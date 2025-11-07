/**
 * Radio Group Component
 * Radio buttons with group management
 */

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  error?: string;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
}

export default function RadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  error,
  orientation = "vertical",
  size = "md",
}: RadioGroupProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const radioSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        className={`
          flex ${orientation === "horizontal" ? "flex-row gap-4" : "flex-col gap-2"}
        `}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3 rounded-lg border border-gray-200
              ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
              ${value === option.value ? "border-blue-500 bg-blue-50" : ""}
              transition-all
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => !option.disabled && onChange?.(option.value)}
              disabled={option.disabled}
              className={`
                ${radioSizes[size]}
                mt-0.5 text-blue-600 border-gray-300
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                ${option.disabled ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            />
            <div className="flex-1">
              <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
                {option.icon}
                <span className="font-medium text-gray-900">{option.label}</span>
              </div>
              {option.description && (
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Simple radio group (inline)
export function InlineRadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  size = "md",
}: {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const radioSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center gap-2 ${sizeClasses[size]}
              ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => !option.disabled && onChange?.(option.value)}
              disabled={option.disabled}
              className={`
                ${radioSizes[size]}
                text-blue-600 border-gray-300
                focus:ring-2 focus:ring-blue-500
              `}
            />
            <span className="text-gray-900">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Card-style radio group
export function CardRadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  columns = 2,
}: {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  columns?: 1 | 2 | 3 | 4;
}) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
      )}

      <div className={`grid ${gridClasses[columns]} gap-3`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              relative flex flex-col p-4 rounded-lg border-2 cursor-pointer
              ${value === option.value 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
              }
              ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}
              transition-all
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => !option.disabled && onChange?.(option.value)}
              disabled={option.disabled}
              className="sr-only"
            />
            
            <div className="flex items-start gap-3">
              {option.icon && (
                <div className="text-gray-700">{option.icon}</div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  {value === option.value && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {option.description && (
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

