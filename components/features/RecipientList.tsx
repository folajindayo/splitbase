/**
 * Recipient List Component
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface Recipient {
  address: string;
  percentage: number;
}

interface RecipientListProps {
  recipients: Recipient[];
  onRemove?: (index: number) => void;
}

export const RecipientList: React.FC<RecipientListProps> = ({ 
  recipients, 
  onRemove 
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Recipients ({recipients.length})
      </Text>
      <ScrollView className="max-h-60">
        {recipients.map((recipient, index) => (
          <View
            key={index}
            className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700"
          >
            <View className="flex-1">
              <Text className="font-mono text-sm text-gray-900 dark:text-white">
                {formatAddress(recipient.address)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {recipient.percentage}%
              </Text>
            </View>
            {onRemove && (
              <Pressable
                onPress={() => onRemove(index)}
                className="ml-2 px-3 py-1 bg-red-500 rounded"
              >
                <Text className="text-white text-sm">Remove</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

