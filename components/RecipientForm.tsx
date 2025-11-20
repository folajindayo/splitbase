/**
 * RecipientForm Component
 */

'use client';

import { Recipient } from '../lib/utils/split-calculator';
import { Input } from './ui/Input';

interface RecipientFormProps {
  recipient: Recipient;
  index: number;
  onUpdate: (index: number, field: keyof Recipient, value: any) => void;
  onRemove: (index: number) => void;
}

export function RecipientForm({ recipient, index, onUpdate, onRemove }: RecipientFormProps) {
  return (
    <div className="flex gap-4 items-start">
      <Input
        label="Address"
        placeholder="0x..."
        value={recipient.address}
        onChange={(e) => onUpdate(index, 'address', e.target.value)}
        className="flex-1"
      />
      <Input
        label="Percentage"
        type="number"
        min="0"
        max="100"
        value={recipient.percentage}
        onChange={(e) => onUpdate(index, 'percentage', parseFloat(e.target.value))}
        className="w-24"
      />
      <button
        onClick={() => onRemove(index)}
        className="mt-7 px-3 py-2 text-red-600 hover:bg-red-50 rounded"
      >
        Remove
      </button>
    </div>
  );
}

