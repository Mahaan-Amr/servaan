'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FiBarChart2, FiSquare, FiSettings, FiX } from 'react-icons/fi';
import WebBarcodeScanner from './WebBarcodeScanner';
import QRCodeScanner from './QRCodeScanner';

export type ScanMode = 'barcode' | 'qr';

export interface UniversalScanResult {
  code: string;
  format: string;
  timestamp: number;
  mode: ScanMode;
}

interface UniversalScannerProps {
  onScanResult: (result: UniversalScanResult) => void;
  onError: (error: string) => void;
  onClose?: () => void;
  defaultMode?: ScanMode;
  showModeSelector?: boolean;
}

const UniversalScanner: React.FC<UniversalScannerProps> = ({
  onScanResult,
  onError,
  onClose,
  defaultMode = 'barcode',
  showModeSelector = true
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>(defaultMode);
  const [isActive, setIsActive] = useState(false);
  const [scanHistory, setScanHistory] = useState<UniversalScanResult[]>([]);

  // Handle scan results from both scanners
  const handleBarcodeResult = useCallback((result: { code: string; format: string; timestamp: number }) => {
    const universalResult: UniversalScanResult = {
      ...result,
      mode: 'barcode'
    };
    
    setScanHistory(prev => [universalResult, ...prev.slice(0, 4)]);
    onScanResult(universalResult);
  }, [onScanResult]);

  const handleQRResult = useCallback((result: { text: string; format: string; timestamp: number }) => {
    const universalResult: UniversalScanResult = {
      code: result.text,
      format: result.format,
      timestamp: result.timestamp,
      mode: 'qr'
    };
    
    setScanHistory(prev => [universalResult, ...prev.slice(0, 4)]);
    onScanResult(universalResult);
  }, [onScanResult]);

  // Toggle scanner active state with proper cleanup
  const toggleScanner = useCallback(() => {
    if (isActive) {
      // Stop current scanner before switching
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  }, [isActive]);

  // Switch scan mode with proper cleanup
  const switchMode = useCallback((mode: ScanMode) => {
    if (isActive) {
      setIsActive(false);
      setTimeout(() => {
        setScanMode(mode);
        setIsActive(true);
      }, 100); // Reduced timeout for better UX
    } else {
      setScanMode(mode);
    }
  }, [isActive, setScanMode]);

  // Clear scan history
  const clearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        setIsActive(false);
      }
    };
  }, [isActive]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">اسکنر Universal</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              اسکن بارکد و QR کد با دوربین
            </p>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="بستن"
            >
              <FiX className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Mode Selector */}
        {showModeSelector && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => switchMode('barcode')}
              disabled={isActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                scanMode === 'barcode'
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
              اسکن بارکد
            </button>
            
            <button
              onClick={() => switchMode('qr')}
              disabled={isActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                scanMode === 'qr'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FiSquare className="w-4 h-4" />
              اسکن QR
            </button>
          </div>
        )}

        {/* Current Mode Info */}
        <div className={`p-3 rounded-lg border-l-4 ${
          scanMode === 'barcode' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500' 
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500'
        }`}>
          <p className={`text-sm font-medium ${
            scanMode === 'barcode'
              ? 'text-green-800 dark:text-green-300'
              : 'text-blue-800 dark:text-blue-300'
          }`}>
            حالت فعلی: {scanMode === 'barcode' ? 'اسکن بارکد' : 'اسکن QR کد'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {scanMode === 'barcode' 
              ? 'برای اسکن کدهای EAN، UPC، Code 128 و...' 
              : 'برای اسکن QR Code، Data Matrix و...'
            }
          </p>
        </div>
      </div>

      {/* Scanner Component */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {scanMode === 'barcode' ? (
          <WebBarcodeScanner
            onScanResult={handleBarcodeResult}
            onError={onError}
            isActive={isActive}
            onToggle={toggleScanner}
          />
        ) : (
          <QRCodeScanner
            onScanResult={handleQRResult}
            onError={onError}
            isActive={isActive}
            onToggle={toggleScanner}
          />
        )}
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              تاریخچه اسکن ({scanHistory.length})
            </h3>
            <button
              onClick={clearHistory}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
            >
              پاک کردن تاریخچه
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {scanHistory.map((scan, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  scan.mode === 'barcode' 
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {scan.mode === 'barcode' ? (
                      <FiBarChart2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <FiSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      scan.mode === 'barcode' 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {scan.mode === 'barcode' ? 'بارکد' : 'QR'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {scan.format}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(scan.timestamp).toLocaleTimeString('fa-IR')}
                  </span>
                </div>
                
                <div className="mt-2">
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all bg-gray-100 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                    {scan.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips and Information */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FiSettings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          راهنمای استفاده
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">اسکن بارکد:</h4>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• پشتیبانی از EAN-13, EAN-8, UPC</li>
              <li>• Code 128, Code 39, I2of5</li>
              <li>• بهترین نتیجه در نور کافی</li>
              <li>• فاصله 10-30 سانتی‌متری مناسب</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">اسکن QR کد:</h4>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• پشتیبانی از QR Code, Data Matrix</li>
              <li>• Aztec, PDF417</li>
              <li>• قابلیت اسکن متن، لینک، اطلاعات</li>
              <li>• دقت بالا در زوایای مختلف</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalScanner; 