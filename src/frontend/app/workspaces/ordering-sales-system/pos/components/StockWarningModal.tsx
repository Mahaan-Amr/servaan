'use client';

import React, { useState } from 'react';

interface StockWarning {
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  itemId: string;
  itemName: string;
  requiredQuantity: number;
  availableQuantity: number;
  unit: string;
  message: string;
  suggestedAction: string;
}

interface StockWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (overrides: StockOverride[]) => void;
  warnings: StockWarning[];
  criticalWarnings: number;
  totalWarnings: number;
  overrideRequired: boolean;
}

interface StockOverride {
  menuItemId: string;
  itemId: string;
  itemName: string;
  requiredQuantity: number;
  availableQuantity: number;
  overrideReason: string;
  overrideType: 'STAFF_DECISION' | 'EMERGENCY_PURCHASE' | 'SUBSTITUTE_INGREDIENT' | 'VIP_CUSTOMER';
  notes?: string;
}

export default function StockWarningModal({
  isOpen,
  onClose,
  onProceed,
  warnings,
  criticalWarnings,
  totalWarnings,
  overrideRequired
}: StockWarningModalProps) {
  const [overrides, setOverrides] = useState<StockOverride[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  const handleOverrideChange = (warning: StockWarning, field: keyof StockOverride, value: string) => {
    setOverrides(prev => {
      const existingIndex = prev.findIndex(o => o.itemId === warning.itemId);
      const newOverride: StockOverride = {
        menuItemId: '', // Will be set when proceeding
        itemId: warning.itemId,
        itemName: warning.itemName,
        requiredQuantity: warning.requiredQuantity,
        availableQuantity: warning.availableQuantity,
        overrideReason: '',
        overrideType: 'STAFF_DECISION',
        notes: '',
        ...(existingIndex >= 0 ? prev[existingIndex] : {}),
        [field]: value
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newOverride;
        return updated;
      } else {
        return [...prev, newOverride];
      }
    });
  };

  const handleProceed = async () => {
    setIsProcessing(true);
    try {
      // Validate that all critical warnings have overrides
      const criticalWarningsList = warnings.filter(w => w.severity === 'CRITICAL' || w.severity === 'HIGH');
      const missingOverrides = criticalWarningsList.filter(w => 
        !overrides.find(o => o.itemId === w.itemId)
      );

      if (missingOverrides.length > 0) {
        alert('لطفاً برای تمام هشدارهای مهم دلیل عبور را وارد کنید');
        setIsProcessing(false);
        return;
      }

      onProceed(overrides);
    } catch (error) {
      console.error('Error processing overrides:', error);
      alert('خطا در پردازش درخواست');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                هشدار موجودی
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalWarnings} هشدار موجودی ({criticalWarnings} مهم)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning List */}
        <div className="space-y-4 mb-6">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <span className="text-lg">{getSeverityIcon(warning.severity)}</span>
                    <h4 className="font-medium">{warning.itemName}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      {warning.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{warning.message}</p>
                  
                  <div className="text-xs space-y-1">
                    <div>مقدار مورد نیاز: {warning.requiredQuantity} {warning.unit}</div>
                    <div>موجودی فعلی: {warning.availableQuantity} {warning.unit}</div>
                    <div className="text-green-600 dark:text-green-400">
                      پیشنهاد: {warning.suggestedAction}
                    </div>
                  </div>
                </div>
              </div>

              {/* Override Section for Critical/High warnings */}
              {(warning.severity === 'CRITICAL' || warning.severity === 'HIGH') && (
                <div className="mt-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                  <h5 className="font-medium text-sm mb-3">دلیل عبور از این هشدار:</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">نوع تصمیم</label>
                      <select
                        value={overrides.find(o => o.itemId === warning.itemId)?.overrideType || 'STAFF_DECISION'}
                        onChange={(e) => handleOverrideChange(warning, 'overrideType', e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      >
                        <option value="STAFF_DECISION">تصمیم کارکنان</option>
                        <option value="EMERGENCY_PURCHASE">خرید اضطراری</option>
                        <option value="SUBSTITUTE_INGREDIENT">جایگزینی ماده</option>
                        <option value="VIP_CUSTOMER">مشتری ویژه</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">دلیل</label>
                      <input
                        type="text"
                        placeholder="دلیل عبور از این هشدار را وارد کنید..."
                        value={overrides.find(o => o.itemId === warning.itemId)?.overrideReason || ''}
                        onChange={(e) => handleOverrideChange(warning, 'overrideReason', e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">یادداشت (اختیاری)</label>
                      <textarea
                        placeholder="یادداشت اضافی..."
                        value={overrides.find(o => o.itemId === warning.itemId)?.notes || ''}
                        onChange={(e) => handleOverrideChange(warning, 'notes', e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            انصراف
          </button>
          
          <button
            onClick={handleProceed}
            disabled={isProcessing || (overrideRequired && overrides.length === 0)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isProcessing || (overrideRequired && overrides.length === 0)
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isProcessing ? 'در حال پردازش...' : 'ادامه با عبور از هشدارها'}
          </button>
        </div>

        {/* Info Message */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start space-x-2 space-x-reverse">
            <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">نکته مهم:</p>
              <p>
                این سیستم به شما امکان ادامه سفارش را می‌دهد حتی در صورت کمبود موجودی. 
                لطفاً اطمینان حاصل کنید که می‌توانید مواد اولیه مورد نیاز را تهیه کنید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
