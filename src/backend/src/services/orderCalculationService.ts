import { PrismaClient } from '../../../shared/generated/client';

const prisma = new PrismaClient();

export interface OrderCalculation {
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
  serviceAmount: number;
  servicePercentage: number;
  courierAmount: number;
  totalAmount: number;
  breakdown: {
    subtotal: number;
    discount: number;
    tax: number;
    service: number;
    courier: number;
    total: number;
  };
}

export interface OrderOptions {
  discountEnabled: boolean;
  discountType: 'PERCENTAGE' | 'AMOUNT';
  discountValue: number;
  taxEnabled: boolean;
  taxPercentage: number;
  serviceEnabled: boolean;
  servicePercentage: number;
  courierEnabled: boolean;
  courierAmount: number;
  courierNotes?: string;
}

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number | any; // Allow Decimal type from database
  totalPrice: number | any; // Allow Decimal type from database
  modifiers?: any[] | any; // Allow JsonValue type from database
  specialRequest?: string | null; // Allow null from database
}

export interface BusinessPreset {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  discountEnabled: boolean;
  discountType: string;
  discountValue: number;
  taxEnabled: boolean;
  taxPercentage: number;
  serviceEnabled: boolean;
  servicePercentage: number;
  courierEnabled: boolean;
  courierAmount: number;
  createdAt: Date;
}

export class OrderCalculationService {
  /**
   * Calculate order total with options
   * Order: Subtotal → Discount → Tax → Service → Courier → Total
   */
  static calculateOrderTotal(orderItems: OrderItem[], options: OrderOptions): OrderCalculation {
    // Calculate subtotal - convert Decimal to number
    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    
    // Apply discount to subtotal
    let discountAmount = 0;
    if (options.discountEnabled && options.discountValue > 0) {
      if (options.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * options.discountValue) / 100;
      } else {
        discountAmount = Math.min(options.discountValue, subtotal); // Prevent negative
      }
    }
    
    // Calculate amount after discount
    const amountAfterDiscount = subtotal - discountAmount;
    
    // Apply tax
    let taxAmount = 0;
    if (options.taxEnabled && options.taxPercentage > 0) {
      taxAmount = (amountAfterDiscount * options.taxPercentage) / 100;
    }
    
    // Apply service charge
    let serviceAmount = 0;
    if (options.serviceEnabled && options.servicePercentage > 0) {
      serviceAmount = (amountAfterDiscount * options.servicePercentage) / 100;
    }
    
    // Add courier
    const courierAmount = options.courierEnabled ? options.courierAmount : 0;
    
    // Calculate total
    const totalAmount = amountAfterDiscount + taxAmount + serviceAmount + courierAmount;
    
    return {
      subtotal,
      discountAmount,
      discountPercentage: options.discountType === 'PERCENTAGE' ? options.discountValue : 0,
      taxAmount,
      taxPercentage: options.taxPercentage,
      serviceAmount,
      servicePercentage: options.servicePercentage,
      courierAmount,
      totalAmount,
      breakdown: {
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        service: serviceAmount,
        courier: courierAmount,
        total: totalAmount
      }
    };
  }

  /**
   * Get default options for new order
   */
  static getDefaultOptions(): OrderOptions {
    return {
      discountEnabled: false,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      taxEnabled: true,
      taxPercentage: 9.00,
      serviceEnabled: true,
      servicePercentage: 10.00,
      courierEnabled: false,
      courierAmount: 0,
      courierNotes: ''
    };
  }

  /**
   * Apply preset to options
   */
  static applyPreset(options: OrderOptions, preset: BusinessPreset): OrderOptions {
    return {
      ...options,
      discountEnabled: preset.discountEnabled,
      discountType: preset.discountType as 'PERCENTAGE' | 'AMOUNT',
      discountValue: preset.discountValue,
      taxEnabled: preset.taxEnabled,
      taxPercentage: preset.taxPercentage,
      serviceEnabled: preset.serviceEnabled,
      servicePercentage: preset.servicePercentage,
      courierEnabled: preset.courierEnabled,
      courierAmount: preset.courierAmount
    };
  }

  /**
   * Validate order options
   */
  static validateOrderOptions(options: OrderOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate discount
    if (options.discountEnabled) {
      if (options.discountValue < 0) {
        errors.push('مقدار تخفیف نمی‌تواند منفی باشد');
      }
      if (options.discountType === 'PERCENTAGE' && options.discountValue > 100) {
        errors.push('درصد تخفیف نمی‌تواند بیشتر از 100% باشد');
      }
    }

    // Validate tax
    if (options.taxEnabled) {
      if (options.taxPercentage < 0 || options.taxPercentage > 100) {
        errors.push('درصد مالیات باید بین 0 تا 100 باشد');
      }
    }

    // Validate service
    if (options.serviceEnabled) {
      if (options.servicePercentage < 0 || options.servicePercentage > 100) {
        errors.push('درصد خدمات باید بین 0 تا 100 باشد');
      }
    }

    // Validate courier
    if (options.courierEnabled) {
      if (options.courierAmount < 0) {
        errors.push('مبلغ پیک نمی‌تواند منفی باشد');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  /**
   * Get calculation summary for display
   */
  static getCalculationSummary(calculation: OrderCalculation): {
    subtotal: string;
    discount: string;
    tax: string;
    service: string;
    courier: string;
    total: string;
  } {
    return {
      subtotal: this.formatPrice(calculation.subtotal),
      discount: calculation.discountAmount > 0 ? `-${this.formatPrice(calculation.discountAmount)}` : '0',
      tax: this.formatPrice(calculation.taxAmount),
      service: this.formatPrice(calculation.serviceAmount),
      courier: this.formatPrice(calculation.courierAmount),
      total: this.formatPrice(calculation.totalAmount)
    };
  }
} 
