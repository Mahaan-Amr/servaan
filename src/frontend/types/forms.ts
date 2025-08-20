// Form Type Definitions for Frontend Components
// Standardizes form validation and submission types across the application

// ===================== BASE FORM TYPES =====================

/**
 * Base form validation error structure
 */
export interface FormValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'custom' | 'server';
  code?: string;
}

/**
 * Form submission state management
 */
export interface FormSubmissionState {
  isSubmitting: boolean;
  errors: FormValidationError[];
  success: boolean;
  message?: string;
}

/**
 * Base form field configuration
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
  disabled?: boolean;
  hidden?: boolean;
}

/**
 * Form field validation rules
 */
export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | null;
}

/**
 * Form field option for select/radio/checkbox
 */
export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

// ===================== FORM VALIDATION TYPES =====================

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings?: string[];
}

/**
 * Form validation function type
 */
export type FormValidator<T> = (data: T) => FormValidationResult;

/**
 * Field validation function type
 */
export type FieldValidator = (value: unknown, fieldName: string) => string | null;

// ===================== FORM SUBMISSION TYPES =====================

/**
 * Form submission handler type
 */
export type FormSubmitHandler<T> = (data: T) => Promise<void> | void;

/**
 * Form submission result
 */
export interface FormSubmissionResult {
  success: boolean;
  data?: unknown;
  errors?: FormValidationError[];
  message?: string;
  redirectTo?: string;
}

/**
 * Form reset handler type
 */
export type FormResetHandler = () => void;

// ===================== FORM STATE TYPES =====================

/**
 * Form field state
 */
export interface FormFieldState {
  value: unknown;
  error?: string;
  touched: boolean;
  dirty: boolean;
  focused: boolean;
}

/**
 * Complete form state
 */
export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  focused: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// ===================== FORM HOOK TYPES =====================

/**
 * Form hook return type
 */
export interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  setTouchedAll: (touched: boolean) => void;
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => boolean;
}

// ===================== SPECIFIC FORM TYPES =====================

/**
 * Customer form data structure
 */
export interface CustomerFormData extends Record<string, unknown> {
  phone: string;
  name: string;
  nameEnglish?: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  notes?: string;
  preferredContactMethod: 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  allowMarketing: boolean;
}

/**
 * Item form data structure
 */
export interface ItemFormData extends Record<string, unknown> {
  name: string;
  category: string;
  unit: string;
  minStock?: number;
  description?: string;
  barcode?: string;
  image?: string;
  isActive: boolean;
}

/**
 * Supplier form data structure
 */
export interface SupplierFormData extends Record<string, unknown> {
  name: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * User form data structure
 */
export interface UserFormData extends Record<string, unknown> {
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  phoneNumber?: string;
  isActive: boolean;
}

// ===================== FORM COMPONENT PROPS =====================

/**
 * Base form component props
 */
export interface BaseFormProps<T> {
  initialValues: T;
  onSubmit: FormSubmitHandler<T>;
  onReset?: FormResetHandler;
  validation?: FormValidator<T>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Form field component props
 */
export interface FormFieldProps {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  value?: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FormFieldOption[];
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
}

// ===================== ENHANCED FORM TYPES =====================

/**
 * Enhanced form field with advanced configuration
 */
export interface EnhancedFormField extends FormFieldConfig {
  id: string;
  className?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helpTextClassName?: string;
  dependencies?: string[]; // Fields this field depends on
  conditional?: (values: Record<string, unknown>) => boolean; // Show/hide based on other values
  transform?: (value: unknown) => unknown; // Transform value before submission
  format?: (value: unknown) => string; // Format value for display
  parse?: (value: string) => unknown; // Parse value from display format
}

/**
 * Enhanced form configuration
 */
export interface EnhancedFormConfig<T> {
  fields: EnhancedFormField[];
  validation: FormValidator<T>;
  initialValues: T;
  submitButton?: {
    text: string;
    className?: string;
    loadingText?: string;
  };
  resetButton?: {
    text: string;
    className?: string;
    show?: boolean;
  };
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  spacing?: 'sm' | 'md' | 'lg';
}

/**
 * Form field change event
 */
export interface FormFieldChangeEvent {
  field: string;
  value: unknown;
  previousValue: unknown;
  type: 'change' | 'blur' | 'focus';
  timestamp: number;
}

/**
 * Form lifecycle events
 */
export interface FormLifecycleEvents {
  onFieldChange?: (event: FormFieldChangeEvent) => void;
  onFieldBlur?: (field: string, value: unknown) => void;
  onFieldFocus?: (field: string, value: unknown) => void;
  onValidationStart?: () => void;
  onValidationComplete?: (result: FormValidationResult) => void;
  onSubmitStart?: () => void;
  onSubmitComplete?: (result: FormSubmissionResult) => void;
  onReset?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onValidChange?: (isValid: boolean) => void;
}

/**
 * Enhanced form props with lifecycle events
 */
export interface EnhancedFormProps<T> extends BaseFormProps<T> {
  config: EnhancedFormConfig<T>;
  lifecycle?: FormLifecycleEvents;
  showValidationErrors?: boolean;
  showFieldErrors?: boolean;
  showSuccessMessage?: boolean;
  autoFocus?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * Form field validation context
 */
export interface FormFieldValidationContext {
  field: string;
  value: unknown;
  values: Record<string, unknown>;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
}

/**
 * Form validation context
 */
export interface FormValidationContext<T> {
  values: T;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
}

/**
 * Form submission context
 */
export interface FormSubmissionContext<T> {
  values: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  submit: () => Promise<void>;
  reset: () => void;
  setSubmitting: (submitting: boolean) => void;
}

/**
 * Complete form context
 */
export interface FormContext<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  focused: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  setTouchedAll: (touched: boolean) => void;
  setFocused: (field: keyof T, focused: boolean) => void;
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
}
