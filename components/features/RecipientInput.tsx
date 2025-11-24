/**
 * Recipient Input Component
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

interface Recipient {
  address: string;
  percentage: number;
}

interface RecipientInputProps {
  onRecipientAdd: (recipient: Recipient) => void;
}

export const RecipientInput: React.FC<RecipientInputProps> = ({ onRecipientAdd }) => {
  const [address, setAddress] = useState('');
  const [percentage, setPercentage] = useState('');

  const handleAdd = () => {
    if (address && percentage) {
      onRecipientAdd({
        address,
        percentage: parseFloat(percentage),
      });
      setAddress('');
      setPercentage('');
    }
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Add Recipient
      </Text>
      
      <View className="mb-3">
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Wallet Address
        </Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="0x..."
          placeholderTextColor="#9CA3AF"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
        />
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Percentage
        </Text>
        <TextInput
          value={percentage}
          onChangeText={setPercentage}
          placeholder="0.0"
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
          className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
        />
      </View>

      <Pressable
        onPress={handleAdd}
        className="bg-blue-500 rounded-lg py-3 items-center"
      >
        <Text className="text-white font-medium">Add Recipient</Text>
      </Pressable>
    </View>
  );
};


