/**
 * CreateSplitForm Component
 */

'use client';

import { useState } from 'react';
import { useSplitContext } from '../contexts/SplitContext';
import { RecipientForm } from './RecipientForm';
import { SplitValidator } from '../lib/validation/split.validator';

export function CreateSplitForm() {
  const { recipients, addRecipient, removeRecipient, updateRecipient } = useSplitContext();
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const validationErrors = SplitValidator.validateRecipients(recipients);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create split
    console.log('Creating split:', recipients);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create New Split</h2>
      
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          {errors.map((error, i) => (
            <p key={i} className="text-red-800 text-sm">{error}</p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {recipients.map((recipient, index) => (
          <RecipientForm
            key={index}
            recipient={recipient}
            index={index}
            onUpdate={updateRecipient}
            onRemove={removeRecipient}
          />
        ))}
      </div>

      <button
        onClick={addRecipient}
        className="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Add Recipient
      </button>

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create Split
      </button>
    </div>
  );
}

