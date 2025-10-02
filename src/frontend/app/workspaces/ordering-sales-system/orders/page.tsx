'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { OrderService } from '../../../../services/orderingService';
import type { OrderStatus } from '../../../../types/ordering';
import OrderEditModal from '../pos/components/OrderEditModal';
import { FaUtensils, FaTruck, FaList, FaSearch, FaEdit, FaTrash, FaTable, FaTh, FaList as FaListView } from 'react-icons/fa';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  friendlyOrderNumber: string; // Display: order number
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED' | 'PARTIALLY_PAID';
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  orderDate: string;
  estimatedTime?: number;
  guestCount?: number;
  notes?: string;
  items: OrderItem[];
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID';
  paidAmount?: number;
  remainingAmount?: number;
}

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: string[];
  specialRequest?: string;
}

// API Response interfaces
interface ApiOrderItem {
  id?: string;
  itemName?: string;
  name?: string;
  quantity?: number;
  unitPrice?: string | number;
  totalPrice?: string | number;
  modifiers?: string[];
  specialRequest?: string;
}

interface ApiOrder {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  table?: {
    tableNumber?: string;
    tableName?: string; // Added for table name display
  };
  orderType?: string;
  status?: string;
  totalAmount?: string | number;
  subtotal?: string | number;
  taxAmount?: string | number;
  serviceCharge?: string | number;
  orderDate?: string;
  estimatedTime?: number;
  guestCount?: number;
  notes?: string;
  items?: ApiOrderItem[];
}

// Helper function to safely convert to number
const safeParseFloat = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

