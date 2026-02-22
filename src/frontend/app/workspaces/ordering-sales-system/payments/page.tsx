'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PaymentService } from '../../../../services/orderingService';
import { PaymentMethod, PaymentStatus } from '../../../../types/ordering';
import { formatFarsiDate, formatFarsiDateTime, toFarsiDigits } from '../../../../utils/dateUtils';
import { FarsiDatePicker } from '../../../../components/ui/FarsiDatePicker';
import { FormattedNumberInput } from '../../../../components/ui/FormattedNumberInput';
import { 
  FaDollarSign, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaUndo,
  FaSync,
  FaCashRegister,
  FaChartBar,
  FaFileInvoice,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaMoneyBill,
  FaGlobe,
  FaStar,
  FaLayerGroup
} from 'react-icons/fa';
import Link from 'next/link';

interface Payment {
  id: string;
  paymentNumber: string;
  orderId: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName?: string;
    totalAmount: number;
    status: string;
  };
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  processedBy?: {
    id: string;
    name: string;
  };
  transactionId?: string;
  referenceNumber?: string;
  cardInfo?: {
    terminalId?: string;
    cardMask?: string;
    cardType?: string;
  };
  cashReceived?: number;
  changeAmount?: number;
  refundedAmount?: number;
  refundDate?: string;
  refundReason?: string;
}


interface PaymentStatistics {
  summary: {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
  };
  todaySummary: {
    totalSales: number;
    totalTransactions: number;
    cashSales: number;
    cardSales: number;
    onlineSales: number;
    refunds: number;
  };
  refundsTotal: number;
  refundsCount: number;
  statusBreakdown: Record<string, number>;
  hourlyBreakdown: Record<number, { count: number; amount: number }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

interface CashManagementReport {
  date: string;
  cashIn: number;
  cashOut: number;
  netCash: number;
  transactionCount: number;
  transactions: Payment[];
  openingBalance: number;
  closingBalance: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [cashReport, setCashReport] = useState<CashManagementReport | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCash, setLoadingCash] = useState(false);
  
  // View states
  const [activeView, setActiveView] = useState<'list' | 'statistics' | 'cash'>('list');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  
  // Summary state
  const [summary, setSummary] = useState<{
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
  } | null>(null);

  // Load payments from API
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters: {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
        paymentStatus?: string;
        paymentMethod?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        minAmount?: number;
        maxAmount?: number;
      } = {
        page: currentPage,
        limit: pageSize,
        sortBy: 'paymentDate',
        sortOrder: 'desc' as const,
      };
      
      if (statusFilter !== 'all') {
        filters.paymentStatus = statusFilter;
      }
      
      if (methodFilter !== 'all') {
        filters.paymentMethod = methodFilter;
      }
      
      if (dateFrom) {
        filters.startDate = dateFrom;
      }
      
      if (dateTo) {
        filters.endDate = dateTo;
      }
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      if (minAmount) {
        filters.minAmount = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        filters.maxAmount = parseFloat(maxAmount);
      }
      
      console.log('🔍 [PAYMENTS] Loading payments with filters:', filters);
      const response = await PaymentService.getPayments(filters);
      console.log('✅ [PAYMENTS] Payments response:', response);
      
      // Handle response structure - payments endpoint returns full response object
      let paymentsData: Payment[] = [];
      let paginationData = null;
      let summaryData = null;
      
      if (response && typeof response === 'object') {
        // Response structure: { success: true, data: Payment[], pagination: {}, summary: {} }
        const resp = response as {
          data?: Payment[];
          payments?: Payment[];
          pagination?: {
            total: number;
            totalPages: number;
            currentPage: number;
            limit: number;
          };
          summary?: {
            totalAmount: number;
            transactionCount: number;
            averageAmount: number;
          };
        };
        
        if (Array.isArray(resp)) {
          paymentsData = resp as Payment[];
        } else if (resp.data && Array.isArray(resp.data)) {
          paymentsData = resp.data as Payment[];
          paginationData = resp.pagination;
          summaryData = resp.summary;
        } else if (resp.payments && Array.isArray(resp.payments)) {
          paymentsData = resp.payments as Payment[];
          paginationData = resp.pagination;
          summaryData = resp.summary;
        } else if (Array.isArray(resp)) {
          paymentsData = resp as Payment[];
        }
      }
      
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      
      if (paginationData) {
        setCurrentPage(paginationData.currentPage || 1);
        setTotalPages(paginationData.totalPages || 1);
        setTotalItems(paginationData.total || paymentsData.length);
      }
      
