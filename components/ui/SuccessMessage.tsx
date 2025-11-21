/**
 * SuccessMessage Component
 */

'use client';

interface SuccessMessageProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SuccessMessage({ title, message, action }: SuccessMessageProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="text-xl font-bold text-green-900 mb-2">{title}</h3>
      {message && <p className="text-green-700 mb-4">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

