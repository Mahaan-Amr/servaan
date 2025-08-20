'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FaHistory, 
  FaSearch, 
  FaFilter,
  FaDownload,
  FaCheck,
  FaClock,
  FaTimes,
  FaExclamationTriangle,
  FaEye,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { AlertBox } from '../../../../components/ui/AlertBox';
import { Spinner } from '../../../../components/ui/Spinner';
import { Modal } from '../../../../components/ui/Modal';

interface SMSMessage {
  id: string;
  type: 'invitation' | 'verification' | 'welcome' | 'alert' | 'bulk';
  recipient: string;
  recipientName?: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  deliveredAt?: string;
  messageId?: string;
  cost: number;
  errorMessage?: string;
}

interface Filters {
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
}

const SMSHistoryPage = () => {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SMSMessage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  const messagesPerPage = 20;

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Mock data - in real implementation, this would come from the backend
      const mockMessages: SMSMessage[] = Array.from({ length: 150 }, (_, index) => ({
        id: `msg-${index + 1}`,
        type: (['invitation', 'verification', 'welcome', 'alert', 'bulk'] as const)[Math.floor(Math.random() * 5)],
        recipient: `0912345${String(index).padStart(4, '0')}`,
        recipientName: index % 3 === 0 ? `کاربر ${index + 1}` : undefined,
        message: `پیام نمونه شماره ${index + 1}`,
        status: (['sent', 'delivered', 'failed', 'pending'] as const)[Math.floor(Math.random() * 4)],
        sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR') + ' ' + 
               new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        deliveredAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR') + ' ' + 
                    new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : undefined,
        messageId: `msg-id-${index + 1}`,
        cost: 1,
        errorMessage: Math.random() > 0.8 ? 'خطای شبکه' : undefined
      }));

      // Apply filters
      let filteredMessages = mockMessages;
      
      if (filters.type) {
        filteredMessages = filteredMessages.filter(msg => msg.type === filters.type);
      }
      
      if (filters.status) {
        filteredMessages = filteredMessages.filter(msg => msg.status === filters.status);
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredMessages = filteredMessages.filter(msg => 
          msg.recipient.includes(query) ||
          msg.recipientName?.toLowerCase().includes(query) ||
          msg.message.toLowerCase().includes(query)
        );
      }

      // Pagination
      const total = filteredMessages.length;
      const startIndex = (currentPage - 1) * messagesPerPage;
      const paginatedMessages = filteredMessages.slice(startIndex, startIndex + messagesPerPage);

      setMessages(paginatedMessages);
      setTotalPages(Math.ceil(total / messagesPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری تاریخچه');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: ''
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['نوع', 'گیرنده', 'نام', 'پیام', 'وضعیت', 'تاریخ ارسال', 'تاریخ تحویل', 'هزینه'];
    const csvContent = [
      headers.join(','),
      ...messages.map(msg => [
        getTypeText(msg.type),
        msg.recipient,
        msg.recipientName || '',
        `"${msg.message}"`,
        getStatusText(msg.status),
        msg.sentAt,
        msg.deliveredAt || '',
        msg.cost
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sms-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'invitation': return 'دعوت‌نامه';
      case 'verification': return 'تایید';
      case 'welcome': return 'خوش‌آمدگویی';
      case 'alert': return 'هشدار';
      case 'bulk': return 'گروهی';
      default: return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'ارسال شده';
      case 'delivered': return 'تحویل شده';
      case 'failed': return 'ناموفق';
      case 'pending': return 'در انتظار';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <FaCheck className="w-4 h-4 text-green-500" />;
      case 'sent':
        return <FaClock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <FaTimes className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <FaClock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FaExclamationTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invitation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'verification':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'welcome':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'alert':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'bulk':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <FaHistory className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                تاریخچه پیامک‌ها
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                مشاهده و مدیریت تاریخچه ارسال پیامک‌ها
              </p>
            </div>
          </div>
          
          <button
            onClick={exportToCSV}
            className="btn btn-outline"
            disabled={messages.length === 0}
          >
            <FaDownload className="w-4 h-4 ml-2" />
            خروجی CSV
          </button>
        </div>
      </div>

      {error && <AlertBox type="error" message={error} />}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <FaFilter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">فیلترها</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در پیامک‌ها..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="form-input pr-10"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="form-input"
          >
            <option value="">همه انواع</option>
            <option value="invitation">دعوت‌نامه</option>
            <option value="verification">تایید</option>
            <option value="welcome">خوش‌آمدگویی</option>
            <option value="alert">هشدار</option>
            <option value="bulk">گروهی</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="form-input"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="delivered">تحویل شده</option>
            <option value="sent">ارسال شده</option>
            <option value="pending">در انتظار</option>
            <option value="failed">ناموفق</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            placeholder="از تاریخ"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="form-input"
          />

          {/* Date To */}
          <input
            type="date"
            placeholder="تا تاریخ"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Clear Filters */}
        {(filters.type || filters.status || filters.dateFrom || filters.dateTo || filters.searchQuery) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              پاک کردن فیلترها
            </button>
          </div>
        )}
      </div>

      {/* Messages Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              لیست پیامک‌ها
            </h3>
            {loading && <Spinner size="small" />}
          </div>
        </div>

        {messages.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      نوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      گیرنده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      پیام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      تاریخ ارسال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      هزینه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                          {getTypeText(message.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                            {message.recipient}
                          </div>
                          {message.recipientName && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {message.recipientName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {message.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                          {getStatusIcon(message.status)}
                          <span className="mr-1">{getStatusText(message.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {message.sentAt}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {message.cost.toLocaleString('fa-IR')} پیامک
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedMessage(message);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FaHistory className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {loading ? 'در حال بارگذاری...' : 'پیامکی یافت نشد'}
            </h3>
            {!loading && (
              <p className="text-gray-500 dark:text-gray-400">
                ممکن است فیلترهای اعمال شده خیلی محدود باشند
              </p>
            )}
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {showDetails && selectedMessage && (
        <Modal
          title="جزئیات پیامک"
          onClose={() => setShowDetails(false)}
          size="large"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">نوع پیامک</label>
                <p className="text-sm text-gray-900 dark:text-white">{getTypeText(selectedMessage.type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">وضعیت</label>
                <p className="text-sm text-gray-900 dark:text-white">{getStatusText(selectedMessage.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">گیرنده</label>
                <p className="text-sm text-gray-900 dark:text-white" dir="ltr">{selectedMessage.recipient}</p>
              </div>
              {selectedMessage.recipientName && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">نام گیرنده</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.recipientName}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاریخ ارسال</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.sentAt}</p>
              </div>
              {selectedMessage.deliveredAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاریخ تحویل</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.deliveredAt}</p>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">متن پیامک</label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            {selectedMessage.errorMessage && (
              <div>
                <label className="text-sm font-medium text-red-600 dark:text-red-400">پیام خطا</label>
                <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {selectedMessage.errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="btn btn-outline"
              >
                بستن
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SMSHistoryPage; 