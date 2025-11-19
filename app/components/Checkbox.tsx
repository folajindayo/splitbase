/**
 * Checkbox Components
 * Single and group checkbox inputs
 */

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
}

export default function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  error,
  size = "md",
  indeterminate = false,
}: CheckboxProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const labelSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="w-full">
      <label
        className={`
          flex items-start gap-3
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            ref={(input) => {
              if (input) input.indeterminate = indeterminate;
            }}
            className={`
              ${sizeClasses[size]}
              text-blue-600 border-gray-300 rounded
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
              transition-colors
            `}
          />
        </div>
        
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className={`${labelSizes[size]} font-medium text-gray-900 block`}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-sm text-gray-600 block mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>

      {error && <p className="mt-1 ml-8 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Checkbox group
export function CheckboxGroup({
  options,
  value = [],
  onChange,
  label,
  error,
  orientation = "vertical",
  size = "md",
}: {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  label?: string;
  error?: string;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
}) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange?.([...value, optionValue]);
    } else {
      onChange?.(value.filter((v) => v !== optionValue));
    }
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
          flex ${orientation === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-2"}
        `}
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            checked={value.includes(option.value)}
            onChange={(checked) => handleChange(option.value, checked)}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            size={size}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Card checkbox
export function CardCheckbox({
  checked = false,
  onChange,
  title,
  description,
  icon,
  disabled = false,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`
        relative flex items-start p-4 rounded-lg border-2 cursor-pointer
        ${checked 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-200 hover:border-gray-300"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        transition-all
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      
      <div className="flex items-start gap-3 flex-1">
        {icon && <div className="text-gray-700 mt-0.5">{icon}</div>}
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{title}</span>
            {checked && (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </label>
  );
}

// Toggle switch (checkbox styled as switch)
export function ToggleSwitch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const switchSizes = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-8",
  };

  const circleSizes = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const translateSizes = {
    sm: "translate-x-4",
    md: "translate-x-5",
    lg: "translate-x-6",
  };

  return (
    <label
      className={`
        flex items-start gap-3
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            ${switchSizes[size]} rounded-full transition-colors
            ${checked ? "bg-blue-600" : "bg-gray-300"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div
            className={`
              ${circleSizes[size]} bg-white rounded-full shadow-md
              transform transition-transform
              ${checked ? translateSizes[size] : "translate-x-0.5"}
              mt-0.5
            `}
          />
        </div>
      </div>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-sm font-medium text-gray-900 block">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-600 block mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}


