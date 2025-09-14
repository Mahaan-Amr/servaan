/**
 * Centralized Currency Utilities for Toman Standardization
 * 
 * This utility provides consistent currency handling across the entire application.
 * All prices are stored and handled in Toman (Iranian currency unit).
 * 
 * Key Principles:
 * - All database values are in Toman
 * - All calculations are in Toman
 * - All displays use Toman formatting
 * - No Rial conversion needed (everything is already in Toman)
 */

export interface CurrencyFormatOptions {
  includeCurrency?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
}

export interface CurrencyValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * Default currency configuration
 */
export const CURRENCY_CONFIG = {
  // Primary currency unit
  UNIT: 'TOMAN' as const,
  
  // Currency symbol and display
  SYMBOL: 'تومان',
  SYMBOL_EN: 'Toman',
  
  // Locale settings
  LOCALE: 'fa-IR',
  
  // Decimal precision
  DECIMAL_PLACES: 0, // Toman typically doesn't use decimals
  
  // Tax rates (in percentage)
  TAX_RATES: {
    VAT: 9, // 9% VAT in Iran
    SERVICE_CHARGE: 10, // 10% service charge for restaurants
  },
  
  // Validation limits
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 999999999999, // 999 billion Toman
} as const;

/**
 * Validate currency amount
 */
export function validateCurrencyAmount(amount: unknown): CurrencyValidationResult {
  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return {
      isValid: false,
      value: 0,
      error: 'Amount cannot be null or undefined'
    };
  }

  // Convert to number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  
  // Check if valid number
  if (isNaN(numericAmount)) {
    return {
      isValid: false,
      value: 0,
      error: 'Amount must be a valid number'
    };
  }

  // Check range
  if (numericAmount < CURRENCY_CONFIG.MIN_AMOUNT) {
    return {
      isValid: false,
      value: numericAmount,
      error: `Amount must be at least ${CURRENCY_CONFIG.MIN_AMOUNT} Toman`
    };
  }

  if (numericAmount > CURRENCY_CONFIG.MAX_AMOUNT) {
    return {
      isValid: false,
      value: numericAmount,
      error: `Amount cannot exceed ${CURRENCY_CONFIG.MAX_AMOUNT} Toman`
    };
  }

  return {
    isValid: true,
    value: Math.round(numericAmount) // Round to nearest Toman
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: unknown, 
  options: CurrencyFormatOptions = {}
): string {
  const {
    includeCurrency = true,
    minimumFractionDigits = CURRENCY_CONFIG.DECIMAL_PLACES,
    maximumFractionDigits = CURRENCY_CONFIG.DECIMAL_PLACES,
    locale = CURRENCY_CONFIG.LOCALE
  } = options;

  // Validate amount
  const validation = validateCurrencyAmount(amount);
  if (!validation.isValid) {
    return includeCurrency ? `۰ ${CURRENCY_CONFIG.SYMBOL}` : '۰';
  }

  try {
    // Format number with Persian locale
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(validation.value);

    return includeCurrency ? `${formattedNumber} ${CURRENCY_CONFIG.SYMBOL}` : formattedNumber;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return includeCurrency ? `۰ ${CURRENCY_CONFIG.SYMBOL}` : '۰';
  }
}

/**
 * Format currency for input fields (without currency symbol)
 */
export function formatCurrencyForInput(amount: unknown): string {
  return formatCurrency(amount, { includeCurrency: false });
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbols and Persian digits
  let cleanString = currencyString
    .replace(/[تومانریال]/g, '') // Remove currency symbols
    .replace(/[۰-۹]/g, (match) => {
      // Convert Persian digits to English
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return persianDigits.indexOf(match).toString();
    })
    .replace(/[^\d.-]/g, '') // Remove all non-numeric characters except . and -
    .trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number = CURRENCY_CONFIG.TAX_RATES.VAT): number {
  const validation = validateCurrencyAmount(amount);
  if (!validation.isValid) return 0;
  
  return Math.round((validation.value * taxRate) / 100);
}

/**
 * Calculate service charge
 */
export function calculateServiceCharge(amount: number, serviceRate: number = CURRENCY_CONFIG.TAX_RATES.SERVICE_CHARGE): number {
  const validation = validateCurrencyAmount(amount);
  if (!validation.isValid) return 0;
  
  return Math.round((validation.value * serviceRate) / 100);
}

/**
 * Calculate order totals with Iranian tax standards
 */
export function calculateOrderTotals(
  subtotal: number, 
  discountAmount: number = 0,
  options: {
    taxRate?: number;
    serviceChargeRate?: number;
  } = {}
): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
} {
  const {
    taxRate = CURRENCY_CONFIG.TAX_RATES.VAT,
    serviceChargeRate = CURRENCY_CONFIG.TAX_RATES.SERVICE_CHARGE
  } = options;

  // Validate inputs
  const subtotalValidation = validateCurrencyAmount(subtotal);
  const discountValidation = validateCurrencyAmount(discountAmount);
  
  if (!subtotalValidation.isValid) {
    throw new Error(`Invalid subtotal: ${subtotalValidation.error}`);
  }
  
  if (!discountValidation.isValid) {
    throw new Error(`Invalid discount amount: ${discountValidation.error}`);
  }

  const discountedSubtotal = Math.max(0, subtotalValidation.value - discountValidation.value);
  const taxAmount = calculateTax(discountedSubtotal, taxRate);
  const serviceCharge = calculateServiceCharge(discountedSubtotal, serviceChargeRate);
  const totalAmount = discountedSubtotal + taxAmount + serviceCharge;

  return {
    subtotal: subtotalValidation.value,
    discountAmount: discountValidation.value,
    taxAmount,
    serviceCharge,
    totalAmount
  };
}

/**
 * Convert Persian numbers to English
 */
export function persianToEnglishNumbers(text: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return text.replace(/[۰-۹]/g, (match) => {
    return persianDigits.indexOf(match).toString();
  });
}

/**
 * Convert English numbers to Persian
 */
export function englishToPersianNumbers(text: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return text.replace(/\d/g, (digit) => {
    return persianDigits[parseInt(digit)];
  });
}

/**
 * Format number with Persian locale (without currency)
 */
export function formatNumber(number: unknown, locale: string = CURRENCY_CONFIG.LOCALE): string {
  const validation = validateCurrencyAmount(number);
  if (!validation.isValid) {
    return '۰';
  }

  try {
    return new Intl.NumberFormat(locale).format(validation.value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '۰';
  }
}

/**
 * Currency utility object for easy access
 */
export const CurrencyUtils = {
  // Core functions
  validate: validateCurrencyAmount,
  format: formatCurrency,
  formatForInput: formatCurrencyForInput,
  parse: parseCurrency,
  
  // Calculation functions
  calculateTax,
  calculateServiceCharge,
  calculateOrderTotals,
  
  // Number formatting
  formatNumber,
  persianToEnglish: persianToEnglishNumbers,
  englishToPersian: englishToPersianNumbers,
  
  // Configuration
  config: CURRENCY_CONFIG,
} as const;

export default CurrencyUtils;
