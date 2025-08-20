import React from 'react';
import { useForm } from '../../hooks/useForm';
import { FormField } from './FormField';
import { 
  EnhancedFormProps, 
  FormFieldOption 
} from '../../types/forms';

/**
 * Comprehensive form component that integrates with our form system
 * Provides consistent behavior and styling across all forms
 */
export function Form<T extends Record<string, unknown>>({
  config,
  onSubmit,
  onReset,
  lifecycle,
  showValidationErrors = true,
  autoSave = false,
  autoSaveDelay = 3000,
  className = '',
  disabled = false,
  loading = false
}: EnhancedFormProps<T>) {
  
  // Use our custom form hook
  const form = useForm<T>(config.initialValues, config.validation, lifecycle);

  // Auto-save functionality
  React.useEffect(() => {
    if (autoSave && form.isDirty) {
      const timer = setTimeout(() => {
        // Auto-save without submission
        if (lifecycle?.onFieldChange) {
          lifecycle.onFieldChange({
            field: 'auto-save',
            value: form.values,
            previousValue: config.initialValues,
            type: 'change',
            timestamp: Date.now()
          });
        }
      }, autoSaveDelay);

      return () => clearTimeout(timer);
    }
  }, [form.values, form.isDirty, autoSave, autoSaveDelay, lifecycle, config.initialValues]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || loading || form.isSubmitting) {
      return;
    }

    try {
      await form.submit(onSubmit);
    } catch (error) {
      // Error handling is done in the form hook
      console.error('Form submission error:', error);
    }
  };

  // Handle form reset
  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    form.reset();
    if (onReset) {
      onReset();
    }
  };

  // Render form fields
  const renderFields = () => {
    const { fields, layout = 'vertical', columns = 1, spacing = 'md' } = config;
    
    const spacingClasses = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    };

    const layoutClasses = {
      vertical: 'space-y-4',
      horizontal: 'grid grid-cols-1 md:grid-cols-2 gap-4',
      grid: `grid grid-cols-1 md:grid-cols-${columns} gap-4`
    };

    return (
      <div className={`${layoutClasses[layout]} ${spacingClasses[spacing]}`}>
        {fields.map((field) => {
          // Check if field should be shown based on conditional logic
          if (field.conditional && !field.conditional(form.values)) {
            return null;
          }

          // Get field value
          const fieldValue = form.values[field.name as keyof T];
          
          // Get field error
          const fieldError = form.getError(field.name as keyof T);
          
          // Check if field is touched
          const fieldTouched = form.isTouched(field.name as keyof T);

          // Transform options if they exist
          const fieldOptions: FormFieldOption[] = field.options?.map(option => ({
            value: option.value,
            label: option.label,
            disabled: option.disabled || false,
            group: option.group
          })) || [];

          return (
            <FormField
              key={field.id}
              name={field.name}
              label={field.label}
              type={field.type}
              value={fieldValue}
              onChange={(value) => form.handleChange(field.name as keyof T, value)}
              onBlur={() => form.handleBlur(field.name as keyof T)}
              onFocus={() => form.handleFocus(field.name as keyof T)}
              error={fieldError}
              touched={fieldTouched}
              required={field.required}
              placeholder={field.placeholder}
              helpText={field.helpText}
              options={fieldOptions}
              disabled={disabled || field.disabled}
              hidden={field.hidden}
              className={field.inputClassName}
            />
          );
        })}
      </div>
    );
  };

  // Render form buttons
  const renderButtons = () => {
    const { submitButton, resetButton } = config;
    
    return (
      <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
        {resetButton?.show !== false && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || loading || form.isSubmitting}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors ${
              resetButton?.className || ''
            }`}
          >
            {resetButton?.text || 'بازنشانی'}
          </button>
        )}
        
        <button
          type="submit"
          disabled={disabled || loading || form.isSubmitting || !form.isValid}
          className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            submitButton?.className || ''
          }`}
        >
          {form.isSubmitting 
            ? (submitButton?.loadingText || 'در حال ذخیره...') 
            : (submitButton?.text || 'ذخیره')
          }
        </button>
      </div>
    );
  };

  // Render validation summary
  const renderValidationSummary = () => {
    if (!showValidationErrors || form.isValid) {
      return null;
    }

    const errorCount = Object.keys(form.errors).length;
    
    return (
      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorCount} خطا در فرم وجود دارد
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(form.errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {/* Validation Summary */}
      {renderValidationSummary()}

      {/* Form Fields */}
      {renderFields()}

      {/* Form Buttons */}
      {renderButtons()}

      {/* Auto-save indicator */}
      {autoSave && form.isDirty && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          تغییرات به صورت خودکار ذخیره می‌شوند
        </div>
      )}
    </form>
  );
}
