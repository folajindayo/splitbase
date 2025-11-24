/**
 * Split Summary Component
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface Recipient {
  address: string;
  percentage: number;
  amount?: string;
}

interface SplitSummaryProps {
  totalAmount: string;
  token: {
    symbol: string;
    decimals: number;
  };
  recipients: Recipient[];
}

export const SplitSummary: React.FC<SplitSummaryProps> = ({
  totalAmount,
  token,
  recipients,
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const calculateAmount = (percentage: number) => {
    const total = parseFloat(totalAmount);
    return ((total * percentage) / 100).toFixed(4);
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Split Summary
      </Text>

      <View className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600 dark:text-gray-400">Total Amount:</Text>
          <Text className="font-semibold text-gray-900 dark:text-white">
            {totalAmount} {token.symbol}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-600 dark:text-gray-400">Recipients:</Text>
          <Text className="font-semibold text-gray-900 dark:text-white">
            {recipients.length}
          </Text>
        </View>
      </View>

      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Distribution:
      </Text>
      <ScrollView className="max-h-60">
        {recipients.map((recipient, index) => (
          <View
            key={index}
            className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
          >
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">
                {formatAddress(recipient.address)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {recipient.percentage}%
              </Text>
            </View>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              {calculateAmount(recipient.percentage)} {token.symbol}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};


