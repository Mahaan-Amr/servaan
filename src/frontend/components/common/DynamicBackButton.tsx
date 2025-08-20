'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DynamicBackButtonProps {
  defaultUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DynamicBackButton({ 
  defaultUrl = '/workspaces/inventory-management', 
  className = "px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors",
  children = "بازگشت"
}: DynamicBackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push(defaultUrl);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={className}
    >
      {children}
    </button>
  );
} 