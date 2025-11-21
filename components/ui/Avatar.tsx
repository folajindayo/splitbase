/**
 * Avatar Component
 */

'use client';

import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'lg':
        return 'w-16 h-16 text-xl';
      case 'xl':
        return 'w-24 h-24 text-3xl';
      default:
        return 'w-12 h-12 text-base';
    }
  };

  const getFallbackInitials = () => {
    if (fallback) return fallback.substring(0, 2).toUpperCase();
    if (alt) return alt.substring(0, 2).toUpperCase();
    return '??';
  };

  return (
    <View className={`${getSizeStyles()} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}>
      {src ? (
        <Image
          source={{ uri: src }}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <Text className="font-semibold text-gray-600">
          {getFallbackInitials()}
        </Text>
      )}
    </View>
  );
};