      if (summaryData) {
        setSummary(summaryData);
      }
      
    } catch (error) {
      console.error('❌ [PAYMENTS] Error loading payments:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری پرداخت‌ها';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, methodFilter, dateFrom, dateTo, searchQuery, minAmount, maxAmount]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = dateTo || new Date().toISOString().split('T')[0];
      
      const stats = await PaymentService.getPaymentStatistics(startDate, endDate);
      console.log('✅ [PAYMENTS] Statistics response:', stats);
      
      if (stats && typeof stats === 'object' && 'data' in stats) {
        const statsWithData = stats as { data: PaymentStatistics };
        setStatistics(statsWithData.data);
      } else {
        setStatistics(stats as PaymentStatistics);
      }
    } catch (error) {
      console.error('❌ [PAYMENTS] Error loading statistics:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری آمار پرداخت‌ها';
      toast.error(errorMessage);
    } finally {
      setLoadingStats(false);
    }
  }, [dateFrom, dateTo]);

  // Load cash management report
  const loadCashReport = useCallback(async () => {
    try {
      setLoadingCash(true);
      
      const date = dateTo || new Date().toISOString().split('T')[0];
      
      const report = await PaymentService.getCashManagementReport(date);
      console.log('✅ [PAYMENTS] Cash report response:', report);
      
      if (report && typeof report === 'object' && 'data' in report) {
        const reportWithData = report as { data: CashManagementReport };
        setCashReport(reportWithData.data);
      } else {
        setCashReport(report as CashManagementReport);
      }
    } catch (error) {
      console.error('❌ [PAYMENTS] Error loading cash report:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری گزارش مدیریت نقدی';
      toast.error(errorMessage);
    } finally {
      setLoadingCash(false);
    }
  }, [dateTo]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (activeView === 'statistics') {
      loadStatistics();
    } else if (activeView === 'cash') {
      loadCashReport();
    }
  }, [activeView, loadStatistics, loadCashReport]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('fa-IR').format(Math.abs(amount));
    return `${formatted} تومان`;
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case PaymentStatus.PARTIAL:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case PaymentStatus.REFUNDED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'پرداخت شده';
      case PaymentStatus.PENDING:
        return 'در انتظار';
      case PaymentStatus.PARTIAL:
        return 'جزئی';
      case PaymentStatus.REFUNDED:
        return 'بازگشت شده';
      case PaymentStatus.FAILED:
        return 'ناموفق';
      default:
        return status;
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <FaMoneyBill className="text-green-600" />;
      case PaymentMethod.CARD:
        return <FaCreditCard className="text-blue-600" />;
      case PaymentMethod.ONLINE:
        return <FaGlobe className="text-indigo-600" />;
      case PaymentMethod.POINTS:
        return <FaStar className="text-yellow-600" />;
      case PaymentMethod.MIXED:
        return <FaLayerGroup className="text-purple-600" />;
      default:
        return <FaDollarSign />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return 'نقدی';
      case PaymentMethod.CARD:
        return 'کارت';
      case PaymentMethod.ONLINE:
        return 'آنلاین';
      case PaymentMethod.POINTS:
        return 'امتیاز';
      case PaymentMethod.MIXED:
        return 'ترکیبی';
      default:
        return method;
    }
  };

  const handleRefund = async (paymentId: string, refundAmount: number, reason: string) => {
    try {
      await PaymentService.processRefund(paymentId, refundAmount, reason);
      toast.success('بازگشت وجه با موفقیت انجام شد');
      setShowRefundModal(false);
      setSelectedPayment(null);
      loadPayments();
      if (activeView === 'statistics') {
        loadStatistics();
      }
    } catch (error) {
      console.error('❌ [PAYMENTS] Error processing refund:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بازگشت وجه';
      toast.error(errorMessage);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      await PaymentService.retryPayment(paymentId);
      toast.success('درخواست تکرار پرداخت ارسال شد');
      loadPayments();
    } catch (error) {
      console.error('❌ [PAYMENTS] Error retrying payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در تکرار پرداخت';
      toast.error(errorMessage);
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaDollarSign className="text-amber-500" />
            مدیریت پرداخت‌ها
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت و نظارت بر تمامی پرداخت‌ها و تراکنش‌های مالی
          </p>
        </div>
        <button
          onClick={() => loadPayments()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors w-full sm:w-auto"
        >
          <FaSync />
          بروزرسانی
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveView('list')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${
            activeView === 'list'
              ? 'text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FaFileInvoice className="inline ml-2" />
          فهرست پرداخت‌ها
        </button>
        <button
          onClick={() => setActiveView('statistics')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${
            activeView === 'statistics'
              ? 'text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FaChartBar className="inline ml-2" />
          آمار و گزارش‌ها
        </button>
        <button
          onClick={() => setActiveView('cash')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${
            activeView === 'cash'
              ? 'text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FaCashRegister className="inline ml-2" />
          مدیریت نقدی
        </button>
      </div>

      {/* Filters (shown only in list view) */}
      {activeView === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FaFilter />
            <span className="font-medium">فیلترها</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="جستجو (شماره پرداخت، شماره سفارش، شناسه تراکنش)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value={PaymentStatus.PAID}>پرداخت شده</option>
              <option value={PaymentStatus.PENDING}>در انتظار</option>
              <option value={PaymentStatus.PARTIAL}>جزئی</option>
              <option value={PaymentStatus.REFUNDED}>بازگشت شده</option>
              <option value={PaymentStatus.FAILED}>ناموفق</option>
            </select>
            
            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">همه روش‌ها</option>
              <option value={PaymentMethod.CASH}>نقدی</option>
              <option value={PaymentMethod.CARD}>کارت</option>
              <option value={PaymentMethod.ONLINE}>آنلاین</option>
              <option value={PaymentMethod.POINTS}>امتیاز</option>
              <option value={PaymentMethod.MIXED}>ترکیبی</option>
            </select>
            
            {/* Date From */}
            <FarsiDatePicker
              value={dateFrom}
              onChange={(value) => setDateFrom(value)}
              placeholder="از تاریخ"
              maxDate={dateTo || undefined}
              className="w-auto"
            />
            
            {/* Date To */}
            <FarsiDatePicker
              value={dateTo}
              onChange={(value) => setDateTo(value)}
              placeholder="تا تاریخ"
              minDate={dateFrom || undefined}
              className="w-auto"
            />
            
            {/* Min Amount */}
            <FormattedNumberInput
              value={minAmount}
              onChange={(value: string) => setMinAmount(value)}
              placeholder="حداقل مبلغ (تومان)"
              min={0}
              allowDecimals={false}
              className="w-auto"
            />
            
            {/* Max Amount */}
            <FormattedNumberInput
              value={maxAmount}
              onChange={(value: string) => setMaxAmount(value)}
              placeholder="حداکثر مبلغ (تومان)"
              min={0}
              allowDecimals={false}
              className="w-auto"
            />
          </div>
          
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">مجموع مبالغ</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">تعداد تراکنش‌ها</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {toFarsiDigits(summary.transactionCount)}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">میانگین مبلغ</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(summary.averageAmount)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment List View */}
      {activeView === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FaFileInvoice className="mx-auto text-4xl mb-4 opacity-50" />
              <p>پرداختی یافت نشد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        شماره پرداخت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        سفارش
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        مبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        روش پرداخت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        وضعیت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        تاریخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.paymentNumber || `#${payment.id.slice(-8)}`}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              TX: {payment.transactionId.slice(-8)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/workspaces/ordering-sales-system/orders?orderId=${payment.orderId}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {payment.order?.orderNumber || `#${payment.orderId.slice(-8)}`}
                          </Link>
                          {payment.order?.customerName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payment.order.customerName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            payment.amount < 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.refundedAmount && payment.refundedAmount > 0 && (
                            <div className="text-xs text-red-500 dark:text-red-400">
                              بازگشت: {formatCurrency(payment.refundedAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payment.paymentMethod)}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {getMethodLabel(payment.paymentMethod)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.paymentStatus)}`}>
                            {getStatusLabel(payment.paymentStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatFarsiDateTime(new Date(payment.paymentDate))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="مشاهده جزئیات"
                            >
                              <FaEye />
                            </button>
                            {payment.paymentStatus === PaymentStatus.PAID && payment.amount > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowRefundModal(true);
                                }}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                                title="بازگشت وجه"
                              >
                                <FaUndo />
                              </button>
                            )}
                            {payment.paymentStatus === PaymentStatus.FAILED && (
                              <button
                                onClick={() => handleRetryPayment(payment.id)}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                                title="تکرار پرداخت"
                              >
                                <FaSync />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    نمایش {toFarsiDigits((currentPage - 1) * pageSize + 1)} تا {toFarsiDigits(Math.min(currentPage * pageSize, totalItems))} از {toFarsiDigits(totalItems)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      قبلی
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Statistics View */}
      {activeView === 'statistics' && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          ) : statistics ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مجموع درآمد</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(statistics.summary.totalAmount)}
                      </div>
                    </div>
                    <FaCheckCircle className="text-3xl text-green-500 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تعداد تراکنش‌ها</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {toFarsiDigits(statistics.summary.transactionCount)}
                      </div>
                    </div>
                    <FaFileInvoice className="text-3xl text-blue-500 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">بازگشت‌ها</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                        {formatCurrency(statistics.refundsTotal)}
                      </div>
                    </div>
                    <FaUndo className="text-3xl text-purple-500 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">میانگین مبلغ</div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                        {formatCurrency(statistics.summary.averageAmount)}
                      </div>
                    </div>
                    <FaChartBar className="text-3xl text-orange-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Today's Summary */}
              {statistics.todaySummary && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    خلاصه امروز
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">کل فروش</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(statistics.todaySummary.totalSales)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تراکنش‌ها</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {toFarsiDigits(statistics.todaySummary.totalTransactions)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">نقدی</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(statistics.todaySummary.cashSales)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">کارت</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(statistics.todaySummary.cardSales)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">آنلاین</div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(statistics.todaySummary.onlineSales)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">بازگشت‌ها</div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(statistics.todaySummary.refunds)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Breakdown */}
              {statistics.statusBreakdown && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    توزیع وضعیت پرداخت‌ها
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(statistics.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          {getStatusLabel(status as PaymentStatus)}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {toFarsiDigits(count as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FaChartBar className="mx-auto text-4xl mb-4 opacity-50" />
              <p>آماری یافت نشد</p>
            </div>
          )}
        </div>
      )}

      {/* Cash Management View */}
      {activeView === 'cash' && (
        <div className="space-y-6">
          {loadingCash ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          ) : cashReport ? (
            <>
              {/* Cash Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">ورودی نقدی</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(cashReport.cashIn)}
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">خروجی نقدی</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(cashReport.cashOut)}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">موجودی خالص</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    cashReport.netCash >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(cashReport.netCash)}
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">تعداد تراکنش‌ها</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {toFarsiDigits(cashReport.transactionCount)}
                  </div>
                </div>
              </div>

              {/* Cash Transactions List */}
              {cashReport.transactions && cashReport.transactions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      تراکنش‌های نقدی - {formatFarsiDate(new Date(cashReport.date))}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            شماره پرداخت
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            سفارش
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            مبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            دریافت نقدی
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            باقی‌مانده
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            زمان
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {cashReport.transactions.slice(0, 50).map((payment: Payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {payment.paymentNumber || `#${payment.id.slice(-8)}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/workspaces/ordering-sales-system/orders?orderId=${payment.orderId}`}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {payment.order?.orderNumber || `#${payment.orderId?.slice(-8)}`}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(Math.abs(payment.amount))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {payment.cashReceived ? formatCurrency(payment.cashReceived) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {payment.changeAmount ? formatCurrency(payment.changeAmount) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatFarsiDateTime(new Date(payment.paymentDate))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FaCashRegister className="mx-auto text-4xl mb-4 opacity-50" />
              <p>گزارش مدیریت نقدی یافت نشد</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                جزئیات پرداخت
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimesCircle className="text-2xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">شماره پرداخت</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedPayment.paymentNumber || `#${selectedPayment.id.slice(-8)}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">وضعیت</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.paymentStatus)}`}>
                    {getStatusLabel(selectedPayment.paymentStatus)}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">مبلغ</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(selectedPayment.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">روش پرداخت</div>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(selectedPayment.paymentMethod)}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getMethodLabel(selectedPayment.paymentMethod)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">تاریخ پرداخت</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatFarsiDateTime(new Date(selectedPayment.paymentDate))}
                  </div>
                </div>
                {selectedPayment.processedBy && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">پردازش شده توسط</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.processedBy.name}
                    </div>
                  </div>
                )}
                {selectedPayment.transactionId && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">شناسه تراکنش</div>
                    <div className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                      {selectedPayment.transactionId}
                    </div>
                  </div>
                )}
                {selectedPayment.referenceNumber && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">شماره مرجع</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.referenceNumber}
                    </div>
                  </div>
                )}
                {selectedPayment.order && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">شماره سفارش</div>
                      <Link
                        href={`/workspaces/ordering-sales-system/orders?orderId=${selectedPayment.orderId}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedPayment.order.orderNumber}
                      </Link>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مشتری</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedPayment.order.customerName || 'بدون نام'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مبلغ سفارش</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(selectedPayment.order.totalAmount)}
                      </div>
                    </div>
                  </>
                )}
                {selectedPayment.cashReceived && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">مبلغ دریافت شده</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedPayment.cashReceived)}
                    </div>
                  </div>
                )}
                {selectedPayment.changeAmount && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">باقی‌مانده</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedPayment.changeAmount)}
                    </div>
                  </div>
                )}
                {selectedPayment.cardInfo && (
                  <>
                    {selectedPayment.cardInfo.terminalId && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">ترمینال</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedPayment.cardInfo.terminalId}
                        </div>
                      </div>
                    )}
                    {selectedPayment.cardInfo.cardMask && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">شماره کارت</div>
                        <div className="font-medium text-gray-900 dark:text-white font-mono">
                          ****{selectedPayment.cardInfo.cardMask}
                        </div>
                      </div>
                    )}
                    {selectedPayment.cardInfo.cardType && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">نوع کارت</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedPayment.cardInfo.cardType}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedPayment.refundedAmount && selectedPayment.refundedAmount > 0 && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مبلغ بازگشت شده</div>
                      <div className="font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(selectedPayment.refundedAmount)}
                      </div>
                    </div>
                    {selectedPayment.refundDate && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">تاریخ بازگشت</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatFarsiDateTime(new Date(selectedPayment.refundDate))}
                        </div>
                      </div>
                    )}
                    {selectedPayment.refundReason && (
                      <div className="col-span-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">دلیل بازگشت</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedPayment.refundReason}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                بستن
              </button>
              {selectedPayment.paymentStatus === PaymentStatus.PAID && selectedPayment.amount > 0 && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowRefundModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  بازگشت وجه
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                بازگشت وجه
              </h3>
            </div>
            <RefundForm
              payment={selectedPayment}
              onRefund={handleRefund}
              onCancel={() => {
                setShowRefundModal(false);
                setSelectedPayment(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Refund Form Component
function RefundForm({
  payment,
  onRefund,
  onCancel
}: {
  payment: Payment;
  onRefund: (paymentId: string, refundAmount: number, reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [refundAmount, setRefundAmount] = useState<string>(Math.abs(payment.amount).toString());
  const [reason, setReason] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) {
      toast.error('مبلغ بازگشت باید بیشتر از صفر باشد');
      return;
    }
    
    if (amount > Math.abs(payment.amount)) {
      toast.error('مبلغ بازگشت نمی‌تواند بیشتر از مبلغ پرداخت باشد');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('لطفاً دلیل بازگشت را وارد کنید');
      return;
    }
    
    try {
      setProcessing(true);
      await onRefund(payment.id, amount, reason.trim());
    } catch {
      // Error handled in parent
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          مبلغ بازگشت (تومان)
        </label>
        <FormattedNumberInput
          value={refundAmount}
          onChange={(value: string) => setRefundAmount(value)}
          placeholder="مبلغ بازگشت (تومان)"
          min={0}
          max={Math.abs(payment.amount)}
          allowDecimals={false}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          حداکثر مبلغ قابل بازگشت: {new Intl.NumberFormat('fa-IR').format(Math.abs(payment.amount))} تومان
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          دلیل بازگشت <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={3}
          placeholder="دلیل بازگشت وجه را وارد کنید..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={processing}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {processing ? 'در حال پردازش...' : 'تأیید بازگشت وجه'}
        </button>
      </div>
    </form>
  );
}

