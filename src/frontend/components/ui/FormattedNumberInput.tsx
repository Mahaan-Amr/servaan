'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FormattedNumberInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number | string; // Reserved for future use
  label?: string;
  error?: string;
  required?: boolean;
  allowDecimals?: boolean;
  dir?: 'ltr' | 'rtl';
}

/**
 * Formatted Number Input Component
 * 
 * Provides real-time number formatting with thousand separators (commas)
 * as the user types. Supports both integer and decimal numbers.
 * 
 * Example:
 * - User types: 1000 → displays: 1,000
 * - User types: 10000 → displays: 10,000
 * - User types: 1234567 → displays: 1,234,567
 */
export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value = '',
  onChange,
  placeholder = '',
  className = '',
  disabled = false,
  min,
  max,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  step: _step, // Reserved for future use
  label,
  error,
  required = false,
  allowDecimals = true,
  dir = 'ltr'
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with thousand separators
  const formatNumber = React.useCallback((num: string | number): string => {
    if (num === '' || num === null || num === undefined) return '';
    
    // Convert to string and remove all non-digit characters except decimal point
    let cleanValue = String(num).replace(/[^\d.-]/g, '');
    
    // Handle negative sign
    const isNegative = cleanValue.startsWith('-');
    if (isNegative) {
      cleanValue = cleanValue.substring(1);
    }
    
    // Split by decimal point
    const parts = cleanValue.split('.');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1] || '';
    
    // Format integer part with thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine parts
    let formatted = isNegative ? '-' : '';
    formatted += formattedInteger;
    if (allowDecimals && decimalPart) {
      formatted += '.' + decimalPart;
    }
    
    return formatted;
  }, [allowDecimals]);

  // Parse formatted number back to numeric string (removes commas)
  const parseNumber = (formatted: string): string => {
    // Remove all commas and keep only digits, decimal point, and minus sign
    return formatted.replace(/,/g, '').replace(/[^\d.-]/g, '');
  };

  // Initialize display value from prop
  useEffect(() => {
    const parsed = parseNumber(String(value || ''));
    const formatted = formatNumber(parsed);
    setDisplayValue(formatted);
  }, [value, formatNumber]);

  // Restore cursor position after formatting
  useEffect(() => {
    if (cursorPosition !== null && inputRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (inputRef.current) {
          // Calculate new cursor position after formatting
          // Count commas that were added before the cursor position
          const beforeCursor = displayValue.substring(0, cursorPosition);
          const commasBeforeCursor = (beforeCursor.match(/,/g) || []).length;
          
          // Adjust cursor position: if we had commas removed, we need to account for them
          // The cursor position should move forward by the number of commas added
          let newPosition = cursorPosition;
          
          // Count commas in the original position range
          const originalText = inputRef.current.value || '';
          const beforeOriginalCursor = originalText.substring(0, Math.min(cursorPosition, originalText.length));
          const originalCommas = (beforeOriginalCursor.match(/,/g) || []).length;
          
          // Adjust based on comma difference
          newPosition = cursorPosition + (commasBeforeCursor - originalCommas);
          
          // Ensure cursor doesn't go beyond input length
          const safePosition = Math.min(Math.max(0, newPosition), displayValue.length);
          
          inputRef.current.setSelectionRange(safePosition, safePosition);
          setCursorPosition(null);
        }
      });
    }
  }, [displayValue, cursorPosition]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Save cursor position before formatting
    setCursorPosition(cursorPos);
    
    // Parse the input (remove commas)
    const parsed = parseNumber(inputValue);
    
    // Validate numeric value
    if (parsed === '' || parsed === '-') {
      setDisplayValue(parsed);
      onChange('');
      return;
    }
    
    // Check if it's a valid number
    const numValue = allowDecimals ? parseFloat(parsed) : parseInt(parsed, 10);
    
    if (isNaN(numValue)) {
      // Invalid number, keep previous value
      return;
    }
    
    // Apply min/max constraints
    let constrainedValue = numValue;
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max;
    }
    
    // Format the value
    const formatted = formatNumber(constrainedValue.toString());
    setDisplayValue(formatted);
    
    // Call onChange with the numeric string (without commas)
    onChange(constrainedValue.toString());
  };

  // Handle blur - ensure value is properly formatted
  const handleBlur = () => {
    const parsed = parseNumber(displayValue);
    if (parsed === '' || parsed === '-') {
      setDisplayValue('');
      onChange('');
      return;
    }
    
    const numValue = allowDecimals ? parseFloat(parsed) : parseInt(parsed, 10);
    if (!isNaN(numValue)) {
      const formatted = formatNumber(numValue.toString());
      setDisplayValue(formatted);
      onChange(numValue.toString());
    }
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${
          required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''
        }`}>
          {label}
        </label>
      )}

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        dir={dir}
        className={`
          w-full px-3 py-2 border rounded-lg shadow-sm
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          transition-all duration-200
          ${error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
            : 'hover:border-blue-400 dark:hover:border-blue-500'
          }
        `}
      />

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FormattedNumberInput;

