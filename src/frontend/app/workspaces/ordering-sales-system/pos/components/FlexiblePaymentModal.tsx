'use client';

import React, { useState } from 'react';
import { FaTimes, FaCreditCard, FaMoneyBillWave, FaUser, FaPhone, FaStickyNote } from 'react-icons/fa';

interface FlexiblePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    paymentType: 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL';
    customerName: string;
    customerPhone: string;
    orderNotes: string;
    paymentMethod?: 'CASH' | 'CARD';
    amountReceived?: number;
    selectedItems?: number[];
  }) => void;
  totalAmount: number;
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
  calculation: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    serviceAmount: number;
    totalAmount: number;
  };
}

export default function FlexiblePaymentModal({ isOpen, onClose, onSubmit, totalAmount, orderItems, calculation }: FlexiblePaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL'>('IMMEDIATE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [amountReceived, setAmountReceived] = useState<number>(totalAmount);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const handleSubmit = () => {
    // Customer information is now truly optional for all payment types
    // No validation required for customer name and phone

    // Validate payment type specific requirements
    if (paymentType === 'IMMEDIATE') {
      if (!paymentMethod) {
        alert('لطفاً روش پرداخت را انتخاب کنید');
        return;
      }
      if (!amountReceived || amountReceived <= 0) {
        alert('لطفاً مبلغ دریافتی را وارد کنید');
        return;
      }
      if (amountReceived < totalAmount) {
        alert('مبلغ دریافتی نمی‌تواند کمتر از مبلغ کل باشد');
        return;
      }
    }

    if (paymentType === 'PARTIAL') {
      if (selectedItems.length === 0) {
        alert('لطفاً حداقل یک آیتم را برای پرداخت انتخاب کنید');
        return;
      }
      if (!paymentMethod) {
        alert('لطفاً روش پرداخت را انتخاب کنید');
        return;
      }
    }

    onSubmit({
      paymentType,
      customerName: customerName.trim() || 'مشتری ناشناس',
      customerPhone: customerPhone.trim() || '',
      orderNotes,
      paymentMethod: (paymentType === 'IMMEDIATE' || paymentType === 'PARTIAL') ? paymentMethod : undefined,
      amountReceived: (paymentType === 'IMMEDIATE' || paymentType === 'PARTIAL') ? amountReceived : undefined,
      selectedItems: paymentType === 'PARTIAL' ? selectedItems : undefined
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR'
    }).format(amount);
  };

  // Calculate proportional amounts for selected items
  const calculateProportionalAmounts = (selectedIndices: number[]) => {
    if (selectedIndices.length === 0) return { subtotal: 0, discountAmount: 0, taxAmount: 0, serviceAmount: 0, totalAmount: 0 };
    
    // Calculate total of selected items before adjustments
    const selectedSubtotal = selectedIndices.reduce((sum, index) => sum + orderItems[index].totalPrice, 0);
    
    // Calculate proportional ratios
    const subtotalRatio = selectedSubtotal / calculation.subtotal;
    
    // Apply proportional adjustments
    const proportionalDiscount = calculation.discountAmount * subtotalRatio;
    const proportionalTax = calculation.taxAmount * subtotalRatio;
    const proportionalServiceAmount = calculation.serviceAmount * subtotalRatio;
    
    // Calculate final proportional total
    const proportionalTotal = selectedSubtotal + proportionalTax + proportionalServiceAmount - proportionalDiscount;
    
    return {
      subtotal: selectedSubtotal,
      discountAmount: proportionalDiscount,
      taxAmount: proportionalTax,
      serviceAmount: proportionalServiceAmount,
      totalAmount: proportionalTotal
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-md mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">انتخاب نوع پرداخت</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <FaTimes className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Payment Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            نوع پرداخت
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="paymentType"
                value="IMMEDIATE"
                checked={paymentType === 'IMMEDIATE'}
                onChange={(e) => setPaymentType(e.target.value as 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">پرداخت فوری</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">پرداخت کامل در زمان سفارش</div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="paymentType"
                value="PAY_AFTER_SERVICE"
                checked={paymentType === 'PAY_AFTER_SERVICE'}
                onChange={(e) => setPaymentType(e.target.value as 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">پرداخت پس از سرویس</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">پرداخت پس از اتمام غذا</div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="paymentType"
                value="PARTIAL"
                checked={paymentType === 'PARTIAL'}
                onChange={(e) => setPaymentType(e.target.value as 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">پرداخت جزئی</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">پرداخت در چند مرحله</div>
              </div>
            </label>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نام مشتری <span className="text-gray-500 text-xs">(اختیاری)</span>
          </label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              placeholder="نام مشتری (اختیاری)"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">اطلاعات مشتری اختیاری است</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            شماره تلفن <span className="text-gray-500 text-xs">(اختیاری)</span>
          </label>
          <div className="relative">
            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              placeholder="شماره تلفن (اختیاری)"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">شماره تلفن اختیاری است</p>
        </div>

        {/* Order Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            یادداشت سفارش
          </label>
          <div className="relative">
            <FaStickyNote className="absolute left-3 top-3 text-gray-400" />
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="یادداشت سفارش (اختیاری)"
            />
          </div>
        </div>

        {/* Immediate Payment Options */}
        {paymentType === 'IMMEDIATE' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              روش پرداخت
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                  className="mr-2"
                />
                <FaMoneyBillWave className="mr-2 text-green-500" />
                <span className="text-sm">نقدی</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                  className="mr-2"
                />
                <FaCreditCard className="mr-2 text-blue-500" />
                <span className="text-sm">کارت</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مبلغ دریافتی
              </label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                min={totalAmount}
              />
            </div>
          </div>
        )}

        {/* Partial Payment Options */}
        {paymentType === 'PARTIAL' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              انتخاب آیتم‌های پرداختی
            </label>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                آیتم‌هایی که می‌خواهید اکنون پرداخت کنید را انتخاب کنید:
              </div>
              
              {/* Item Selection */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orderItems.map((item, index) => (
                  <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, index]);
                        } else {
                          setSelectedItems(selectedItems.filter(i => i !== index));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.quantity}x {item.menuItem.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(item.totalPrice)} تومان
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {/* Payment Summary */}
              {selectedItems.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    خلاصه پرداخت:
                  </div>
                  <div className="space-y-1 text-sm">
                    {selectedItems.map(index => {
                      const item = orderItems[index];
                      return (
                        <div key={index} className="flex justify-between">
                          <span className="text-amber-700 dark:text-amber-300">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                          <span className="text-amber-700 dark:text-amber-300 font-medium">
                            {formatPrice(item.totalPrice)} تومان
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Proportional Adjustments */}
                    {(() => {
                      const proportional = calculateProportionalAmounts(selectedItems);
                      return (
                        <>
                          <div className="border-t border-amber-200 dark:border-amber-700 pt-1 mt-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-amber-600 dark:text-amber-400">مجموع آیتم‌ها:</span>
                              <span className="text-amber-600 dark:text-amber-400">
                                {formatPrice(proportional.subtotal)} تومان
                              </span>
                            </div>
                            {proportional.discountAmount > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400">تخفیف:</span>
                                <span className="text-green-600 dark:text-green-400">
                                  -{formatPrice(proportional.discountAmount)} تومان
                                </span>
                              </div>
                            )}
                            {proportional.taxAmount > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-amber-600 dark:text-amber-400">مالیات:</span>
                                <span className="text-amber-600 dark:text-amber-400">
                                  +{formatPrice(proportional.taxAmount)} تومان
                                </span>
                              </div>
                            )}
                            {proportional.serviceAmount > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-amber-600 dark:text-amber-400">کارمزد سرویس:</span>
                                <span className="text-amber-600 dark:text-amber-400">
                                  +{formatPrice(proportional.serviceAmount)} تومان
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="border-t border-amber-200 dark:border-amber-700 pt-1 mt-2">
                            <div className="flex justify-between font-medium">
                              <span className="text-amber-800 dark:text-amber-200">مجموع پرداختی:</span>
                              <span className="text-amber-800 dark:text-amber-200">
                                {formatPrice(proportional.totalAmount)} تومان
                              </span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-amber-600 dark:text-amber-400">باقی‌مانده:</span>
                              <span className="text-amber-600 dark:text-amber-400">
                                {formatPrice(totalAmount - proportional.totalAmount)} تومان
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Payment Method */}
              {selectedItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    روش پرداخت
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH"
                        checked={paymentMethod === 'CASH'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">نقدی</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">پرداخت نقدی</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CARD"
                        checked={paymentMethod === 'CARD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">کارت</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">پرداخت با کارت</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total Amount Display */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">مجموع سفارش:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(totalAmount)}
            </span>
          </div>
          {paymentType === 'IMMEDIATE' && amountReceived > totalAmount && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600 dark:text-gray-400">مبلغ باقی‌مانده:</span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(amountReceived - totalAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            تایید سفارش
          </button>
        </div>
      </div>
    </div>
  );
}