export default function OrdersPage() {
  const toFriendlyOrderNumber = (raw: string | undefined, id: string): string => {
    if (!raw) return `#${id.slice(-6)}`;
    // If it's purely numeric and looks like a date+sequence (e.g., 202510010006),
    // show only the trailing sequence (last 4 digits), stripped of leading zeros
    if (/^\d+$/.test(raw)) {
      const seq = raw.slice(-4); // supports up to 9999 per day
      const n = parseInt(seq, 10);
      return isNaN(n) ? raw : String(n);
    }
    // Otherwise, extract the final numeric group
    const matches = raw.match(/\d+(?!.*\d)/);
    if (matches && matches[0]) {
      const n = parseInt(matches[0], 10);
      if (!isNaN(n)) return String(n);
    }
    return raw;
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Order Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // Tab and filter states
  const [activeTab, setActiveTab] = useState<'all' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('CONFIRMED' as OrderStatus);

  // Check for redirect from POS
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPOS = urlParams.get('fromPOS');
    const orderType = urlParams.get('orderType');
    
    if (fromPOS === 'true' && orderType === 'DINE_IN') {
      setActiveTab('DINE_IN');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success('سفارش با موفقیت ثبت شد و به بخش صرف در محل منتقل شدید');
    }
  }, []);

  // Load orders from API
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading orders from API...');
      const response = await OrderService.getOrders();
      console.log('API response received:', Array.isArray(response) ? response.length : 'not an array', 'orders');
      
      if (response && Array.isArray(response)) {
        console.log('Raw API order sample:', response.slice(0, 2).map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber })));
        console.log('Raw API order sample (expanded):', response.slice(0, 2));
        console.log('Raw API order sample - STATUS CHECK:', response.slice(0, 2).map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber })));
        const transformedOrders: Order[] = response.map((order: ApiOrder) => {
          // Generate a more user-friendly order identifier
          // Keep for potential future use; ensures consistent Date object creation
          // const orderDate = new Date(order.orderDate || new Date());
          
          // Create a user-friendly numeric-only order identifier
          const friendlyOrderNumber = toFriendlyOrderNumber(order.orderNumber, order.id);
          
          // Handle table name display
          let tableDisplayName = '';
          if (order.table) {
            // Match the table management page display logic exactly
            // If tableName exists, use it as the main title
            // If not, use "میز {tableNumber}" as fallback
            tableDisplayName = order.table.tableName || `میز ${order.table.tableNumber}`;
          }
          
          return {
            id: order.id,
            orderNumber: order.orderNumber || `#${order.id.slice(-6)}`,
            friendlyOrderNumber, // Add user-friendly identifier
            customerName: order.customerName || 'مشتری ناشناس',
            customerPhone: order.customerPhone || '',
            tableNumber: tableDisplayName, // Use the improved table display name
            orderType: (order.orderType as 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') || 'DINE_IN',
            status: (order.status as 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED' | 'PARTIALLY_PAID') || 'PENDING',
            totalAmount: safeParseFloat(order.totalAmount),
            subtotal: safeParseFloat(order.subtotal),
            taxAmount: safeParseFloat(order.taxAmount),
            serviceCharge: safeParseFloat(order.serviceCharge),
            orderDate: order.orderDate || new Date().toISOString(),
            estimatedTime: order.estimatedTime || 0,
            guestCount: order.guestCount || 0,
            notes: order.notes || '',
            items: (order.items || []).map((item: ApiOrderItem) => ({
              id: item.id || '',
              itemId: item.id || '', // Add itemId for compatibility
              itemName: item.itemName || item.name || 'آیتم ناشناس',
              quantity: item.quantity || 0,
              unitPrice: safeParseFloat(item.unitPrice),
              totalPrice: safeParseFloat(item.totalPrice),
              modifiers: item.modifiers || [],
              specialRequest: item.specialRequest || ''
            })),
            paymentStatus: 'PENDING' as const,
            paidAmount: 0,
            remainingAmount: safeParseFloat(order.totalAmount)
          };
        });
        
        console.log('Setting orders state with', transformedOrders.length, 'orders');
        console.log('Sample transformed orders:', transformedOrders.slice(0, 3).map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber })));
        console.log('Sample transformed orders (expanded):', transformedOrders.slice(0, 3));
        console.log('Sample transformed orders - STATUS CHECK:', transformedOrders.slice(0, 3).map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber })));
        console.log('Status mapping test - COMPLETED should be:', getStatusLabel('COMPLETED'));
        console.log('Status mapping test - CONFIRMED should be:', getStatusLabel('CONFIRMED'));
        setOrders(transformedOrders);
        setFilteredOrders(transformedOrders);
        console.log('Orders state updated');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('خطا در بارگذاری سفارش‌ها');
    } finally {
      setLoading(false);
    }
    }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filter orders based on current tab and filters
  useEffect(() => {
    let filtered = orders;

    // TEMPORARILY: Show all orders to debug the status issue
    // TODO: Restore proper date filtering after fixing the status display
    // const now = new Date();
    // const startOfToday = new Date(now);
    // startOfToday.setHours(0, 0, 0, 0);
    // const endOfToday = new Date(now);
    // endOfToday.setHours(23, 59, 59, 999);

    // filtered = filtered.filter((order) => {
    //   const d = new Date(order.orderDate);
    //   const isToday = d >= startOfToday && d <= endOfToday;
    //   const isCarryOver = d < startOfToday && order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
    //   return isToday || isCarryOver;
    // });

    // Filter by order type (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.orderType === activeTab);
      
      // For DINE_IN orders, show all orders including completed ones
      // (removed the filter that was hiding completed orders)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.friendlyOrderNumber.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerPhone?.includes(query) ||
        order.tableNumber?.includes(query)
      );
    }

    console.log('Filtering result:', {
      totalOrders: orders.length,
      filteredCount: filtered.length,
      activeTab,
      statusFilter,
      searchQuery,
      sampleFiltered: filtered.slice(0, 3).map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber }))
    });
    console.log('Filtering result - STATUS CHECK:', filtered.slice(0, 3).map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber })));
    setFilteredOrders(filtered);
  }, [orders, activeTab, statusFilter, searchQuery]);

  const formatPrice = (amount: number) => {
    const formatted = new Intl.NumberFormat('fa-IR').format(amount);
    return `${formatted} تومان`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CONFIRMED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'READY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SERVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MODIFIED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'ثبت شده';
      case 'CONFIRMED':
        return 'تایید شده';
      case 'PREPARING':
        return 'در حال آماده‌سازی';
      case 'READY':
        return 'آماده';
      case 'SERVED':
        return 'سرو شده';
      case 'COMPLETED':
        return 'تکمیل شده';
      case 'CANCELLED':
        return 'لغو شده';
      case 'MODIFIED':
        return 'ویرایش شده';
      case 'PARTIALLY_PAID':
        return 'پرداخت جزئی';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return 'صرف در محل';
      case 'TAKEAWAY':
        return 'بیرون بر';
      case 'DELIVERY':
        return 'تحویل';
      default:
        return type;
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این سفارش را لغو کنید؟')) {
      try {
        await OrderService.cancelOrder(orderId, 'Cancelled by user');
        
        // Update local state instead of reloading all orders
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'CANCELLED' as const }
              : order
          )
        );
        
        setFilteredOrders(prevFiltered => 
          prevFiltered.map(order => 
            order.id === orderId 
              ? { ...order, status: 'CANCELLED' as const }
              : order
          )
        );
        
        toast.success('سفارش با موفقیت لغو شد');
      } catch (error) {
        console.error('Error cancelling order:', error);
        
        // Handle specific error cases
        let errorMessage = 'خطا در لغو سفارش';
        
        if (error instanceof Error) {
          if (error.message.includes('already completed or cancelled')) {
            errorMessage = 'این سفارش قبلاً تکمیل شده یا لغو شده است';
          } else if (error.message.includes('not found')) {
            errorMessage = 'سفارش یافت نشد';
          } else {
            errorMessage = error.message;
          }
        } else if (typeof error === 'object' && error !== null) {
          const apiError = error as { message?: string; error?: string; details?: string };
          if (apiError.message) {
            if (apiError.message.includes('already completed or cancelled')) {
              errorMessage = 'این سفارش قبلاً تکمیل شده یا لغو شده است';
            } else {
              errorMessage = apiError.message;
            }
          } else if (apiError.error) {
            errorMessage = apiError.error;
          } else if (apiError.details) {
            errorMessage = apiError.details;
          }
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const handleOrderUpdated = () => {
    loadOrders();
    setShowEditModal(false);
    setEditingOrder(null);
  };

  const getStats = () => {
    const filtered = filteredOrders;
    return {
      total: filtered.length,
      submitted: filtered.filter(o => o.status === 'SUBMITTED').length,
      preparing: filtered.filter(o => o.status === 'PREPARING').length,
      ready: filtered.filter(o => o.status === 'READY').length,
      completed: filtered.filter(o => o.status === 'COMPLETED').length,
      cancelled: filtered.filter(o => o.status === 'CANCELLED').length
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus as OrderStatus);
      
      // Update local state instead of reloading all orders
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED' | 'PARTIALLY_PAID' }
            : order
        )
      );
      
      setFilteredOrders(prevFiltered => 
        prevFiltered.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED' | 'PARTIALLY_PAID' }
            : order
        )
      );
      
      toast.success('وضعیت سفارش با موفقیت به‌روزرسانی شد');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطا در به‌روزرسانی وضعیت سفارش');
    }
  };

  // Show full list so we can jump directly to any status (except invalid transitions)
  const getNextStatusOptions = (currentStatus: string) => {
    const all: Array<OrderStatus> = ['SUBMITTED' as OrderStatus,'CONFIRMED' as OrderStatus,'PREPARING' as OrderStatus,'READY' as OrderStatus,'SERVED' as OrderStatus,'COMPLETED' as OrderStatus,'CANCELLED' as OrderStatus];
    // Cannot transition from COMPLETED/CANCELLED
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') return [];
    // Allow selecting any different status
    return all.filter(s => s !== currentStatus);
  };

  // Helper function to check if order can be cancelled
  const canCancelOrder = (status: string) => {
    return !['COMPLETED', 'CANCELLED'].includes(status);
  };

  const stats = getStats();
  // Selection helpers
  const toggleSelect = (orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      return next;
    });
  };

  // const selectAllVisible = () => {
  //   setSelectedIds(new Set(filteredOrders.map(o => o.id)));
  // };

  const clearSelection = () => setSelectedIds(new Set());

  const allowedBulkStatuses = ['SUBMITTED','CONFIRMED','PREPARING','READY','SERVED','COMPLETED','CANCELLED'] as OrderStatus[];

  const bulkUpdateOrderStatus = async (target: 'selected' | 'all', status: OrderStatus) => {
    try {
      const targetIds = target === 'selected' ? Array.from(selectedIds) : filteredOrders.map(o => o.id);
      if (targetIds.length === 0) {
        toast.error('هیچ سفارشی انتخاب نشده است');
        return;
      }

      console.log(`Bulk updating ${targetIds.length} orders to status: ${status}`);
      
      // Use the new bulk API endpoint
      const result = await OrderService.bulkUpdateOrderStatus(targetIds, status) as {
        summary: { successful: number; failed: number; total: number };
        results: Array<{ success: boolean; orderId: string; orderNumber?: string; oldStatus?: string; newStatus: string; error?: string }>;
      };
      
      console.log('Bulk update result:', result);
      
      if (result.summary.successful > 0) {
        // Update local state for successful orders
        const successfulIds = result.results
          .filter((r) => r.success)
          .map((r) => r.orderId);
        
        console.log('Successful order IDs:', successfulIds);
        console.log('Current orders before update:', orders.length);
        console.log('Current filtered orders before update:', filteredOrders.length);
        
        setOrders(prev => {
          const updated = prev.map(o => successfulIds.includes(o.id) ? { ...o, status: status as OrderStatus } as Order : o);
          console.log('Orders after local update:', updated.length);
          console.log('Updated orders sample:', updated.slice(0, 3).map(o => ({ id: o.id, status: o.status })));
          return updated;
        });
        
        setFilteredOrders(prev => {
          const updated = prev.map(o => successfulIds.includes(o.id) ? { ...o, status: status as OrderStatus } as Order : o);
          console.log('Filtered orders after local update:', updated.length);
          console.log('Updated filtered orders sample:', updated.slice(0, 3).map(o => ({ id: o.id, status: o.status })));
          return updated;
        });
        
        console.log('About to reload orders from server...');
        // Reload orders to ensure we have the latest data from server
        await loadOrders();
        console.log('Orders reloaded from server');
      }
      
      if (result.summary.failed > 0) {
        const failedResults = result.results.filter((r) => !r.success);
        console.error('Failed orders:', failedResults);
        toast.error(`خطا در تغییر وضعیت ${result.summary.failed} سفارش از ${result.summary.total} سفارش`);
      } else {
        toast.success(`وضعیت ${result.summary.successful} سفارش با موفقیت تغییر کرد`);
      }
      
      clearSelection();
    } catch (e) {
      console.error('Bulk update error:', e);
      toast.error('خطا در تغییر گروهی وضعیت سفارش‌ها');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

   return (
     <div className="h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
       <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            مدیریت سفارش‌ها
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            مشاهده و مدیریت تمام سفارش‌های سیستم
          </p>
        </div>

         {/* POS Button */}
         <div className="flex justify-end mb-4 sm:mb-6">
           <Link href="/workspaces/ordering-sales-system/pos">
             <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-auto sm:w-auto">
               <FaUtensils className="inline mr-1 sm:mr-2" />
               ثبت سفارش جدید
             </button>
         </Link>
       </div>

         {/* Statistics Cards */}
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-3 mb-3 sm:mb-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-1.5 sm:p-3 shadow-sm">
             <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
             <div className="text-xs text-gray-600 dark:text-gray-400">کل سفارش‌ها</div>
           </div>
           <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 sm:p-3 shadow-sm">
             <div className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400">{stats.submitted}</div>
             <div className="text-xs text-blue-600 dark:text-blue-400">ثبت شده</div>
           </div>
           <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-1.5 sm:p-3 shadow-sm">
             <div className="text-base sm:text-xl font-bold text-orange-600 dark:text-orange-400">{stats.preparing}</div>
             <div className="text-xs text-orange-600 dark:text-orange-400">در حال آماده‌سازی</div>
           </div>
           <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5 sm:p-3 shadow-sm">
             <div className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400">{stats.ready}</div>
             <div className="text-xs text-green-600 dark:text-green-400">آماده</div>
           </div>
           <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5 sm:p-3 shadow-sm">
             <div className="text-base sm:text-xl font-bold text-purple-600 dark:text-purple-400">{stats.completed}</div>
             <div className="text-xs text-purple-600 dark:text-purple-400">تکمیل شده</div>
           </div>
           <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1.5 sm:p-3 shadow-sm">
             <div className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</div>
             <div className="text-xs text-red-600 dark:text-red-400">لغو شده</div>
           </div>
         </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-3 sm:mb-4">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-3 sm:space-x-6 space-x-reverse px-2 sm:px-6 overflow-x-auto whitespace-nowrap" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FaList className="inline ml-2" />
                همه سفارش‌ها
              </button>
              <button
                onClick={() => setActiveTab('DINE_IN')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'DINE_IN'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FaTable className="inline ml-2" />
                صرف در محل
              </button>
              <button
                onClick={() => setActiveTab('TAKEAWAY')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'TAKEAWAY'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FaUtensils className="inline ml-2" />
                بیرون بر
              </button>
              <button
                onClick={() => setActiveTab('DELIVERY')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'DELIVERY'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FaTruck className="inline ml-2" />
                تحویل
              </button>
            </nav>
          </div>
        </div>

        {/* Filters + Bulk actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 sm:p-4 mb-3 sm:mb-4">
           <div className="flex flex-col md:flex-row gap-2 sm:gap-3 items-stretch md:items-center">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="جستجو در سفارش‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-start space-x-2 sm:space-x-4 space-x-reverse w-full md:w-auto">
              {/* Bulk actions */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                  className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {allowedBulkStatuses.map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
                <button
                  onClick={() => bulkUpdateOrderStatus('selected', bulkStatus)}
                  className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs sm:text-sm hover:bg-amber-600 disabled:opacity-50"
                  disabled={selectedIds.size === 0}
                  title="تغییر وضعیت سفارش‌های انتخاب‌شده"
                >
                  اعمال به انتخاب‌شده‌ها ({selectedIds.size})
                </button>
                <button
                  onClick={() => bulkUpdateOrderStatus('all', bulkStatus)}
                  className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs sm:text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="تغییر وضعیت همه سفارش‌های لیست فعلی"
                >
                  اعمال به همه
                </button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="SUBMITTED">ثبت شده</option>
                <option value="CONFIRMED">تایید شده</option>
                <option value="PREPARING">در حال آماده‌سازی</option>
                <option value="READY">آماده</option>
                <option value="SERVED">سرو شده</option>
                <option value="COMPLETED">تکمیل شده</option>
                <option value="CANCELLED">لغو شده</option>
                <option value="MODIFIED">ویرایش شده</option>
                <option value="PARTIALLY_PAID">پرداخت جزئی</option>
              </select>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <FaTh />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <FaListView />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Display */}
        {activeTab === 'DINE_IN' ? (
          // Table-like layout for dine-in orders
          <div>
            {/* Info message for DINE_IN orders */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaTable className="h-5 w-5 text-blue-400" />
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    سفارش‌های صرف در محل
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>در این بخش فقط سفارش‌های فعال (غیر از تکمیل شده و لغو شده) نمایش داده می‌شوند.</p>
                    <p className="mt-1">برای ایجاد سفارش جدید، از دکمه &quot;پیش‌فروشگاه&quot; استفاده کنید.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FaTable className="text-lg" />
                        <span className="font-bold text-lg">{order.tableNumber || 'نامشخص'}</span>
                      </div>
                      <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                        {order.friendlyOrderNumber}
                      </span>
                    </div>
        </div>

                  {/* Order Details */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Customer Info */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">مشتری:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customerName || 'مشتری ناشناس'}
                        </span>
          </div>

                      {/* Order Status */}
                <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      {/* Total Amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">مبلغ کل:</span>
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {formatPrice(order.totalAmount)}
                        </span>
                    </div>

                      {/* Order Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">تاریخ:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(order.orderDate).toLocaleDateString('fa-IR')} - {new Date(order.orderDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Guest Count */}
                      {order.guestCount && order.guestCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">تعداد مهمان:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                              {order.guestCount} نفر
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="flex-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <FaEdit className="ml-1" />
                        ویرایش
                      </button>
                      
                      {canCancelOrder(order.status) && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <FaTrash className="ml-1" />
                          لغو
                          </button>
                        )}
                      </div>

                    {/* Status Change Buttons */}
                    {getNextStatusOptions(order.status).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">تغییر وضعیت:</div>
                        <div className="flex flex-wrap gap-1">
                        {getNextStatusOptions(order.status).map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className="px-2 py-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded transition-colors"
                          >
                            {getStatusLabel(nextStatus)}
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
           // Mobile Card View
           <div className="block md:hidden space-y-2">
             {filteredOrders.map((order) => (
               <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                 <div className="flex items-center justify-between mb-1">
                   <div className="flex items-center space-x-2 space-x-reverse">
                   <span className="text-sm font-medium text-gray-900 dark:text-white">{order.friendlyOrderNumber}</span>
                     <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                       {getStatusLabel(order.status)}
                     </span>
                   </div>
                   <div className="flex items-center space-x-1 space-x-reverse">
                     <button
                       onClick={() => handleEditOrder(order)}
                       className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 p-1"
                     >
                       <FaEdit className="text-xs" />
                     </button>
                     {canCancelOrder(order.status) && (
                       <button
                         onClick={() => cancelOrder(order.id)}
                         className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                       >
                         <FaTrash className="text-xs" />
                       </button>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                   <span>{order.customerName || 'مشتری ناشناس'} • {getTypeLabel(order.orderType)}</span>
                   <span>{formatPrice(order.totalAmount)} • {new Date(order.orderDate).toLocaleDateString('fa-IR')}</span>
                 </div>
                 
                 {getNextStatusOptions(order.status).length > 0 && (
                   <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                     <select
                       onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                       className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       defaultValue=""
                     >
                       <option value="" disabled>تغییر وضعیت</option>
                       {getNextStatusOptions(order.status).map((nextStatus) => (
                         <option key={nextStatus} value={nextStatus}>
                           {getStatusLabel(nextStatus)}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}
               </div>
             ))}
           </div>
           )}
           {/* Desktop Table View */}
           <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                 <thead className="bg-gray-50 dark:bg-gray-700">
                   <tr>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       شماره سفارش
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       مشتری
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       نوع
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       مبلغ
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       وضعیت
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       تاریخ
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                       عملیات
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                   {filteredOrders.map((order) => {
                     // Debug: Log the actual status being rendered
                     if (order.id === '8eaf6254-f84b-49f7-8007-c98f12a401e6') {
                       console.log('RENDERING ORDER:', { id: order.id, status: order.status, orderNumber: order.orderNumber });
                       console.log('getStatusLabel result:', getStatusLabel(order.status));
                     }
                     return (
                     <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                         <input
                           type="checkbox"
                           checked={selectedIds.has(order.id)}
                           onChange={() => toggleSelect(order.id)}
                           className="ml-2 align-middle"
                         />
                         {order.friendlyOrderNumber}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {order.customerName || 'مشتری ناشناس'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {getTypeLabel(order.orderType)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {formatPrice(order.totalAmount)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                           {getStatusLabel(order.status)}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {new Date(order.orderDate).toLocaleDateString('fa-IR')} - {new Date(order.orderDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex space-x-2 space-x-reverse">
                           <button
                             onClick={() => handleEditOrder(order)}
                             className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                           >
                             <FaEdit />
                           </button>
                           <button
                             onClick={() => cancelOrder(order.id)}
                             disabled={!canCancelOrder(order.status)}
                             className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                               canCancelOrder(order.status) ? '' : 'opacity-50 cursor-not-allowed'
                             }`}
                           >
                             <FaTrash />
                           </button>
                           {/* Status Change Dropdown */}
                           {getNextStatusOptions(order.status).length > 0 && (
                             <select
                               onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                               className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                               defaultValue=""
                             >
                               <option value="" disabled>تغییر وضعیت</option>
                               {getNextStatusOptions(order.status).map((nextStatus) => (
                                 <option key={nextStatus} value={nextStatus}>
                                   {getStatusLabel(nextStatus)}
                                 </option>
                               ))}
                             </select>
                           )}
                         </div>
                       </td>
                     </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
         

         {/* Empty State */}
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
              {activeTab === 'DINE_IN' ? <FaTable /> : <FaList />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              سفارشی یافت نشد
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              هیچ سفارشی با فیلترهای انتخاب شده یافت نشد.
            </p>
          </div>
        )}

        {/* Order Edit Modal */}
        {showEditModal && editingOrder && (
          <OrderEditModal
            isOpen={showEditModal}
            orderId={editingOrder.id}
            currentItems={editingOrder.items.map(item => ({
              ...item,
              itemId: item.id // Ensure itemId is present for compatibility
            }))}
            onOrderUpdated={handleOrderUpdated}
            onClose={() => {
              setShowEditModal(false);
              setEditingOrder(null);
            }}
          />
        )}
        </div>
    </div>
  );
} 