import { FormValidationResult, FormValidationError } from '../types/forms';

/**
 * Form validation utility functions
 * Provides common validation patterns for form fields
 */
export class FormValidation {
  
  /**
   * Required field validation
   */
  static required(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} الزامی است`;
    }
    return null;
  }

  /**
   * String length validation
   */
  static minLength(value: string, minLength: number, fieldName: string): string | null {
    if (value && value.length < minLength) {
      return `${fieldName} باید حداقل ${minLength} کاراکتر باشد`;
    }
    return null;
  }

  static maxLength(value: string, maxLength: number, fieldName: string): string | null {
    if (value && value.length > maxLength) {
      return `${fieldName} نمی‌تواند بیشتر از ${maxLength} کاراکتر باشد`;
    }
    return null;
  }

  /**
   * Number range validation
   */
  static min(value: number, min: number, fieldName: string): string | null {
    if (value < min) {
      return `${fieldName} نمی‌تواند کمتر از ${min} باشد`;
    }
    return null;
  }

  static max(value: number, max: number, fieldName: string): string | null {
    if (value > max) {
      return `${fieldName} نمی‌تواند بیشتر از ${max} باشد`;
    }
    return null;
  }

  /**
   * Email validation
   */
  static email(value: string, fieldName: string): string | null {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${fieldName} معتبر نیست`;
    }
    return null;
  }

  /**
   * Phone number validation (Iranian format)
   */
  static phoneNumber(value: string, fieldName: string): string | null {
    if (value && !/^(\+98|98|0)?9\d{9}$/.test(value.replace(/\s/g, ''))) {
      return `${fieldName} معتبر نیست`;
    }
    return null;
  }

  /**
   * Barcode validation (13 digits)
   */
  static barcode(value: string, fieldName: string): string | null {
    if (value && !/^\d{13}$/.test(value)) {
      return `${fieldName} باید ۱۳ رقم باشد`;
    }
    return null;
  }

  /**
   * URL validation
   */
  static url(value: string, fieldName: string): string | null {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return `${fieldName} معتبر نیست`;
    }
    return null;
  }

  /**
   * Date validation
   */
  static date(value: string, fieldName: string): string | null {
    if (value && isNaN(Date.parse(value))) {
      return `${fieldName} معتبر نیست`;
    }
    return null;
  }

  /**
   * Future date validation
   */
  static futureDate(value: string, fieldName: string): string | null {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        return `${fieldName} باید در آینده باشد`;
      }
    }
    return null;
  }

  /**
   * Past date validation
   */
  static pastDate(value: string, fieldName: string): string | null {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      if (date >= now) {
        return `${fieldName} باید در گذشته باشد`;
      }
    }
    return null;
  }

  /**
   * Pattern validation using regex
   */
  static pattern(value: string, pattern: RegExp, fieldName: string, message?: string): string | null {
    if (value && !pattern.test(value)) {
      return message || `${fieldName} فرمت صحیح ندارد`;
    }
    return null;
  }

  /**
   * Custom validation function
   */
  static custom(value: unknown, validator: (value: unknown) => string | null, fieldName: string): string | null {
    return validator(value);
  }

  /**
   * Conditional validation
   */
  static conditional(
    value: unknown, 
    condition: boolean, 
    validator: (value: unknown, fieldName: string) => string | null, 
    fieldName: string
  ): string | null {
    if (condition) {
      return validator(value, fieldName);
    }
    return null;
  }

  /**
   * Combine multiple validations
   */
  static combine(
    value: unknown, 
    fieldName: string, 
    validators: Array<(value: unknown, fieldName: string) => string | null>
  ): string | null {
    for (const validator of validators) {
      const error = validator(value, fieldName);
      if (error) {
        return error;
      }
    }
    return null;
  }

  /**
   * Create validation result
   */
  static createResult(isValid: boolean, errors: FormValidationError[]): FormValidationResult {
    return {
      isValid,
      errors,
      warnings: []
    };
  }

  /**
   * Create validation error
   */
  static createError(field: string, message: string, type: 'required' | 'invalid' | 'custom' | 'server' = 'invalid', code?: string): FormValidationError {
    return {
      field,
      message,
      type,
      code
    };
  }

  /**
   * Validate object with field-specific rules
   */
  static validateObject<T extends Record<string, unknown>>(
    data: T,
    rules: Record<keyof T, Array<(value: unknown, fieldName: string) => string | null>>
  ): FormValidationResult {
    const errors: FormValidationError[] = [];

    for (const [field, validators] of Object.entries(rules)) {
      const value = data[field];
      const fieldName = field as string;

      for (const validator of validators) {
        const error = validator(value, fieldName);
        if (error) {
          errors.push(this.createError(fieldName, error));
          break; // Stop validating this field after first error
        }
      }
    }

    return this.createResult(errors.length === 0, errors);
  }

  /**
   * Validate specific fields
   */
  static validateFields<T extends Record<string, unknown>>(
    data: T,
    fields: Array<keyof T>,
    rules: Record<keyof T, Array<(value: unknown, fieldName: string) => string | null>>
  ): FormValidationResult {
    const errors: FormValidationError[] = [];

    for (const field of fields) {
      if (rules[field]) {
        const value = data[field];
        const fieldName = field as string;

        for (const validator of rules[field]) {
          const error = validator(value, fieldName);
          if (error) {
            errors.push(this.createError(fieldName, error));
            break; // Stop validating this field after first error
          }
        }
      }
    }

    return this.createResult(errors.length === 0, errors);
  }
}

/**
 * Predefined validation rules for common field types
 */
export const ValidationRules = {
  /**
   * Required field rule
   */
  required: (fieldName: string) => (value: unknown) => FormValidation.required(value, fieldName),

  /**
   * Email field rule
   */
  email: (fieldName: string) => (value: unknown) => FormValidation.email(value as string, fieldName),

  /**
   * Phone number field rule
   */
  phoneNumber: (fieldName: string) => (value: unknown) => FormValidation.phoneNumber(value as string, fieldName),

  /**
   * Barcode field rule
   */
  barcode: (fieldName: string) => (value: unknown) => FormValidation.barcode(value as string, fieldName),

  /**
   * String length rules
   */
  minLength: (minLength: number, fieldName: string) => (value: unknown) => FormValidation.minLength(value as string, minLength, fieldName),
  maxLength: (maxLength: number, fieldName: string) => (value: unknown) => FormValidation.maxLength(value as string, maxLength, fieldName),

  /**
   * Number range rules
   */
  min: (min: number, fieldName: string) => (value: unknown) => FormValidation.min(value as number, min, fieldName),
  max: (max: number, fieldName: string) => (value: unknown) => FormValidation.max(value as number, max, fieldName),

  /**
   * Date rules
   */
  date: (fieldName: string) => (value: unknown) => FormValidation.date(value as string, fieldName),
  futureDate: (fieldName: string) => (value: unknown) => FormValidation.futureDate(value as string, fieldName),
  pastDate: (fieldName: string) => (value: unknown) => FormValidation.pastDate(value as string, fieldName),

  /**
   * Pattern rule
   */
  pattern: (pattern: RegExp, fieldName: string, message?: string) => (value: unknown) => FormValidation.pattern(value as string, pattern, fieldName, message)
};
