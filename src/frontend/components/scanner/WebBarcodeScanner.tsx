'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiCamera, FiRotateCw, FiX, FiCheck } from 'react-icons/fi';

interface ScanResult {
  code: string;
  format: string;
  timestamp: number;
}

interface WebBarcodeScannerProps {
  onScanResult: (result: ScanResult) => void;
  onError: (error: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

const WebBarcodeScanner: React.FC<WebBarcodeScannerProps> = ({
  onScanResult,
  onError,
  isActive,
  onToggle
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Get available camera devices
  const getDevices = useCallback(async () => {
    if (!isClient || typeof navigator === 'undefined') return;
    
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Select back camera for mobile devices
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      setSelectedDeviceId(backCamera?.deviceId || videoDevices[0]?.deviceId || '');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      onError('دسترسی به دوربین امکان‌پذیر نیست. لطفاً مجوز دوربین را بررسی کنید.');
    }
  }, [onError, isClient]);

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
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch {
      // Silently fail if audio context is not available
    }
  }, [isClient]);

  // Initialize Quagga scanner
  const initializeScanner = useCallback(async () => {
    if (!isClient || !scannerRef.current || !selectedDeviceId || isInitialized) return;
    
    setIsLoading(true);
    
    try {
      // Dynamically import Quagga (since it's a browser-only library)
      const Quagga = (await import('quagga')).default;
      
      // Optimized configuration for better performance
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 480, ideal: 720, max: 1280 }, // Reduced resolution for better performance
            height: { min: 320, ideal: 480, max: 720 },
            facingMode: "environment",
            deviceId: selectedDeviceId,
            frameRate: { ideal: 15, max: 20 } // Limit frame rate for better performance
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true // Enable half sampling for better performance
        },
        numOfWorkers: Math.min(2, navigator.hardwareConcurrency || 1), // Limit workers for performance
        decoder: {
          readers: [
            "code_128_reader", // Most common
            "ean_reader",      // EAN-13
            "ean_8_reader",    // EAN-8
            "upc_reader",      // UPC-A
            "code_39_reader"   // Reduced number of readers for better performance
          ],
          multiple: false // Only detect one barcode at a time
        },
        locate: true,
        debug: false,
        // Performance optimizations
        frequency: 10, // Reduce scanning frequency
        area: { // Limit scan area to center for better performance
          top: "25%",
          right: "25%", 
          left: "25%",
          bottom: "25%"
        }
      };

      Quagga.init(config, (err?: Error) => {
        setIsLoading(false);
        
        if (err) {
          console.error('Quagga initialization error:', err);
          onError('خطا در راه‌اندازی اسکنر: ' + err.message);
          return;
        }
        
        setIsInitialized(true);
        setIsScanning(true);
        Quagga.start();
      });

      // Event listener for successful barcode detection
      Quagga.onDetected((data) => {
        if (!isScanning) return;
        
        const result: ScanResult = {
          code: data.codeResult.code,
          format: data.codeResult.format,
          timestamp: Date.now()
        };
        
        setLastScan(result.code);
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
          if (isActive && isInitialized) {
            setIsScanning(true);
          }
        }, 2000);
        
        onScanResult(result);
      });

      // Error handling with reduced frequency
      Quagga.onProcessed((result) => {
        // Minimal processing to reduce overhead
        if (result && result.codeResult) {
          // Optional: Show processing feedback with throttling
        }
      });

    } catch (error) {
      setIsLoading(false);
      console.error('Scanner initialization failed:', error);
      onError('خطا در بارگذاری اسکنر. لطفاً صفحه را تازه‌سازی کنید.');
    }
  }, [selectedDeviceId, isInitialized, isActive, onScanResult, onError, isScanning, isClient, playSuccessSound]);

  // Cleanup function
  const cleanupScanner = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const Quagga = (await import('quagga')).default;
      if (isInitialized) {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
        setIsInitialized(false);
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Error cleaning up scanner:', error);
    }
  }, [isInitialized, isClient]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    
    await cleanupScanner();
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const newDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(newDeviceId);
  }, [devices, selectedDeviceId, cleanupScanner]);

  // Initialize devices on mount
  useEffect(() => {
    if (isClient) {
      getDevices();
    }
  }, [getDevices, isClient]);

  // Initialize scanner when active and device is selected
  useEffect(() => {
    if (isClient && isActive && selectedDeviceId && !isInitialized) {
      initializeScanner();
    } else if (!isActive && isInitialized) {
      cleanupScanner();
    }
  }, [isActive, selectedDeviceId, isInitialized, initializeScanner, cleanupScanner, isClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isClient) {
        cleanupScanner();
      }
    };
  }, [cleanupScanner, isClient]);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
          <div className="relative w-full h-80 bg-black flex items-center justify-center" style={{ minHeight: '320px' }}>
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>در حال بارگذاری اسکنر...</p>
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
        <div 
          ref={scannerRef}
          className="relative w-full h-80 bg-black flex items-center justify-center"
          style={{ minHeight: '320px' }}
        >
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
            <div className="flex flex-col items-center justify-center text-white">
              <FiCamera className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">اسکنر غیرفعال</p>
              <p className="text-sm opacity-75">برای شروع اسکن کلیک کنید</p>
            </div>
          )}
        </div>

        {/* Scanner Overlay */}
        {isActive && isInitialized && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              {/* Scanner Frame */}
              <div className="w-64 h-64 border-2 border-transparent relative">
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                
                {/* Scanning line animation */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-0.5 bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg text-sm">
                  بارکد را در مرکز قاب قرار دهید
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
            <div className="bg-green-600 bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FiCheck className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">آخرین کد اسکن شده:</p>
                <p className="text-xs font-mono">{lastScan}</p>
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
              شروع اسکن
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

export default WebBarcodeScanner; 