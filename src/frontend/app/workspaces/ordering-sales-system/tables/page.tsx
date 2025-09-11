'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { TableService } from '../../../../services/orderingService';
import { TableStatus } from '../../../../types/ordering';
import { TableFilterOptions } from '../../../../services/orderingService';
import TableLayoutDesigner from './components/TableLayoutDesigner';
import { ReservationManager } from './components/ReservationManager';
import { TableStatusManager } from './components/TableStatusManager';
import TableForm from './components/TableForm';
import { FaTh, FaList, FaMap, FaCalendarAlt, FaCog, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { OrderService } from '../../../../services/orderingService';
import { OrderStatus } from '../../../../types/ordering';
import { io } from 'socket.io-client';

interface TableWithDetails {
  id: string;
  tenantId: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  floor: number;
  positionX?: number;
  positionY?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
  } | null;
  nextReservation?: {
    id: string;
    customerName: string;
    reservationDate: string;
    guestCount: number;
  } | null;
  isOccupied?: boolean;
  occupancyDuration?: number | null;
  upcomingReservation?: {
    id: string;
    customerName: string;
    reservationDate: string;
    guestCount: number;
  };
}

// API Response interface
interface TableStatusResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export default function TablesPage() {
  // State management
  const [tables, setTables] = useState<TableWithDetails[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'layout'>('grid');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Table CRUD states
  const [isTableFormOpen, setIsTableFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableWithDetails | null>(null);
  const [deletingTable, setDeletingTable] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0,
    outOfOrder: 0
  });

