/**
 * Copy Button Component
 */

'use client';

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface CopyButtonProps {
  text: string;
  label?: string;
  successMessage?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  successMessage = 'Copied!',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Pressable
      onPress={handleCopy}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <View className="flex items-center gap-2">
        {copied ? (
          <>
            <Text>✓</Text>
            <Text>{successMessage}</Text>
          </>
        ) : (
          <>
            <Text>📋</Text>
            <Text>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
};
