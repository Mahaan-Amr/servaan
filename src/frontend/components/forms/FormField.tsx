import React from 'react';
import { FormFieldProps } from '../../types/forms';

/**
 * Reusable form field component
 * Provides consistent styling and behavior across all forms
 */
export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  touched,
  required,
  placeholder,
  helpText,
  options = [],
  disabled = false,
  hidden = false,
  className = ''
}) => {
  // Don't render if hidden
  if (hidden) {
    return null;
  }

  // Generate unique ID for the field
  const fieldId = `field-${name}`;
  const errorId = `error-${name}`;
  const helpId = `help-${name}`;

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (onChange) {
      const newValue = type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value;
      onChange(newValue);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  // Render input based on type
  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      disabled,
      className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
        error && touched 
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
          : 'border-gray-300 dark:border-gray-600'
      } ${
        disabled 
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
      } ${className}`,
      'aria-describedby': `${helpId} ${error && touched ? errorId : ''}`.trim(),
      'aria-invalid': (error && touched) as boolean,
      'aria-required': required as boolean
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            placeholder={placeholder}
            value={String(value || '')}
          />
        );

      case 'select':
        return (
          <select {...commonProps} value={String(value || '')}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={!!value}
            value=""
            className={`w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${className}`}
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <input
                  {...commonProps}
                  type="radio"
                  value={String(option.value)}
                  checked={value === option.value}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            placeholder={placeholder}
            value={String(value || '')}
          />
        );

      case 'tel':
        return (
          <input
            {...commonProps}
            type="tel"
            placeholder={placeholder}
            dir="ltr"
            value={String(value || '')}
          />
        );

      case 'email':
        return (
          <input
            {...commonProps}
            type="email"
            placeholder={placeholder}
            dir="ltr"
            value={String(value || '')}
          />
        );

      case 'password':
        return (
          <input
            {...commonProps}
            type="password"
            placeholder={placeholder}
            value={String(value || '')}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            placeholder={placeholder}
            dir="ltr"
            value={String(value || '')}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            placeholder={placeholder}
            value={String(value || '')}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      {/* Label */}
      {label && (
        <label
          htmlFor={fieldId}
          className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${
            required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''
          }`}
        >
          {label}
        </label>
      )}

      {/* Input */}
      {renderInput()}

      {/* Help Text */}
      {helpText && (
        <p
          id={helpId}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {error && touched && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
