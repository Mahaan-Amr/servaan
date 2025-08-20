'use client';

import React from 'react';
import type { OrderCalculation, OrderOptions } from '../../../../../services/orderingService';

interface ReceiptTemplateProps {
  orderNumber: string;
  orderDate: Date;
  orderItems: Array<{
    id: string;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  calculation: OrderCalculation;
  options: OrderOptions;
  paymentData: {
    paymentMethod: 'CASH' | 'CARD';
    amountReceived: number;
    notes?: string;
  };
  businessInfo: {
    name: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
}

export default function ReceiptTemplate({
  orderNumber,
  orderDate,
  orderItems,
  calculation,
  paymentData,
  businessInfo
}: ReceiptTemplateProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handlePrint = () => {
    // Create a completely new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('لطفاً popup blocker را غیرفعال کنید');
      return;
    }

    // Generate the complete HTML document for printing
    const printDocument = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رسید سفارش</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 8px;
            line-height: 1.1;
            margin: 0;
            padding: 2px;
            background: white;
            direction: rtl;
            text-align: right;
            width: 80mm;
            max-width: 80mm;
            height: auto;
            min-height: auto;
            page-break-after: avoid;
            page-break-inside: avoid;
            overflow: hidden;
          }
          
          .receipt {
            width: 100%;
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            height: auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 4px;
          }
          
          .header h1 {
            font-size: 10px;
            font-weight: bold;
            margin: 1px 0;
          }
          
          .header p {
            font-size: 8px;
            margin: 0.5px 0;
          }
          
          .order-details {
            border-top: 1px solid #ccc;
            padding-top: 2px;
            margin-bottom: 4px;
          }
          
          .order-details div {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            margin: 0.5px 0;
          }
          
          .items {
            margin-bottom: 4px;
          }
          
          .items-header {
            border-bottom: 1px solid #ccc;
            padding-bottom: 1px;
            margin-bottom: 2px;
          }
          
          .items-grid {
            display: grid;
            grid-template-columns: 6fr 2fr 2fr 2fr;
            font-size: 8px;
            font-weight: bold;
          }
          
          .item-row {
            display: grid;
            grid-template-columns: 6fr 2fr 2fr 2fr;
            font-size: 8px;
            margin: 0.5px 0;
          }
          
          .calculation {
            border-top: 1px solid #ccc;
            padding-top: 2px;
            margin-bottom: 4px;
          }
          
          .calculation div {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            margin: 0.5px 0;
          }
          
          .payment {
            border-top: 1px solid #ccc;
            padding-top: 2px;
            margin-bottom: 4px;
          }
          
          .payment div {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            margin: 0.5px 0;
          }
          
          .footer {
            text-align: center;
            font-size: 8px;
            border-top: 1px solid #ccc;
            padding-top: 2px;
          }
          
          .footer p {
            margin: 1px 0;
          }
          
          @media print {
            body {
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 2px !important;
              height: auto !important;
              min-height: auto !important;
              overflow: hidden !important;
            }
            
            .receipt {
              width: 100% !important;
              max-width: 80mm !important;
              height: auto !important;
            }
            
            * {
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Header -->
          <div class="header">
            <h1>${businessInfo.name}</h1>
            ${businessInfo.address ? `<p>${businessInfo.address}</p>` : ''}
            ${businessInfo.phone ? `<p>تلفن: ${businessInfo.phone}</p>` : ''}
            ${businessInfo.taxId ? `<p>شناسه مالیاتی: ${businessInfo.taxId}</p>` : ''}
          </div>

          <!-- Order Details -->
          <div class="order-details">
            <div>
              <span>شماره سفارش:</span>
              <span style="font-weight: bold;">${orderNumber}</span>
            </div>
            <div>
              <span>تاریخ و ساعت:</span>
              <span style="font-weight: bold;">${formatDate(orderDate)}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="items">
            <div class="items-header">
              <div class="items-grid">
                <div style="text-align: right;">آیتم</div>
                <div style="text-align: center;">تعداد</div>
                <div style="text-align: center;">واحد</div>
                <div style="text-align: center;">جمع</div>
              </div>
            </div>
            
            ${orderItems.map((item) => `
              <div class="item-row">
                <div style="text-align: right;">${item.menuItem.name}</div>
                <div style="text-align: center;">${item.quantity}</div>
                <div style="text-align: center;">${formatPrice(item.menuItem.price)}</div>
                <div style="text-align: center; font-weight: bold;">${formatPrice(item.totalPrice)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Calculation -->
          <div class="calculation">
            <div>
              <span>جمع آیتم‌ها:</span>
              <span>${formatPrice(calculation.subtotal)} ریال</span>
            </div>
            
            ${calculation.discountAmount > 0 ? `
              <div style="color: green;">
                <span>تخفیف (${calculation.discountPercentage}%):</span>
                <span>-${formatPrice(calculation.discountAmount)} ریال</span>
              </div>
            ` : ''}
            
            ${calculation.taxAmount > 0 ? `
              <div>
                <span>مالیات (${calculation.taxPercentage}%):</span>
                <span>${formatPrice(calculation.taxAmount)} ریال</span>
              </div>
            ` : ''}
            
            ${calculation.serviceAmount > 0 ? `
              <div>
                <span>خدمات (${calculation.servicePercentage}%):</span>
                <span>${formatPrice(calculation.serviceAmount)} ریال</span>
              </div>
            ` : ''}
            
            ${calculation.courierAmount > 0 ? `
              <div>
                <span>پیک:</span>
                <span>${formatPrice(calculation.courierAmount)} ریال</span>
              </div>
            ` : ''}
            
            <div style="border-top: 1px solid #ccc; padding-top: 1px; font-weight: bold;">
              <div>
                <span>مجموع کل:</span>
                <span>${formatPrice(calculation.totalAmount)} ریال</span>
              </div>
            </div>
          </div>

          <!-- Payment -->
          <div class="payment">
            <div>
              <span>روش پرداخت:</span>
              <span style="font-weight: bold;">${paymentData.paymentMethod === 'CASH' ? 'نقدی' : 'کارت'}</span>
            </div>
            <div>
              <span>مبلغ دریافتی:</span>
              <span style="font-weight: bold;">${formatPrice(paymentData.amountReceived)} ریال</span>
            </div>
            ${paymentData.amountReceived > calculation.totalAmount ? `
              <div style="color: green;">
                <span>تغییر:</span>
                <span style="font-weight: bold;">${formatPrice(paymentData.amountReceived - calculation.totalAmount)} ریال</span>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>با تشکر از خرید شما</p>
            <p>امیدواریم از خدمات ما راضی باشید</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Write the document to the new window
    printWindow.document.write(printDocument);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  return (
    <div className="bg-white p-6 max-w-md mx-auto print:p-0 print:max-w-none">
      {/* Print Button - Hidden when printing */}
      <div className="mb-4 print:hidden print-button">
        <button
          onClick={handlePrint}
          className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 font-medium"
        >
          چاپ رسید
        </button>
      </div>

      {/* Receipt Content - Optimized for thermal printers */}
      <div className="border-2 border-gray-300 p-4 print:border-0 print:p-2 print:text-xs receipt-content">
        {/* Header - Compact */}
        <div className="text-center mb-2 print:mb-1">
          <h1 className="text-xl font-bold text-gray-900 mb-1 print:text-lg print:mb-0">{businessInfo.name}</h1>
          {businessInfo.address && (
            <p className="text-sm text-gray-600 mb-1 print:text-xs print:mb-0">{businessInfo.address}</p>
          )}
          {businessInfo.phone && (
            <p className="text-sm text-gray-600 mb-1 print:text-xs print:mb-0">تلفن: {businessInfo.phone}</p>
          )}
          {businessInfo.taxId && (
            <p className="text-sm text-gray-600 print:text-xs">شناسه مالیاتی: {businessInfo.taxId}</p>
          )}
        </div>

        <div className="border-t border-gray-300 pt-1 mb-2 print:mb-1">
          <div className="flex justify-between text-sm print:text-xs">
            <span className="text-gray-600">شماره سفارش:</span>
            <span className="font-medium">{orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm print:text-xs">
            <span className="text-gray-600">تاریخ و ساعت:</span>
            <span className="font-medium">{formatDate(orderDate)}</span>
          </div>
        </div>

        {/* Items - Compact Table */}
        <div className="mb-2 print:mb-1">
          <div className="border-b border-gray-300 pb-1 mb-1">
            <div className="grid grid-cols-12 text-sm font-medium text-gray-700 print:text-xs">
              <div className="col-span-6 text-right">آیتم</div>
              <div className="col-span-2 text-center">تعداد</div>
              <div className="col-span-2 text-center">واحد</div>
              <div className="col-span-2 text-center">جمع</div>
            </div>
          </div>
          
          {orderItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 text-sm py-0.5 print:text-xs print:py-0">
              <div className="col-span-6 text-right">{item.menuItem.name}</div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-2 text-center">{formatPrice(item.menuItem.price)}</div>
              <div className="col-span-2 text-center font-medium">{formatPrice(item.totalPrice)}</div>
            </div>
          ))}
        </div>

        {/* Calculation Breakdown - Compact */}
        <div className="border-t border-gray-300 pt-1 mb-2 print:mb-1">
          <div className="space-y-0.5 text-sm print:text-xs print:space-y-0">
            <div className="flex justify-between">
              <span className="text-gray-600">جمع آیتم‌ها:</span>
              <span>{formatPrice(calculation.subtotal)} ریال</span>
            </div>
            
            {calculation.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>تخفیف ({calculation.discountPercentage}%):</span>
                <span>-{formatPrice(calculation.discountAmount)} ریال</span>
              </div>
            )}
            
            {calculation.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>مالیات ({calculation.taxPercentage}%):</span>
                <span>{formatPrice(calculation.taxAmount)} ریال</span>
              </div>
            )}
            
            {calculation.serviceAmount > 0 && (
              <div className="flex justify-between">
                <span>خدمات ({calculation.servicePercentage}%):</span>
                <span>{formatPrice(calculation.serviceAmount)} ریال</span>
              </div>
            )}
            
            {calculation.courierAmount > 0 && (
              <div className="flex justify-between">
                <span>پیک:</span>
                <span>{formatPrice(calculation.courierAmount)} ریال</span>
              </div>
            )}
            
            <div className="border-t border-gray-300 pt-0.5 font-bold">
              <div className="flex justify-between">
                <span>مجموع کل:</span>
                <span>{formatPrice(calculation.totalAmount)} ریال</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information - Compact */}
        <div className="border-t border-gray-300 pt-1 mb-2 print:mb-1">
          <div className="space-y-0.5 text-sm print:text-xs print:space-y-0">
            <div className="flex justify-between">
              <span className="text-gray-600">روش پرداخت:</span>
              <span className="font-medium">
                {paymentData.paymentMethod === 'CASH' ? 'نقدی' : 'کارت'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">مبلغ دریافتی:</span>
              <span className="font-medium">{formatPrice(paymentData.amountReceived)} ریال</span>
            </div>
            {paymentData.amountReceived > calculation.totalAmount && (
              <div className="flex justify-between text-green-600">
                <span>تغییر:</span>
                <span className="font-medium">
                  {formatPrice(paymentData.amountReceived - calculation.totalAmount)} ریال
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-1 print:text-xs">
          <p>با تشکر از خرید شما</p>
          <p className="mt-0.5 print:mt-0">امیدواریم از خدمات ما راضی باشید</p>
        </div>
      </div>
    </div>
  );
} 