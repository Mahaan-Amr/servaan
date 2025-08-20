import { PrismaClient } from '../../../shared/generated/client';

/**
 * Generate unique order number for the tenant
 * Format: ORD-YYYYMMDD-NNNN (e.g., ORD-20241201-0001)
 */
export async function generateOrderNumber(tenantId: string, prisma: any): Promise<string> {
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                  (today.getMonth() + 1).toString().padStart(2, '0') + 
                  today.getDate().toString().padStart(2, '0');
  
  const prefix = `ORD-${dateStr}-`;
  
  // Find the last order number for today
  const lastOrder = await prisma.order.findFirst({
    where: {
      tenantId,
      orderNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      orderNumber: 'desc'
    },
    select: {
      orderNumber: true
    }
  });

  let sequenceNumber = 1;
  
  if (lastOrder) {
    const lastSequence = lastOrder.orderNumber.split('-').pop();
    sequenceNumber = parseInt(lastSequence || '0') + 1;
  }

  return `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
}

/**
 * Generate payment number
 * Format: PAY-YYYYMMDD-NNNN (e.g., PAY-20241201-0001)
 */
export async function generatePaymentNumber(tenantId: string, prisma: any): Promise<string> {
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                  (today.getMonth() + 1).toString().padStart(2, '0') + 
                  today.getDate().toString().padStart(2, '0');
  
  const prefix = `PAY-${dateStr}-`;
  
  // Find the last payment number for today
  const lastPayment = await prisma.orderPayment.findFirst({
    where: {
      tenantId,
      paymentNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      paymentNumber: 'desc'
    },
    select: {
      paymentNumber: true
    }
  });

  let sequenceNumber = 1;
  
  if (lastPayment) {
    const lastSequence = lastPayment.paymentNumber.split('-').pop();
    sequenceNumber = parseInt(lastSequence || '0') + 1;
  }

  return `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
}

/**
 * Calculate order totals with Iranian tax standards
 */
export function calculateOrderTotals(subtotal: number, discountAmount: number = 0) {
  const discountedSubtotal = subtotal - discountAmount;
  const taxRate = 0.09; // 9% VAT in Iran
  const serviceChargeRate = 0.10; // 10% service charge for restaurants
  
  const taxAmount = discountedSubtotal * taxRate;
  const serviceCharge = discountedSubtotal * serviceChargeRate;
  const totalAmount = discountedSubtotal + taxAmount + serviceCharge;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    serviceCharge,
    totalAmount
  };
}

/**
 * Format order number for display (Persian numbers)
 */
export function formatOrderNumberForDisplay(orderNumber: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return orderNumber.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Convert English numbers to Persian
 */
export function toPersianNumbers(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Convert Persian numbers to English
 */
export function toEnglishNumbers(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return str.replace(/[۰-۹]/g, (digit) => {
    const index = persianDigits.indexOf(digit);
    return englishDigits[index];
  });
}

/**
 * Validate Iranian phone number
 */
export function validateIranianPhoneNumber(phone: string): boolean {
  const cleanPhone = toEnglishNumbers(phone.replace(/\s|-/g, ''));
  
  // Iranian mobile numbers: 09XXXXXXXXX
  // Iranian landline: 0XXXXXXXXXX
  const mobilePattern = /^09\d{9}$/;
  const landlinePattern = /^0\d{10}$/;
  
  return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone);
}

/**
 * Format price for display in Iranian Rial
 */
export function formatPrice(amount: number, includeCurrency: boolean = true): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
  return includeCurrency ? `${formatted} ریال` : formatted;
}

/**
 * Calculate estimated preparation time based on order items
 */
export function calculateEstimatedPrepTime(orderItems: Array<{
  quantity: number;
  prepTime?: number;
}>): number {
  let totalTime = 0;
  let maxItemTime = 0;

  for (const item of orderItems) {
    const itemPrepTime = item.prepTime || 15; // Default 15 minutes
    const itemTotalTime = Math.ceil(itemPrepTime * Math.log(item.quantity + 1)); // Logarithmic scaling
    
    totalTime += itemTotalTime;
    maxItemTime = Math.max(maxItemTime, itemTotalTime);
  }

  // Use a weighted average: 60% total time + 40% max item time
  // This accounts for parallel preparation while considering bottlenecks
  const estimatedTime = Math.ceil((totalTime * 0.6) + (maxItemTime * 0.4));
  
  // Round to nearest 5 minutes and ensure minimum of 10 minutes
  return Math.max(10, Math.ceil(estimatedTime / 5) * 5);
}

/**
 * Get order status color for UI
 */
export function getOrderStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'DRAFT': 'gray',
    'PENDING': 'yellow',
    'CONFIRMED': 'blue',
    'PREPARING': 'orange',
    'READY': 'purple',
    'SERVED': 'green',
    'COMPLETED': 'green',
    'CANCELLED': 'red',
    'REFUNDED': 'red'
  };
  
  return statusColors[status] || 'gray';
}

/**
 * Get order priority label in Persian
 */
export function getOrderPriorityLabel(priority: number): string {
  if (priority >= 3) return 'بالا';
  if (priority >= 2) return 'متوسط';
  return 'عادی';
}

/**
 * Validate order timing constraints
 */
export function validateOrderTiming(orderData: {
  orderType: string;
  tableId?: string;
  estimatedTime?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Dine-in orders must have a table
  if (orderData.orderType === 'DINE_IN' && !orderData.tableId) {
    errors.push('Dine-in orders require a table assignment');
  }

  // Estimated time should be reasonable (5-120 minutes)
  if (orderData.estimatedTime && (orderData.estimatedTime < 5 || orderData.estimatedTime > 120)) {
    errors.push('Estimated preparation time must be between 5 and 120 minutes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 