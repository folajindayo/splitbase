/**
 * IconButton Component
 */

'use client';

interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const SIZES = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export function IconButton({
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${VARIANTS[variant]}
        ${SIZES[size]}
        rounded-lg
        flex items-center justify-center
        transition
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {icon}
    </button>
  );
}

