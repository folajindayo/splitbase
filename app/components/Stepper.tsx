/**
 * Stepper Component
 * Multi-step progress indicator
 */

interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "numbered" | "icon";
  clickable?: boolean;
}

export default function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  variant = "default",
  clickable = false,
}: StepperProps) {
  const isStepComplete = (index: number) => index < currentStep;
  const isStepCurrent = (index: number) => index === currentStep;
  const isStepClickable = (index: number) => clickable && (isStepComplete(index) || isStepCurrent(index));

  const handleStepClick = (index: number) => {
    if (isStepClickable(index)) {
      onStepClick?.(index);
    }
  };

  if (orientation === "vertical") {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const complete = isStepComplete(index);
          const current = isStepCurrent(index);
          const clickable = isStepClickable(index);

          return (
            <div key={index} className="flex gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!clickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium
                    ${complete ? "bg-blue-600 text-white" : ""}
                    ${current ? "bg-blue-600 text-white ring-4 ring-blue-100" : ""}
                    ${!complete && !current ? "bg-gray-200 text-gray-600" : ""}
                    ${clickable ? "cursor-pointer hover:scale-105" : "cursor-default"}
                    transition-all
                  `}
                >
                  {complete ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      complete ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-8">
                <h3
                  className={`font-medium ${
                    current ? "text-blue-600" : complete ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </h3>
                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const complete = isStepComplete(index);
          const current = isStepCurrent(index);
          const clickable = isStepClickable(index);

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!clickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium
                    ${complete ? "bg-blue-600 text-white" : ""}
                    ${current ? "bg-blue-600 text-white ring-4 ring-blue-100" : ""}
                    ${!complete && !current ? "bg-gray-200 text-gray-600" : ""}
                    ${clickable ? "cursor-pointer hover:scale-105" : "cursor-default"}
                    transition-all
                  `}
                >
                  {variant === "icon" && step.icon ? (
                    step.icon
                  ) : complete ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      current ? "text-blue-600" : complete ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 -mt-12">
                  <div className={`h-full ${complete ? "bg-blue-600" : "bg-gray-200"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple step indicator
export function SimpleSteps({
  total,
  current,
  size = "md",
}: {
  total: number;
  current: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} rounded-full
            ${i === current ? "bg-blue-600" : i < current ? "bg-blue-400" : "bg-gray-200"}
            transition-colors
          `}
        />
      ))}
    </div>
  );
}

// Progress stepper
export function ProgressStepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-gray-600">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">{steps[currentStep]}</p>
    </div>
  );
}

