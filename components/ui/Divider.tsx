/**
 * Divider Component
 */

'use client';

import React from 'react';
import { View, Text } from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  text?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  text,
  className = '',
}) => {
  if (text) {
    return (
      <View className={`flex items-center my-4 ${className}`}>
        <View className="flex-1 border-t border-gray-300" />
        <Text className="px-4 text-sm text-gray-500 bg-white">{text}</Text>
        <View className="flex-1 border-t border-gray-300" />
      </View>
    );
  }

  return (
    <View
      className={`${
        orientation === 'horizontal'
          ? 'w-full border-t border-gray-300'
          : 'h-full border-l border-gray-300'
      } ${className}`}
    />
  );
};

