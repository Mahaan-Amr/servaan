import React from 'react';
import { InventoryEntry, InventoryEntryType } from '../../../shared/types';
import Link from 'next/link';
import { formatDate } from '../../utils/dateUtils';

interface InventoryTransactionCardProps {
  entry: InventoryEntry;
  showActions?: boolean;
  onDelete?: (entryId: string) => void;
}

export const InventoryTransactionCard: React.FC<InventoryTransactionCardProps> = ({
  entry,
  showActions = false,
  onDelete
}) => {
  const isIncoming = entry.type === InventoryEntryType.IN;

  // Format the date with a utility function (implement this separately)
  const formattedDate = formatDate(entry.createdAt);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{entry.item?.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.item?.category}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isIncoming 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {isIncoming ? 'ورود به انبار' : 'خروج از انبار'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">مقدار:</span>
          <p className="font-medium">{entry.quantity} {entry.item?.unit}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ:</span>
          <p className="font-medium">{formattedDate}</p>
        </div>
        {entry.unitPrice && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">قیمت واحد:</span>
            <p className="font-medium">{entry.unitPrice.toLocaleString()} تومان</p>
          </div>
        )}
        {entry.batchNumber && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">شماره بچ:</span>
            <p className="font-medium">{entry.batchNumber}</p>
          </div>
        )}
        {entry.expiryDate && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ انقضا:</span>
            <p className="font-medium">{formatDate(entry.expiryDate)}</p>
          </div>
        )}
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">کاربر:</span>
          <p className="font-medium">{entry.user?.name || 'نامشخص'}</p>
        </div>
      </div>

      {entry.note && (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-sm text-gray-500 dark:text-gray-400">یادداشت:</span>
          <p className="text-sm">{entry.note}</p>
        </div>
      )}
      
      {showActions && (
        <div className="mt-4 flex justify-end space-x-2 rtl:space-x-reverse">
          <Link 
            href={`/inventory/transactions/${entry.id}`}
            className="px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            مشاهده جزئیات
          </Link>
          
          {onDelete && (
            <button 
              onClick={() => onDelete(entry.id)}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              حذف
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 