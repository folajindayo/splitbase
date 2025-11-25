/**
 * RecipientItem Component
 */

'use client';

interface RecipientItemProps {
  address: string;
  share: number;
  ensName?: string;
  onRemove?: () => void;
}

export function RecipientItem({ address, share, ensName, onRemove }: RecipientItemProps) {
  const displayAddress = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{displayAddress}</p>
        <p className="text-xs text-gray-500">{address}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-gray-900">{share}%</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

