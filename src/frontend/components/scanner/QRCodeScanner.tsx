'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiCamera, FiRotateCw, FiX, FiCheck } from 'react-icons/fi';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

interface QRScanResult {
  text: string;
  format: string;
  timestamp: number;
}

interface QRCodeScannerProps {
  onScanResult: (result: QRScanResult) => void;
  onError: (error: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanResult,
  onError,
  isActive,
  onToggle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reader, setReader] = useState<BrowserMultiFormatReader | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize ZXing reader
  const initializeReader = useCallback(() => {
    if (!isClient) return null;
    
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, false);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      'QR_CODE'
    ]);
    
    const newReader = new BrowserMultiFormatReader(hints);
    setReader(newReader);
    return newReader;
  }, [isClient]);

  // Get available camera devices
  const getDevices = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const readerInstance = reader || initializeReader();
      if (!readerInstance) return;
      
      const deviceList = await readerInstance.listVideoInputDevices();
      setDevices(deviceList);
      
      // Select back camera for mobile devices
      const backCamera = deviceList.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      setSelectedDeviceId(backCamera?.deviceId || deviceList[0]?.deviceId || '');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      onError('دسترسی به دوربین امکان‌پذیر نیست. لطفاً مجوز دوربین را بررسی کنید.');
    }
  }, [reader, onError, initializeReader, isClient]);

  // Play success sound
  const playSuccessSound = useCallback(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch {
      // Silently fail if audio context is not available
    }
  }, [isClient]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!isClient || !videoRef.current || !selectedDeviceId || !reader) return;
    
    setIsLoading(true);
    setIsScanning(true);
    
    try {
      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result && isScanning) {
            const scanResult: QRScanResult = {
              text: result.getText(),
              format: result.getBarcodeFormat().toString(),
              timestamp: Date.now()
            };
            
            setLastScan(scanResult.text);
            setScanCount(prev => prev + 1);
            
            // Haptic feedback
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            
            // Audio feedback
            playSuccessSound();
            
            // Pause scanning briefly to avoid duplicate scans
            setIsScanning(false);
            setTimeout(() => {
              if (isActive) {
                setIsScanning(true);
              }
            }, 2000);
            
            onScanResult(scanResult);
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            console.error('QR Scanner error:', error);
          }
        }
      );
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setIsScanning(false);
      console.error('Failed to start scanning:', error);
      onError('خطا در شروع اسکن: ' + (error as Error).message);
    }
  }, [videoRef, selectedDeviceId, reader, isScanning, isActive, onScanResult, onError, isClient, playSuccessSound]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (reader) {
      reader.reset();
      setIsScanning(false);
    }
  }, [reader]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    
    stopScanning();
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const newDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(newDeviceId);
  }, [devices, selectedDeviceId, stopScanning]);

  // Initialize reader and get devices on mount
  useEffect(() => {
    if (isClient) {
      initializeReader();
      getDevices();
    }
  }, [initializeReader, getDevices, isClient]);

  // Start/stop scanning based on active state
  useEffect(() => {
    if (isClient && isActive && selectedDeviceId && reader) {
      startScanning();
    } else if (!isActive) {
      stopScanning();
    }
  }, [isActive, selectedDeviceId, reader, startScanning, stopScanning, isClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isClient && reader) {
        reader.reset();
      }
    };
  }, [reader, isClient]);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
          <div className="relative w-full h-80 bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>در حال بارگذاری اسکنر QR...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Scanner Container */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <div className="relative w-full h-80 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ minHeight: '320px' }}
            playsInline
            muted
          />
          
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>در حال راه‌اندازی دوربین...</p>
              </div>
            </div>
          )}
          
          {/* Inactive State */}
          {!isActive && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-70">
              <FiCamera className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">اسکنر QR غیرفعال</p>
              <p className="text-sm opacity-75">برای شروع اسکن کلیک کنید</p>
            </div>
          )}
        </div>

        {/* Scanner Overlay */}
        {isActive && !isLoading && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              {/* QR Scanner Frame */}
              <div className="w-64 h-64 border-4 border-blue-400 rounded-lg relative">
                {/* Corner animations */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg animate-pulse"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg animate-pulse"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg animate-pulse"></div>
                
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-400 rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg text-sm">
                  QR کد را در مرکز قاب قرار دهید
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Camera Switch Button */}
          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              disabled={isLoading}
              className="bg-black bg-opacity-60 text-white p-2 rounded-full shadow-lg hover:bg-opacity-80 transition-all disabled:opacity-50"
              title="تغییر دوربین"
            >
              <FiRotateCw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status Overlay */}
        {lastScan && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-blue-600 bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FiCheck className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">آخرین QR اسکن شده:</p>
                <p className="text-xs font-mono break-all">{lastScan}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2 ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              در حال راه‌اندازی...
            </>
          ) : isActive ? (
            <>
              <FiX className="w-5 h-5" />
              توقف اسکن
            </>
          ) : (
            <>
              <FiCamera className="w-5 h-5" />
              شروع اسکن QR
            </>
          )}
        </button>
        
        {/* Scan Count */}
        {scanCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
            تعداد اسکن: {scanCount}
          </div>
        )}
      </div>

      {/* Device Selection */}
      {devices.length > 1 && (
        <div className="mt-4 text-center">
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isActive || isLoading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `دوربین ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner; 