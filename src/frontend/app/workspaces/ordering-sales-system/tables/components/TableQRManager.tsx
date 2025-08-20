'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaQrcode, FaPrint, FaDownload, FaShare, FaCopy, FaLink, FaChartBar } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { TableService } from '@/services/orderingService';
import { Table } from '@/types/ordering';
import { formatDate } from '@/utils/dateUtils';
import toast from 'react-hot-toast';

interface TableQRManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: Table;
}

interface QRCodeData {
  tableId: string;
  tableNumber: string;
  qrCodeUrl: string;
  directOrderUrl: string;
  customerServiceUrl: string;
  createdAt: Date;
  scanCount: number;
}

interface QRCodeAnalytics {
  totalScans: number;
  uniqueScanners: number;
  averageScansPerDay: number;
  mostActiveHours: number[];
  popularActions: {
    action: string;
    count: number;
  }[];
}

export const TableQRManager: React.FC<TableQRManagerProps> = ({
  isOpen,
  onClose,
  selectedTable
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'generate' | 'analytics' | 'print'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [analytics, setAnalytics] = useState<QRCodeAnalytics | null>(null);
  const [showQR, setShowQR] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null);

  // QR Code Configuration
  const [qrConfig, setQrConfig] = useState({
    size: 256,
    includeTableInfo: true,
    includeMenuLink: true,
    includeCustomerService: true,
    customMessage: ''
  });

  // Generate QR code for table
  const generateQRCode = useCallback(async (table: Table) => {
    try {
      setLoading(true);
      setError('');

      // Create mock QR code data
      const mockQRCodeData: QRCodeData = {
        tableId: table.id,
        tableNumber: table.tableNumber,
        qrCodeUrl: `data:image/svg+xml;base64,${btoa(`
          <svg width="${qrConfig.size}" height="${qrConfig.size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="black">
              Table ${table.tableNumber}
            </text>
          </svg>
        `)}`,
        directOrderUrl: `${window.location.origin}/order/table/${table.id}`,
        customerServiceUrl: `${window.location.origin}/service/table/${table.id}`,
        createdAt: new Date(),
        scanCount: Math.floor(Math.random() * 50) + 1
      };

      setQrCodeData(mockQRCodeData);
      loadAnalytics(table.id);
    } catch (error: unknown) {
      console.error('Error generating QR code:', error);
      setError(error instanceof Error ? error.message : 'Error generating QR code');
    } finally {
      setLoading(false);
    }
  }, [qrConfig.size]);

  // Initialize component
  useEffect(() => {
    if (isOpen) {
      loadTables();
      if (selectedTable) {
        setSelectedTableForQR(selectedTable);
        generateQRCode(selectedTable);
      }
    }
  }, [isOpen, selectedTable, generateQRCode]);

  // Load tables
  const loadTables = async () => {
    try {
      const response = await TableService.getTables();
      setTables(response as Table[]);
    } catch (error) {
      console.error('Error loading tables:', error);
      setError('Error loading tables');
    }
  };

  // Load analytics for table
  const loadAnalytics = async (tableId: string) => {
    try {
      // Mock analytics data - in real implementation, this would use tableId
      console.log('Loading analytics for table:', tableId);
      const mockAnalytics: QRCodeAnalytics = {
        totalScans: Math.floor(Math.random() * 200) + 50,
        uniqueScanners: Math.floor(Math.random() * 30) + 10,
        averageScansPerDay: Math.floor(Math.random() * 10) + 2,
        mostActiveHours: [12, 13, 19, 20, 21],
        popularActions: [
          { action: 'View Menu', count: 45 },
          { action: 'Direct Order', count: 32 },
          { action: 'Customer Service', count: 18 },
          { action: 'Request Bill', count: 12 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error: unknown) {
      console.error('Error loading analytics:', error);
    }
  };

  // Handle table selection
  const handleTableSelection = (table: Table) => {
    setSelectedTableForQR(table);
    generateQRCode(table);
  };

  // Copy QR code URL
  const copyQRUrl = async () => {
    if (!qrCodeData) return;

    try {
      await navigator.clipboard.writeText(qrCodeData.qrCodeUrl);
      toast.success('QR code link copied');
    } catch (error) {
      console.error('Error copying QR URL:', error);
      toast.error('Error copying link');
    }
  };

  // Copy direct order URL
  const copyOrderUrl = async () => {
    if (!qrCodeData) return;

    try {
      await navigator.clipboard.writeText(qrCodeData.directOrderUrl);
      toast.success('Direct order link copied');
    } catch (error) {
      console.error('Error copying order URL:', error);
      toast.error('Error copying link');
    }
  };

  // Print QR code
  const printQRCode = () => {
    if (!qrCodeData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Table ${qrCodeData.tableNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin: 20px 0; }
              .qr-image { max-width: 300px; height: auto; }
              .table-info { margin: 20px 0; font-size: 18px; }
              .instructions { margin: 20px 0; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <h1>QR Code - Table ${qrCodeData.tableNumber}</h1>
            <div class="qr-container">
              <img src="${qrCodeData.qrCodeUrl}" alt="QR Code" class="qr-image" />
            </div>
            <div class="table-info">
              <p><strong>Table Number:</strong> ${qrCodeData.tableNumber}</p>
              <p><strong>Generated:</strong> ${formatDate(qrCodeData.createdAt)}</p>
            </div>
            <div class="instructions">
              <p>Scan this QR code to access table services</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeUrl;
    link.download = `table-${qrCodeData.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share QR code
  const shareQRCode = async () => {
    if (!qrCodeData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - Table ${qrCodeData.tableNumber}`,
          text: `Scan this QR code to access table services`,
          url: qrCodeData.directOrderUrl
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        toast.error('Error sharing');
      }
    } else {
      copyQRUrl();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Table QR Code Manager"
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'generate'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaQrcode className="inline ml-2" />
            Generate QR Code
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaChartBar className="inline ml-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'print'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaPrint className="inline ml-2" />
            Print & Share
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Generate QR Code */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Table Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Table
                </label>
                <select
                  value={selectedTableForQR?.id || ''}
                  onChange={(e) => {
                    const table = tables.find(t => t.id === e.target.value);
                    if (table) handleTableSelection(table);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.tableNumber} - {table.capacity} seats
                    </option>
                  ))}
                </select>
              </div>

              {/* QR Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  QR Code Settings
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={qrConfig.includeTableInfo}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, includeTableInfo: e.target.checked }))}
                      className="ml-2"
                    />
                    <span className="text-sm">Include table info</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={qrConfig.includeMenuLink}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, includeMenuLink: e.target.checked }))}
                      className="ml-2"
                    />
                    <span className="text-sm">Menu link</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={qrConfig.includeCustomerService}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, includeCustomerService: e.target.checked }))}
                      className="ml-2"
                    />
                    <span className="text-sm">Customer service</span>
                  </label>
                </div>
              </div>
            </div>

            {/* QR Code Display */}
            {qrCodeData && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    QR Code for Table {qrCodeData.tableNumber}
                  </h3>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
                  >
                    {showQR ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showQR && (
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* QR Code Image */}
                    <div className="flex-1 text-center">
                      <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                        <div
                          className="w-48 h-48"
                          style={{
                            backgroundImage: `url(${qrCodeData.qrCodeUrl})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center'
                          }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Scan to access table services
                      </p>
                    </div>

                    {/* QR Code Information */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          QR Code Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Table:</strong> {qrCodeData.tableNumber}</div>
                          <div><strong>Generated:</strong> {formatDate(qrCodeData.createdAt)}</div>
                          <div><strong>Scan Count:</strong> {qrCodeData.scanCount}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Related Links
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={copyOrderUrl}
                            className="flex items-center w-full p-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            <FaLink className="ml-2" />
                            Copy direct order link
                          </button>
                          <button
                            onClick={copyQRUrl}
                            className="flex items-center w-full p-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                          >
                            <FaCopy className="ml-2" />
                            Copy QR code link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate Button */}
            {selectedTableForQR && (
              <div className="text-center">
                <button
                  onClick={() => generateQRCode(selectedTableForQR)}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate New QR Code'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                QR Code Analytics
              </h3>
              {selectedTableForQR && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Table {selectedTableForQR.tableNumber}
                </div>
              )}
            </div>

            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Scans */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics.totalScans}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Total Scans
                  </div>
                </div>

                {/* Unique Scanners */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics.uniqueScanners}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Unique Scanners
                  </div>
                </div>

                {/* Average Scans Per Day */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {analytics.averageScansPerDay}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Avg Scans/Day
                  </div>
                </div>

                {/* Most Active Hours */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analytics.mostActiveHours.join(', ')}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Active Hours
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaChartBar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Select a table to view analytics
                </p>
              </div>
            )}
          </div>
        )}

        {/* Print and Share */}
        {activeTab === 'print' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Print & Share QR Code
              </h3>
              {selectedTableForQR && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Table {selectedTableForQR.tableNumber}
                </div>
              )}
            </div>

            {qrCodeData ? (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={printQRCode}
                    className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <FaPrint className="text-2xl text-blue-600 dark:text-blue-400 mb-2" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">Print</span>
                  </button>

                  <button
                    onClick={downloadQRCode}
                    className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <FaDownload className="text-2xl text-green-600 dark:text-green-400 mb-2" />
                    <span className="text-sm text-green-600 dark:text-green-400">Download</span>
                  </button>

                  <button
                    onClick={shareQRCode}
                    className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <FaShare className="text-2xl text-purple-600 dark:text-purple-400 mb-2" />
                    <span className="text-sm text-purple-600 dark:text-purple-400">Share</span>
                  </button>

                  <button
                    onClick={copyQRUrl}
                    className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <FaCopy className="text-2xl text-orange-600 dark:text-orange-400 mb-2" />
                    <span className="text-sm text-orange-600 dark:text-orange-400">Copy Link</span>
                  </button>
                </div>

                {/* QR Code Preview */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    QR Code Preview
                  </h4>
                  <div className="text-center">
                    <div
                      className="w-32 h-32 mx-auto"
                      style={{
                        backgroundImage: `url(${qrCodeData.qrCodeUrl})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                      }}
                    />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Table {qrCodeData.tableNumber}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaQrcode className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Generate a QR code first to print and share
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}; 