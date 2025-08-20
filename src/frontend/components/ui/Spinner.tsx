import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', className = '' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 border-2';
      case 'large':
        return 'w-8 h-8 border-4';
      default:
        return 'w-6 h-6 border-3';
    }
  };

  return (
    <div className={`spinner rounded-full ${getSizeClass()} ${className}`} />
  );
}; 