/**
 * SplitCard Component
 */

'use client';

interface Split {
  address: string;
  recipients: Array<{ address: string; percentage: number }>;
  totalReceived: string;
}

interface SplitCardProps {
  split: Split;
}

export function SplitCard({ split }: SplitCardProps) {
  return (
    <div className="p-6 border rounded-lg">
      <div className="mb-4">
        <p className="text-sm text-gray-500">Contract Address</p>
        <p className="font-mono text-sm">{split.address}</p>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-500">Total Received</p>
        <p className="text-xl font-bold">{split.totalReceived} ETH</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Recipients</p>
        <div className="space-y-2">
          {split.recipients.map((recipient) => (
            <div key={recipient.address} className="flex justify-between text-sm">
              <span className="font-mono">{recipient.address.slice(0, 8)}...</span>
              <span className="font-medium">{recipient.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

