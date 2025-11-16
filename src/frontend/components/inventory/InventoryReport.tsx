'use client';

import { useState } from 'react';
import { InventoryEntry, InventoryEntryType, Item } from '../../../shared/types';
import { formatDate } from '../../utils/dateUtils';
import axios from 'axios';
import { getToken } from '../../services/authService';
import { FarsiDatePicker } from '../ui/FarsiDatePicker';

interface InventoryReportProps {
  items: Item[];
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  itemId: string;
  type: string;
}

interface ReportSummary {
  totalEntries: number;
  totalIn: number;
  totalOut: number;
  itemSummary: Record<string, {
    name: string;
    totalIn: number;
    totalOut: number;
    net: number;
  }>;
}

interface ReportData {
  entries: InventoryEntry[];
  summary: ReportSummary;
}

import { API_URL } from '../../lib/apiUtils';

export const InventoryReport: React.FC<InventoryReportProps> = ({ items }) => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    itemId: '',
    type: '',
  });
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.itemId) queryParams.append('itemId', filters.itemId);
      if (filters.type) queryParams.append('type', filters.type);
      
      // Get token for authentication
      const token = getToken();
      
      // Make API request
      const response = await axios.get(`${API_URL}/inventory/report?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReport(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('خطا در تولید گزارش');
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      itemId: '',
      type: '',
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">گزارش موجودی</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <FarsiDatePicker
            label="از تاریخ"
            value={filters.startDate}
            onChange={(value) => handleFilterChange('startDate', value)}
            placeholder="از تاریخ را انتخاب کنید"
            maxDate={filters.endDate || undefined}
          />
        </div>
        
        <div>
          <FarsiDatePicker
            label="تا تاریخ"
            value={filters.endDate}
            onChange={(value) => handleFilterChange('endDate', value)}
            placeholder="تا تاریخ را انتخاب کنید"
            minDate={filters.startDate || undefined}
          />
        </div>
        
        <div>
          <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            کالا
          </label>
          <select
            id="itemId"
            value={filters.itemId}
            onChange={(e) => handleFilterChange('itemId', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">همه کالاها</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نوع تراکنش
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">همه</option>
            <option value="IN">ورود</option>
            <option value="OUT">خروج</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-between mb-8">
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          پاک کردن فیلترها
        </button>
        
        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'در حال تولید گزارش...' : 'تولید گزارش'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">تعداد کل تراکنش‌ها</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{report.summary.totalEntries}</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">جمع ورودی‌ها</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{report.summary.totalIn}</p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">جمع خروجی‌ها</h3>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{report.summary.totalOut}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">خلاصه به تفکیک کالا</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      کالا
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ورودی
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      خروجی
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      موجودی خالص
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(report.summary.itemSummary).map(([itemId, data]) => (
                    <tr key={itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{data.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">{data.totalIn}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600 dark:text-red-400 font-medium">{data.totalOut}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          data.net > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : data.net < 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {data.net}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {report.entries.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">تراکنش‌ها</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        کالا
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        نوع
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        مقدار
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        کاربر
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        تاریخ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {report.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.item?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.type === InventoryEntryType.IN ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                              ورود
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
                              خروج
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {entry.quantity} {entry.item?.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{entry.user?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(entry.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 