import React from 'react';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

interface AlertBoxProps {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  className?: string;
  onClose?: () => void;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ 
  type, 
  message, 
  className = '',
  onClose 
}) => {
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-50 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500 dark:text-green-400" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500 dark:text-blue-400" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400" />;
      case 'error':
        return <FaTimesCircle className="text-red-500 dark:text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-lg p-4 ${getTypeClasses()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="mr-3 text-sm">
          {message}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mr-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-400 hover:bg-blue-200 inline-flex items-center justify-center h-8 w-8"
          >
            <span className="sr-only">بستن</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}; 