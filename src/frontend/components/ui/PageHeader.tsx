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
    <div className={`ui-page-header ${className}`}>
      <div className="min-w-0">
        <h1 className="ui-page-header__title">{title}</h1>
        {description && (
          <p className="ui-page-header__description">{description}</p>
        )}
      </div>

      {actionButtonText && onActionButtonClick && (
        <button
          onClick={onActionButtonClick}
          className="btn btn-primary inline-flex items-center gap-2 whitespace-nowrap"
        >
          <FaPlus size={14} />
          {actionButtonText}
        </button>
      )}
    </div>
  );
} 
