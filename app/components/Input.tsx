/**
 * Input Components
 * Form input fields
 */

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "number" | "url" | "tel";
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  helperText,
  required = false,
  disabled = false,
  icon,
  iconPosition = "left",
  maxLength,
  autoComplete,
  autoFocus = false,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`
            w-full px-4 py-3 rounded-lg border transition-colors
            ${icon && iconPosition === "left" ? "pl-10" : ""}
            ${icon && iconPosition === "right" ? "pr-10" : ""}
            ${error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }
            ${disabled
              ? "bg-gray-100 cursor-not-allowed opacity-50"
              : "bg-white"
            }
            focus:outline-none
          `}
        />

        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && helperText && (
        <p className="mt-2 text-sm text-gray-600">{helperText}</p>
      )}
      {maxLength && (
        <p className="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

// Textarea component
export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  autoFocus = false,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`
          w-full px-4 py-3 rounded-lg border transition-colors resize-none
          ${error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          }
          ${disabled
            ? "bg-gray-100 cursor-not-allowed opacity-50"
            : "bg-white"
          }
          focus:outline-none
        `}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && helperText && (
        <p className="mt-2 text-sm text-gray-600">{helperText}</p>
      )}
      {maxLength && (
        <p className="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

// Checkbox component
export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`
          w-5 h-5 rounded border-gray-300 text-blue-600
          focus:ring-2 focus:ring-blue-500
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      />
      <span className={`text-sm ${disabled ? "text-gray-400" : "text-gray-700"}`}>
        {label}
      </span>
    </label>
  );
}

// Radio button component
export function Radio({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-5 h-5 border-gray-300 text-blue-600
          focus:ring-2 focus:ring-blue-500
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      />
      <span className={`text-sm ${disabled ? "text-gray-400" : "text-gray-700"}`}>
        {label}
      </span>
    </label>
  );
}

// Toggle/Switch component
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors
            ${checked ? "bg-blue-600" : "bg-gray-300"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
              transition-transform duration-200
              ${checked ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </div>
      </div>
      {label && (
        <span className={`text-sm ${disabled ? "text-gray-400" : "text-gray-700"}`}>
          {label}
        </span>
      )}
    </label>
  );
}

// Search input
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
      />

      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}


