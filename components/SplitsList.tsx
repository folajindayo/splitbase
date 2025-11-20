/**
 * SplitsList Component
 */

'use client';

import { useSplits } from '../hooks/useSplits';
import { SplitCard } from './SplitCard';

interface SplitsListProps {
  ownerAddress: string;
}

export function SplitsList({ ownerAddress }: SplitsListProps) {
  const { splits, loading, error } = useSplits(ownerAddress);

  if (loading) {
    return <div className="text-center py-8">Loading splits...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (splits.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No splits found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Splits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {splits.map((split) => (
          <SplitCard key={split.address} split={{
            address: split.address,
            recipients: split.recipients,
            totalReceived: '0',
          }} />
        ))}
      </div>
    </div>
  );
}

