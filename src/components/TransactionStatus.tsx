/**
 * TransactionStatus Component
 */

'use client';

interface TransactionStatusProps {
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
  explorerUrl?: string;
}

const STATUS_CONFIG = {
  pending: {
    icon: '⏳',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Processing...',
  },
  success: {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Completed',
  },
  failed: {
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Failed',
  },
};

export function TransactionStatus({ status, txHash, explorerUrl }: TransactionStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`p-4 rounded-lg ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <p className={`font-medium ${config.color}`}>{config.label}</p>
          {txHash && explorerUrl && status === 'success' && (
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View on Explorer →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

