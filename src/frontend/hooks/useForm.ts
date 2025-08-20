import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FormValidator, 
  FormSubmitHandler, 
  FormValidationResult,
  FormFieldChangeEvent,
  FormLifecycleEvents
} from '../types/forms';

/**
 * Custom form hook that provides comprehensive form management
 * Maintains backward compatibility while adding advanced features
 */
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  validation?: FormValidator<T>,
  lifecycle?: FormLifecycleEvents
) {
  // Form state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Refs for tracking changes
  const initialValuesRef = useRef<T>(initialValues);
  const lastValidationRef = useRef<FormValidationResult | null>(null);

  // Update initial values when they change
  useEffect(() => {
    initialValuesRef.current = initialValues;
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setDirty({});
    setFocused({});
    setIsFormDirty(false);
    setIsValid(true);
  }, [initialValues]);

  // Validate form when values change
  useEffect(() => {
    if (validation) {
      const result = validation(values);
      lastValidationRef.current = result;
      
      const newErrors: Record<string, string> = {};
      result.errors.forEach(error => {
        newErrors[error.field] = error.message;
      });
      
      setErrors(newErrors);
      setIsValid(result.isValid);
      
      if (lifecycle?.onValidationComplete) {
        lifecycle.onValidationComplete(result);
      }
    }
  }, [values, validation, lifecycle]);

  // Check if form is dirty
  useEffect(() => {
    const newIsDirty = Object.keys(dirty).some(key => dirty[key]);
    setIsFormDirty(newIsDirty);
    
    if (lifecycle?.onDirtyChange) {
      lifecycle.onDirtyChange(newIsDirty);
    }
  }, [dirty, lifecycle]);

  // Check if form is valid
  useEffect(() => {
    if (lifecycle?.onValidChange) {
      lifecycle.onValidChange(isValid);
    }
  }, [isValid, lifecycle]);

  // Set single field value
  const setValue = useCallback((field: keyof T, value: unknown) => {
    const previousValue = values[field];
    
    setValues(prev => ({ ...prev, [field]: value }));
    setDirty(prev => ({ ...prev, [field]: value !== initialValuesRef.current[field] }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear field error when value changes
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
    
    // Trigger lifecycle event
    if (lifecycle?.onFieldChange) {
      const event: FormFieldChangeEvent = {
        field: field as string,
        value,
        previousValue,
        type: 'change',
        timestamp: Date.now()
      };
      lifecycle.onFieldChange(event);
    }
  }, [values, errors, lifecycle]);

  // Set multiple field values
  const setMultipleValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => {
      const updated = { ...prev, ...newValues };
      
      // Update dirty state for changed fields
      const newDirty = { ...dirty };
      Object.keys(newValues).forEach(key => {
        newDirty[key] = newValues[key as keyof T] !== initialValuesRef.current[key as keyof T];
      });
      setDirty(newDirty);
      
      return updated;
    });
  }, [dirty]);

  // Set field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Set multiple field errors
  const setMultipleErrors = useCallback((newErrors: Record<string, string>) => {
    setErrors(newErrors);
  }, []);

  // Set field touched state
  const setFieldTouched = useCallback((field: keyof T, touched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: touched }));
  }, []);

  // Set all fields touched state
  const setAllFieldsTouched = useCallback((touched: boolean) => {
    const allFields = Object.keys(values as Record<string, unknown>);
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = touched;
    });
    setTouched(newTouched);
  }, [values]);

  // Set field focused state
  const setFieldFocused = useCallback((field: keyof T, focused: boolean) => {
    setFocused(prev => ({ ...prev, [field]: focused }));
    
    if (lifecycle?.onFieldFocus) {
      lifecycle.onFieldFocus(field as string, values[field]);
    }
  }, [values, lifecycle]);

  // Validate single field
  const validateField = useCallback((field: keyof T): boolean => {
    if (!validation) return true;
    
    const result = validation(values);
    const fieldError = result.errors.find(error => error.field === field);
    
    if (fieldError) {
      setFieldError(field, fieldError.message);
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      return true;
    }
  }, [validation, values, setFieldError]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    if (!validation) return true;
    
    if (lifecycle?.onValidationStart) {
      lifecycle.onValidationStart();
    }
    
    const result = validation(values);
    lastValidationRef.current = result;
    
    const newErrors: Record<string, string> = {};
    result.errors.forEach(error => {
      newErrors[error.field] = error.message;
    });
    
    setErrors(newErrors);
    setIsValid(result.isValid);
    
    if (lifecycle?.onValidationComplete) {
      lifecycle.onValidationComplete(result);
    }
    
    return result.isValid;
  }, [validation, values, lifecycle]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear single field error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setDirty({});
    setFocused({});
    setIsFormDirty(false);
    setIsValid(true);
    
    if (lifecycle?.onReset) {
      lifecycle.onReset();
    }
  }, [lifecycle]);

  // Submit form
  const submit = useCallback(async (submitHandler?: FormSubmitHandler<T>) => {
    if (!validate()) {
      return;
    }
    
    if (lifecycle?.onSubmitStart) {
      lifecycle.onSubmitStart();
    }
    
    setIsSubmitting(true);
    
    try {
      if (submitHandler) {
        await submitHandler(values);
      }
      
      if (lifecycle?.onSubmitComplete) {
        lifecycle.onSubmitComplete({
          success: true,
          data: values,
          message: 'Form submitted successfully'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed';
      
      if (lifecycle?.onSubmitComplete) {
        lifecycle.onSubmitComplete({
          success: false,
          message: errorMessage
        });
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, lifecycle]);

  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
    
    if (lifecycle?.onFieldBlur) {
      lifecycle.onFieldBlur(field as string, values[field]);
    }
  }, [setTouched, validateField, values, lifecycle]);

  // Handle field focus
  const handleFocus = useCallback((field: keyof T) => {
    setFieldFocused(field, true);
  }, [setFieldFocused]);

  // Handle field change
  const handleChange = useCallback((field: keyof T, value: unknown) => {
    setValue(field, value);
  }, [setValue]);

  // Check if field has error
  const hasError = useCallback((field: keyof T): boolean => {
    return !!errors[field as string];
  }, [errors]);

  // Get field error
  const getError = useCallback((field: keyof T): string | undefined => {
    return errors[field as string];
  }, [errors]);

  // Check if field is touched
  const isTouched = useCallback((field: keyof T): boolean => {
    return !!touched[field as string];
  }, [touched]);

  // Check if field is dirty
  const isFieldDirty = useCallback((field: keyof T): boolean => {
    return !!dirty[field as string];
  }, [dirty]);

  // Check if field is focused
  const isFocused = useCallback((field: keyof T): boolean => {
    return !!focused[field as string];
  }, [focused]);

  return {
    // State
    values,
    errors,
    touched,
    dirty,
    focused,
    isSubmitting,
    isValid,
    isDirty: isFormDirty,
    
    // Actions
    setValue,
    setValues: setMultipleValues,
    setError: setFieldError,
    setErrors: setMultipleErrors,
    setTouched: setFieldTouched,
    setTouchedAll: setAllFieldsTouched,
    setFocused: setFieldFocused,
    reset,
    submit,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    
    // Event handlers
    handleChange,
    handleBlur,
    handleFocus,
    
    // Utility functions
    hasError,
    getError,
    isTouched,
    isFieldDirty,
    isFocused
  };
}
