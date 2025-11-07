/**
 * Slider/Range Input Components
 * Interactive slider for numeric input
 */

import { useState } from "react";

interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  showMinMax?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  formatValue?: (value: number) => string;
}

export default function Slider({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  showMinMax = false,
  disabled = false,
  size = "md",
  color = "primary",
  formatValue,
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const thumbSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const colorClasses = {
    primary: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600",
  };

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(localValue) : localValue;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="text-sm font-medium text-gray-700">{label}</label>
          )}
          {showValue && (
            <span className="text-sm font-medium text-gray-900">{displayValue}</span>
          )}
        </div>
      )}

      <div className="relative">
        <div className={`relative ${heightClasses[size]} bg-gray-200 rounded-full`}>
          <div
            className={`absolute ${heightClasses[size]} ${colorClasses[color]} rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={disabled}
          className={`
            absolute top-0 left-0 w-full opacity-0 cursor-pointer
            ${disabled ? "cursor-not-allowed" : ""}
          `}
          style={{ height: "100%" }}
        />

        <div
          className={`
            absolute top-1/2 -translate-y-1/2
            ${thumbSizes[size]} ${colorClasses[color]} rounded-full
            border-2 border-white shadow-md
            ${disabled ? "opacity-50" : ""}
            transition-all
          `}
          style={{ left: `calc(${percentage}% - ${size === "sm" ? "8px" : size === "md" ? "10px" : "12px"})` }}
        />
      </div>

      {showMinMax && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">{min}</span>
          <span className="text-xs text-gray-500">{max}</span>
        </div>
      )}
    </div>
  );
}

// Range slider (two values)
export function RangeSlider({
  minValue = 0,
  maxValue = 100,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled = false,
}: {
  minValue?: number;
  maxValue?: number;
  onChange?: (min: number, max: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
}) {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax);
    setLocalMin(newMin);
    onChange?.(newMin, localMax);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin);
    setLocalMax(newMax);
    onChange?.(localMin, newMax);
  };

  const minPercentage = ((localMin - min) / (max - min)) * 100;
  const maxPercentage = ((localMax - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm font-medium text-gray-900">
            {localMin} - {localMax}
          </span>
        </div>
      )}

      <div className="relative h-2">
        <div className="absolute h-2 bg-gray-200 rounded-full w-full" />
        <div
          className="absolute h-2 bg-blue-600 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute w-full opacity-0 cursor-pointer"
          style={{ height: "100%" }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute w-full opacity-0 cursor-pointer"
          style={{ height: "100%" }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md"
          style={{ left: `calc(${minPercentage}% - 10px)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md"
          style={{ left: `calc(${maxPercentage}% - 10px)` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">{min}</span>
        <span className="text-xs text-gray-500">{max}</span>
      </div>
    </div>
  );
}

// Stepped slider with labels
export function SteppedSlider({
  value = 0,
  onChange,
  steps,
  label,
  disabled = false,
}: {
  value?: number;
  onChange?: (value: number) => void;
  steps: Array<{ value: number; label: string }>;
  label?: string;
  disabled?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const currentStep = steps.find((s) => s.value === localValue) || steps[0];
  const min = Math.min(...steps.map((s) => s.value));
  const max = Math.max(...steps.map((s) => s.value));

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm font-medium text-gray-900">{currentStep.label}</span>
        </div>
      )}

      <div className="relative">
        <div className="relative h-2 bg-gray-200 rounded-full">
          <div
            className="absolute h-2 bg-blue-600 rounded-full"
            style={{
              width: `${((localValue - min) / (max - min)) * 100}%`,
            }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={steps.length > 1 ? (max - min) / (steps.length - 1) : 1}
          value={localValue}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            const closest = steps.reduce((prev, curr) =>
              Math.abs(curr.value - newValue) < Math.abs(prev.value - newValue) ? curr : prev
            );
            handleChange(closest.value);
          }}
          disabled={disabled}
          className="absolute top-0 left-0 w-full opacity-0 cursor-pointer h-full"
        />

        {steps.map((step) => {
          const percentage = ((step.value - min) / (max - min)) * 100;
          return (
            <div
              key={step.value}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${percentage}%` }}
            >
              <div
                className={`w-3 h-3 rounded-full border-2 border-white ${
                  step.value === localValue ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2">
        {steps.map((step) => (
          <span key={step.value} className="text-xs text-gray-500">
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

