/**
 * AmountInput Component
 */

'use client';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  token?: string;
  label?: string;
  error?: string;
}

export function AmountInput({
  value,
  onChange,
  token = 'ETH',
  label = 'Amount',
  error,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0"
          className={`w-full px-4 py-3 pr-16 border rounded-lg ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="text-gray-500 font-medium">{token}</span>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

