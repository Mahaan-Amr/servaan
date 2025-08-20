import React from 'react';
import { FaPlus } from 'react-icons/fa';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actionButtonText,
  onActionButtonClick,
  className = ''
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {actionButtonText && onActionButtonClick && (
        <button
          onClick={onActionButtonClick}
          className="mt-4 md:mt-0 btn btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <FaPlus size={14} />
          {actionButtonText}
        </button>
      )}
    </div>
  );
} 