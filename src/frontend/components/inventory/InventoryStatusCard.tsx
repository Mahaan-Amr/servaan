'use client';

import React from 'react';
import Link from 'next/link';
import { InventoryStatus } from '../../../shared/types';

interface InventoryStatusCardProps {
  item: InventoryStatus;
  threshold?: number;
}

export const InventoryStatusCard: React.FC<InventoryStatusCardProps> = ({ 
  item, 
  threshold = 10 
}) => {
  // Determine status color based on current inventory
  const getStatusColor = () => {
    if (item.current <= 0) {
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
    } else if (item.current < threshold) {
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
    } else {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.itemName}</h3>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full mt-1 inline-block mb-2 
            bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
            {item.category}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {item.current} {item.unit}
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>ورودی کل:</span>
          <span className="font-medium">{item.totalIn} {item.unit}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>خروجی کل:</span>
          <span className="font-medium">{item.totalOut} {item.unit}</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between space-x-2 rtl:space-x-reverse">
        <Link 
          href={`/inventory/add?itemId=${item.itemId}`}
          className="flex-1 text-center py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          ورود کالا
        </Link>
        <Link
          href={`/inventory/remove?itemId=${item.itemId}`}
          className={`flex-1 text-center py-2 px-3 text-sm font-medium rounded-md transition-colors
            ${item.current > 0 
              ? 'bg-secondary-500 hover:bg-secondary-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
          aria-disabled={item.current <= 0}
        >
          خروج کالا
        </Link>
      </div>
    </div>
  );
}; 