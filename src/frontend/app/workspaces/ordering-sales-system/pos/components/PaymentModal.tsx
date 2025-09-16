'use client';

import React, { useState } from 'react';
import type { OrderCalculation, OrderOptions } from '../../../../../services/orderingService';

interface PaymentModalProps {
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
  onPaymentComplete: (paymentData: {
    paymentMethod: 'CASH' | 'CARD';
    amountReceived: number;
    notes?: string;
  }) => void;
  onClose: () => void;
}

export default function PaymentModal({ 
  orderItems, 
  calculation, 
  onPaymentComplete, 
  onClose 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [amountReceived, setAmountReceived] = useState(calculation.totalAmount);
  const [notes, setNotes] = useState('');

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  const handlePaymentComplete = () => {
    if (amountReceived < calculation.totalAmount) {
      alert('مبلغ دریافتی نمی‌تواند کمتر از مبلغ کل باشد');
      return;
    }

    onPaymentComplete({
      paymentMethod,
      amountReceived,
      notes: notes.trim() || undefined
    });
  };

  const changeAmount = calculation.totalAmount - amountReceived;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-md mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">ثبت پرداخت</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Order Summary */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">خلاصه سفارش</h3>
          <div className="space-y-1 text-sm">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(item.totalPrice)} تومان
                </span>
              </div>
            ))}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-1 mt-2">
              <div className="flex justify-between font-medium">
                <span className="text-gray-900 dark:text-white">مجموع کل:</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatPrice(calculation.totalAmount)} تومان
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            روش پرداخت
          </label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            <label className="flex items-center">
              <input
                type="radio"
                value="CASH"
                checked={paymentMethod === 'CASH'}
                onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                className="ml-2 w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">نقدی</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="CARD"
                checked={paymentMethod === 'CARD'}
                onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                className="ml-2 w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">کارت</span>
            </label>
          </div>
        </div>

        {/* Amount Received */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            مبلغ دریافتی
          </label>
          <input
            type="number"
            value={amountReceived}
            onChange={(e) => setAmountReceived(Number(e.target.value))}
            className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base md:text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="مبلغ دریافتی"
            min={calculation.totalAmount}
            step="1000"
          />
        </div>

        {/* Change Amount */}
        {amountReceived > calculation.totalAmount && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">تغییر:</span>
              <span className="text-green-700 dark:text-green-400 font-medium">
                {formatPrice(changeAmount)} تومان
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            یادداشت (اختیاری)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="یادداشت پرداخت"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
          <button
            onClick={handlePaymentComplete}
            className="flex-1 bg-green-500 text-white py-2 md:py-3 px-4 rounded-lg hover:bg-green-600 font-medium transition-colors text-sm md:text-base"
          >
            ثبت پرداخت و چاپ رسید
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 md:py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-sm md:text-base"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
} 