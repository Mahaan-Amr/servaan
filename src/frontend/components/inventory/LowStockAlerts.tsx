'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryStatus } from '../../../shared/types';
import { getLowStockItems } from '../../services/inventoryService';

interface LowStockAlertsProps {
  limit?: number;
  showTitle?: boolean;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ 
  limit = 5,
  showTitle = true
}) => {
  const [lowStockItems, setLowStockItems] = useState<InventoryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        setLoading(true);
        const data = await getLowStockItems();
        
        // If a limit is provided, only show that many items
        const limitedData = limit > 0 ? data.slice(0, limit) : data;
        setLowStockItems(limitedData);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching low stock items:', error);
        setError('خطا در دریافت اقلام کم موجود');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
  }, [limit]);

  // Early return for loading state
  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-lg">
        {error}
      </div>
    );
  }

  // If no low stock items are found
  if (lowStockItems.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            هشدار موجودی کم
          </h3>
        )}
        <p className="text-green-600 dark:text-green-400">
          همه اقلام موجودی کافی دارند!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {showTitle && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            هشدار موجودی کم
          </h3>
          <Link 
            href="/workspaces/inventory-management/inventory" 
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            نمایش همه
          </Link>
        </div>
      )}
      
      <div className="space-y-3">
        {lowStockItems.map((item) => (
          <div 
            key={item.itemId} 
            className="p-3 border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.itemName}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.category}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-red-600 dark:text-red-400">
                  {item.current} {item.unit}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  موجودی فعلی
                </span>
              </div>
            </div>
            
            <div className="mt-2 flex space-x-2 rtl:space-x-reverse">
              <Link 
                href={`/workspaces/inventory-management/inventory/add?itemId=${item.itemId}`}
                className="text-xs py-1 px-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors flex-1 text-center"
              >
                ورود کالا
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 