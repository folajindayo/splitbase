/**
 * SplitSummary Component
 */

'use client';

interface SplitSummaryProps {
  recipientsCount: number;
  totalAmount: string;
  totalShare: number;
  fees: {
    platform: string;
    gas: string;
  };
}

export function SplitSummary({ recipientsCount, totalAmount, totalShare, fees }: SplitSummaryProps) {
  const isValid = totalShare === 100;

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <h3 className="font-bold text-lg text-gray-900">Summary</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Recipients</span>
          <span className="font-medium">{recipientsCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-medium">{totalAmount} ETH</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total Share</span>
          <span className={isValid ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
            {totalShare}%
          </span>
        </div>

        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee (1%)</span>
            <span>{fees.platform} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Est. Gas</span>
            <span>{fees.gas} ETH</span>
          </div>
        </div>
      </div>

      {!isValid && (
        <p className="text-sm text-red-600">
          ⚠️ Total share must equal 100%
        </p>
      )}
    </div>
  );
}

