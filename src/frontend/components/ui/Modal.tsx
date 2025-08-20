import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  disableClickOutside?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  title, 
  onClose, 
  children, 
  size = 'medium',
  disableClickOutside = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'max-w-md';
      case 'large':
        return 'max-w-3xl';
      default:
        return 'max-w-xl';
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    if (disableClickOutside) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, disableClickOutside]);

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`w-full ${getSizeClass()} bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden`}
      >
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="بستن"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}; 