import React from 'react';
import { Supplier } from '../types';
import { FaEdit, FaTrash, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEye } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: () => void;
  onDelete: () => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onEdit, onDelete }) => {
  const router = useRouter();
  
  const handleViewDetails = () => {
    router.push(`/suppliers/${supplier.id}`);
  };

  return (
    <div className={`card card-hover ${!supplier.isActive ? 'opacity-60' : ''} cursor-pointer transition-all duration-200 hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{supplier.name}</h3>
          {supplier.contactName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {supplier.contactName}
            </p>
          )}
        </div>
        {!supplier.isActive && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            غیرفعال
          </span>
        )}
      </div>
      
      <div className="space-y-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
        {supplier.email && (
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-gray-400" />
            <span>{supplier.email}</span>
          </div>
        )}
        
        {supplier.phoneNumber && (
          <div className="flex items-center gap-2">
            <FaPhone className="text-gray-400" />
            <span dir="ltr">{supplier.phoneNumber}</span>
          </div>
        )}
        
        {supplier.address && (
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-gray-400" />
            <span>{supplier.address}</span>
          </div>
        )}
      </div>
      
      {supplier.notes && (
        <div className="mb-4 text-sm border-t border-gray-100 dark:border-gray-700 pt-2">
          <p className="text-gray-500 dark:text-gray-400 line-clamp-2">{supplier.notes}</p>
        </div>
      )}
      
      <div className="flex items-center justify-end space-x-2 space-x-reverse">
        <button
          onClick={handleViewDetails}
          className="p-2 text-primary-600 hover:bg-primary-50 rounded-full dark:text-primary-400 dark:hover:bg-primary-900/30"
          title="مشاهده جزئیات"
        >
          <FaEye />
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full dark:text-blue-400 dark:hover:bg-blue-900/30"
          title="ویرایش"
        >
          <FaEdit />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full dark:text-red-400 dark:hover:bg-red-900/30"
          title="حذف"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}; 