  // Load tables data
  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: TableFilterOptions = {};
      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }
      if (sectionFilter !== 'all') {
        filters.section = sectionFilter;
      }

      const response = await TableService.getTables(filters);
      if (Array.isArray(response)) {
        setTables(response);
        setFilteredTables(response);
        // Calculate statistics
        const newStats = {
          total: response.length,
          available: response.filter((t: TableWithDetails) => t.status === 'AVAILABLE').length,
          occupied: response.filter((t: TableWithDetails) => t.status === 'OCCUPIED').length,
          reserved: response.filter((t: TableWithDetails) => t.status === 'RESERVED').length,
          cleaning: response.filter((t: TableWithDetails) => t.status === 'CLEANING').length,
          outOfOrder: response.filter((t: TableWithDetails) => t.status === 'OUT_OF_ORDER').length
        };
        setStats(newStats);
      } else {
        throw new Error('خطا در دریافت اطلاعات میزها');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات میزها';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sectionFilter]);

  // Apply search and filters
  useEffect(() => {
    let filtered = tables;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(table => 
        table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (table.tableName && table.tableName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (table.section && table.section.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredTables(filtered);
  }, [tables, searchQuery]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to table management real-time server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from table management real-time server');
    });

    // Listen for table status updates
    socket.on('table-status-updated', (data: { tableId: string; tableNumber: string; newStatus: string }) => {
      console.log('Table status update received:', data);
      
      // If table was deleted, refresh the list
      if (data.newStatus === 'DELETED') {
        toast.success(`میز ${data.tableNumber} حذف شد`);
        loadTables(); // Refresh the table list
      } else {
        // For other status changes, refresh to get updated data
        loadTables();
      }
    });

    // Listen for bulk table updates
    socket.on('bulk-table-status-updated', (data: { updates: Array<{ tableId: string; tableNumber: string; newStatus: string }> }) => {
      console.log('Bulk table update received:', data);
      loadTables(); // Refresh the table list
    });

    return () => {
      socket.disconnect();
    };
  }, [loadTables]);

  // Handle status change
  const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
    try {
      console.log('🔄 Changing table status:', { tableId, newStatus });
      
      const response = await TableService.changeTableStatus(tableId, newStatus);
      
      console.log('📡 Table status change response:', response);
      console.log('📡 Response type:', typeof response);
      console.log('📡 Response keys:', Object.keys(response || {}));
      
      // Check if response has success property or if it's a direct success
      const responseObj = response as TableStatusResponse;
      const isSuccess = responseObj && (responseObj.success === true || responseObj.success === undefined);
      
      if (isSuccess) {
        toast.success('وضعیت میز با موفقیت تغییر کرد');
        console.log('✅ Table status changed successfully, reloading tables...');
        loadTables(); // Reload data
      } else {
        const errorMessage = responseObj?.message || 'خطا در تغییر وضعیت میز';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error changing table status:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در تغییر وضعیت میز';
      toast.error(errorMessage);
    }
  };

  // Handle table CRUD operations
  const handleCreateTable = () => {
    setEditingTable(null);
    setIsTableFormOpen(true);
  };

  const handleEditTable = (table: TableWithDetails) => {
    setEditingTable(table);
    setIsTableFormOpen(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('آیا از حذف این میز اطمینان دارید؟')) {
      return;
    }

    try {
      setDeletingTable(tableId);
      await TableService.deleteTable(tableId);
      toast.success('میز با موفقیت حذف شد');
      loadTables(); // Reload data
    } catch (error) {
      console.error('Error deleting table:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف میز';
      
      // Check if it's a deletion prevention error
      if (errorMessage.includes('Cannot delete table with active orders') || 
          errorMessage.includes('Cannot delete table with active reservations')) {
        
        // Show a more detailed error with guidance
        const isOrders = errorMessage.includes('active orders');
        const isReservations = errorMessage.includes('active reservations');
        
        let guidanceMessage = '';
        if (isOrders && isReservations) {
          guidanceMessage = 'این میز دارای سفارشات فعال و رزروهای تایید شده است. لطفاً ابتدا سفارشات را تکمیل کنید و رزروها را لغو کنید.';
        } else if (isOrders) {
          guidanceMessage = 'این میز دارای سفارشات فعال است. لطفاً ابتدا سفارشات را تکمیل کنید.';
        } else if (isReservations) {
          guidanceMessage = 'این میز دارای رزروهای تایید شده است. لطفاً ابتدا رزروها را لغو کنید.';
        }
        
        toast.error(
          <div>
            <div className="font-bold mb-2">حذف میز امکان‌پذیر نیست</div>
            <div className="text-sm">{guidanceMessage}</div>
            <div className="text-xs mt-2 text-gray-600">
              جزئیات: {errorMessage}
            </div>
          </div>,
          { duration: 8000 }
        );
      } else {
        // Regular error
        toast.error(errorMessage);
      }
    } finally {
      setDeletingTable(null);
    }
  };

  // Quick resolve orders for table deletion
  const handleQuickResolve = async (table: TableWithDetails) => {
    if (!table.currentOrder) {
      toast.error('این میز سفارش فعالی ندارد');
      return;
    }

    const action = confirm(
      `آیا می‌خواهید سفارش ${table.currentOrder.orderNumber} را تکمیل کنید تا بتوانید میز را حذف کنید؟\n\n` +
      'اگر سفارش واقعی است، "تایید" را انتخاب کنید.\n' +
      'اگر سفارش تست است، "لغو" را انتخاب کنید.'
    );

    if (action) {
      try {
        // Complete the order
        await OrderService.updateOrderStatus(table.currentOrder.id, OrderStatus.COMPLETED);
        toast.success(`سفارش ${table.currentOrder.orderNumber} تکمیل شد`);
        loadTables(); // Reload to update table state
      } catch (error) {
        console.error('Error completing order:', error);
        toast.error('خطا در تکمیل سفارش');
      }
    } else {
      try {
        // Cancel the order
        await OrderService.cancelOrder(table.currentOrder.id, 'Cancelled to allow table deletion');
        toast.success(`سفارش ${table.currentOrder.orderNumber} لغو شد`);
        loadTables(); // Reload to update table state
      } catch (error) {
        console.error('Error cancelling order:', error);
        toast.error('خطا در لغو سفارش');
      }
    }
  };

  const handleTableSaved = () => {
    loadTables(); // Reload data after save
  };

  // Get status color
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'OCCUPIED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CLEANING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'OUT_OF_ORDER':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get status text
  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'آزاد';
      case 'OCCUPIED':
        return 'مشغول';
      case 'RESERVED':
        return 'رزرو شده';
      case 'CLEANING':
        return 'در حال تمیزکاری';
      case 'OUT_OF_ORDER':
        return 'خارج از سرویس';
      default:
        return status;
    }
  };

  // Get unique sections
  const sections = Array.from(new Set(tables.map(t => t.section).filter(Boolean)));

  // Helper function to check if table can be deleted
  const canDeleteTable = (table: TableWithDetails) => {
    // Check if table has active orders or reservations
    return !table.currentOrder && !table.upcomingReservation;
  };

  // Get delete button state
  const getDeleteButtonState = (table: TableWithDetails) => {
    if (!canDeleteTable(table)) {
      return {
        disabled: true,
        tooltip: table.currentOrder 
          ? 'این میز دارای سفارش فعال است'
          : 'این میز دارای رزرو فعال است',
        className: 'bg-gray-400 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
      };
    }
    
    return {
      disabled: false,
      tooltip: 'حذف میز',
      className: 'flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مدیریت میزها
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              مدیریت وضعیت میزها، رزروها و انتقال سفارشات
            </p>
          </div>
          
          {/* View Mode Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <FaTh className="inline ml-1" />
              شبکه‌ای
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <FaList className="inline ml-1" />
              لیستی
            </button>
            <button
              onClick={() => setViewMode('layout')}
              className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                viewMode === 'layout'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <FaMap className="inline ml-1" />
              نقشه
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaCalendarAlt className="inline ml-1" />
            رزرو میز
          </button>
          <button
            onClick={handleCreateTable}
            className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaPlus className="inline ml-1" />
            افزودن میز
          </button>
          <button
            onClick={() => setIsStatusManagerOpen(true)}
            className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <FaCog className="inline ml-1" />
            مدیریت وضعیت
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="card p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل میزها</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">آزاد</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">مشغول</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.occupied}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">رزرو شده</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.reserved}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">در حال تمیزکاری</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.cleaning}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">خارج از سرویس</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.outOfOrder}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                جستجو
              </label>
              <input
                type="text"
                placeholder="شماره میز، نام یا بخش..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وضعیت
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TableStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">همه</option>
                <option value="AVAILABLE">آزاد</option>
                <option value="OCCUPIED">مشغول</option>
                <option value="RESERVED">رزرو شده</option>
                <option value="CLEANING">در حال تمیزکاری</option>
                <option value="OUT_OF_ORDER">خارج از سرویس</option>
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بخش
              </label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">همه</option>
                {sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {error ? (
          <div className="card p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری</h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={loadTables}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              تلاش مجدد
            </button>
          </div>
        ) : viewMode === 'layout' ? (
          <TableLayoutDesigner
            onTableClick={(table) => {
              // Handle table click in layout view
              console.log('Table clicked:', table);
            }}
            onTableStatusChange={handleStatusChange}
            showStatusIndicators={true}
            showCapacity={true}
            showOrders={true}
          />
        ) : filteredTables.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">میز یافت نشد</h3>
            <p className="text-gray-600 dark:text-gray-400">هیچ میزی با فیلترهای انتخاب شده یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredTables.map((table) => (
              <div key={table.id} className="card p-3 sm:p-6 hover:shadow-lg transition-shadow">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      میز {table.tableNumber}
                    </h3>
                    {table.tableName && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{table.tableName}</p>
                    )}
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                    {getStatusText(table.status)}
                  </span>
                </div>

                {/* Table Details */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">ظرفیت:</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{table.capacity} نفر</span>
                  </div>
                  
                  {table.section && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">بخش:</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{table.section}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">طبقه:</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{table.floor}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {table.status === 'AVAILABLE' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(table.id, 'OCCUPIED' as TableStatus)}
                          className="px-2 sm:px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          اشغال
                        </button>
                        <button
                          onClick={() => handleStatusChange(table.id, 'RESERVED' as TableStatus)}
                          className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          رزرو
                        </button>
                      </>
                    )}
                    
                    {table.status === 'OCCUPIED' && (
                      <button
                        onClick={() => handleStatusChange(table.id, 'CLEANING' as TableStatus)}
                        className="px-2 sm:px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                      >
                        تمیزکاری
                      </button>
                    )}
                    
                    {table.status === 'CLEANING' && (
                      <button
                        onClick={() => handleStatusChange(table.id, 'AVAILABLE' as TableStatus)}
                        className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        آزاد کردن
                      </button>
                    )}
                    
                    {table.status !== 'OUT_OF_ORDER' && (
                      <button
                        onClick={() => handleStatusChange(table.id, 'OUT_OF_ORDER' as TableStatus)}
                        className="px-2 sm:px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      >
                        خارج از سرویس
                      </button>
                    )}
                    
                    {table.status === 'OUT_OF_ORDER' && (
                      <button
                        onClick={() => handleStatusChange(table.id, 'AVAILABLE' as TableStatus)}
                        className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        فعال کردن
                      </button>
                    )}
                  </div>
                  
                  {/* Edit and Delete Actions */}
                  <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEditTable(table)}
                      className="flex-1 px-2 sm:px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center justify-center"
                    >
                      <FaEdit className="ml-1" />
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      disabled={deletingTable === table.id || !canDeleteTable(table)}
                      className={getDeleteButtonState(table).className}
                      title={getDeleteButtonState(table).tooltip}
                    >
                      {deletingTable === table.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FaTrash className="ml-1" />
                          حذف
                        </>
                      )}
                    </button>
                    {table.currentOrder && (
                      <button
                        onClick={() => handleQuickResolve(table)}
                        className="px-2 sm:px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center justify-center"
                      >
                        <FaPlus className="ml-1" />
                        رفع سفارش
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ReservationManager
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onReservationCreated={loadTables}
      />
      <TableStatusManager
        isOpen={isStatusManagerOpen}
        onClose={() => setIsStatusManagerOpen(false)}
        onStatusChanged={handleStatusChange}
      />
      <TableForm
        isOpen={isTableFormOpen}
        onClose={() => setIsTableFormOpen(false)}
        onTableSaved={handleTableSaved}
        editingTable={editingTable}
      />
    </div>
  );
} 