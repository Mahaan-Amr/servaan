'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { KitchenService } from '../../../../services/orderingService';
import { OrderStatus, OrderType, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../../../../types/ordering';
import { useAuth } from '../../../../contexts/AuthContext';
import { io } from 'socket.io-client';
import { BASE_URL } from '../../../../lib/apiUtils';
import { formatFarsiDateTime, toFarsiDigits } from '../../../../utils/dateUtils';
import { 
  FaClock, 
  FaUtensils, 
  FaTable, 
  FaUser, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaFilter,
  FaExpand,
  FaBell,
  FaBellSlash,
  FaList
} from 'react-icons/fa';

interface KitchenDisplayOrder {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: {
    itemName: string;
    quantity: number;
    modifiers: string[];
    specialRequest?: string;
    prepStatus: OrderStatus;
    prepStartedAt?: string;
    prepCompletedAt?: string;
  }[];
  priority: number;
  estimatedTime: number;
  elapsedTime: number;
  status: OrderStatus;
  notes?: string;
  allergyInfo?: string;
  guestCount?: number;
  orderDate: string;
  startedAt?: string;
  readyAt?: string;
  completedAt?: string;
}

interface KitchenStation {
  name: string;
  displayName: string;
  isActive: boolean;
  orders: KitchenDisplayOrder[];
  averagePrepTime: number;
  currentLoad: number;
  color?: string;
  icon?: string;
}

interface KitchenOrderUpdate {
  orderId: string;
  status: string;
  timestamp: string;
  tenantId: string;
}

interface KitchenStockAlert {
  type: 'low_stock' | 'out_of_stock' | 'ingredient_shortage';
  itemName: string;
  currentStock: number;
  minStock: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  unit: string;
}

interface KitchenMenuAvailability {
  updates: Array<{ 
    menuItemId: string;
    menuItemName: string;
    isAvailable: boolean;
    reason?: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Filter and sort options
interface KitchenDisplayFilters {
  status: OrderStatus[];
  priority: number | null;
  orderType: OrderType[];
  timeRange: 'all' | 'today' | 'last_hour' | 'last_30min';
}


export default function KitchenDisplayPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitchenDisplayOrder[]>([]);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('Main Kitchen');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // Enhanced state management
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState<KitchenDisplayFilters>({
    status: [],
    priority: null,
    orderType: [],
    timeRange: 'all'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Refs for timers
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced load kitchen data with error handling and logging
  const loadKitchenData = useCallback(async () => {
    try {
      console.log('🍳 [KITCHEN_DISPLAY] Loading kitchen data for station:', selectedStation);
      setLoading(true);
      
      // Load orders for selected station
      const ordersData = await KitchenService.getKitchenDisplayOrders(selectedStation) as ApiResponse<KitchenDisplayOrder[]>;
      const ordersList = ordersData.data || [];
      console.log('🍳 [KITCHEN_DISPLAY] Loaded orders:', ordersList.length);
      setOrders(ordersList);

      // Load all stations
      const stationsData = await KitchenService.getAllKitchenStations() as ApiResponse<KitchenStation[]>;
      const stationsList = stationsData.data || [];
      console.log('🍳 [KITCHEN_DISPLAY] Loaded stations:', stationsList.length);
      setStations(stationsList);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY] Error loading kitchen data:', error);
      toast.error('خطا در بارگذاری اطلاعات آشپزخانه');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  // Fix existing orders by creating kitchen display entries
  const handleFixExistingOrders = useCallback(async () => {
    try {
      console.log('🔧 [KITCHEN_DISPLAY] Fixing existing orders...');
      
      // Check authentication
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('🔧 [KITCHEN_DISPLAY] Authentication check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0
      });
      
      if (!token) {
        toast.error('لطفاً ابتدا وارد سیستم شوید', { id: 'fix-orders' });
        return;
      }
      
      toast.loading('در حال رفع مشکل سفارشات موجود...', { id: 'fix-orders' });
      
      const response = await KitchenService.fixExistingOrders() as ApiResponse<{ totalOrders: number; createdEntries: number }>;
      
      if (response.success) {
        const { totalOrders, createdEntries } = response.data;
        console.log(`✅ [KITCHEN_DISPLAY] Fixed ${createdEntries} out of ${totalOrders} orders`);
        
        toast.success(`✅ ${toFarsiDigits(createdEntries)} ورودی نمایشگر آشپزخانه ایجاد شد`, { id: 'fix-orders' });
        
        // Reload kitchen data to show the fixed orders
        await loadKitchenData();
      } else {
        throw new Error(response.message || 'خطا در رفع مشکل سفارشات');
      }
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY] Error fixing existing orders:', error);
      
      // Show more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      console.error('❌ [KITCHEN_DISPLAY] Error details:', {
        message: errorMessage,
        error: error
      });
      
      toast.error(`خطا در رفع مشکل سفارشات موجود: ${errorMessage}`, { id: 'fix-orders' });
    }
  }, [loadKitchenData]);

  // Audio functions for notifications
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [soundEnabled]);

  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // More urgent sound pattern
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }, [soundEnabled]);

  // Enhanced WebSocket connection with comprehensive event handling
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    console.log('🔌 [KITCHEN_DISPLAY] Initializing WebSocket connection');
    const newSocket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ [KITCHEN_DISPLAY] Connected to kitchen display server');
      setIsConnected(true);
      toast.success('اتصال به سرور برقرار شد');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ [KITCHEN_DISPLAY] Disconnected from kitchen display server:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        toast.error('اتصال به سرور قطع شد');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ [KITCHEN_DISPLAY] Connection error:', error);
      setIsConnected(false);
      toast.error('خطا در اتصال به سرور');
    });

    // Kitchen order updates
    newSocket.on('kitchen:order:update', (data: KitchenOrderUpdate) => {
      console.log('🍳 [KITCHEN_DISPLAY] Kitchen order update received:', data);
      
      if (notificationsEnabled) {
        toast.success(`سفارش ${data.orderId} بروزرسانی شد`);
      }
      
      if (soundEnabled) {
        playNotificationSound();
      }
      
      loadKitchenData(); // Refresh data when orders update
    });

    // Stock alerts
    newSocket.on('kitchen:stock:alert', (data: KitchenStockAlert) => {
      console.log('⚠️ [KITCHEN_DISPLAY] Kitchen stock alert:', data);
      
      const urgencyColors = {
        low: 'text-yellow-600',
        medium: 'text-orange-600', 
        high: 'text-red-600',
        critical: 'text-red-800'
      };
      
      toast.error(
        `هشدار موجودی: ${data.itemName} - موجودی: ${data.currentStock} ${data.unit}`,
        {
          duration: 8000,
          className: urgencyColors[data.urgency]
        }
      );
      
      if (soundEnabled && data.urgency === 'critical') {
        playAlertSound();
      }
    });

    // Menu availability updates
    newSocket.on('kitchen:menu:availability', (data: KitchenMenuAvailability) => {
      console.log('📋 [KITCHEN_DISPLAY] Menu availability update:', data);
      
      const unavailableItems = data.updates.filter(update => !update.isAvailable);
      if (unavailableItems.length > 0) {
        toast.error(`${unavailableItems.length} آیتم منو غیرفعال شد`);
      } else {
      toast.success('بروزرسانی وضعیت منو');
      }
    });

    // Profitability updates (for managers)
    newSocket.on('kitchen:profitability:update', (data: { orderNumber: string; profitMargin: number }) => {
      console.log('💰 [KITCHEN_DISPLAY] Profitability update:', data);
      // Only show to managers/admins
      if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
        toast.success(`سفارش ${data.orderNumber}: سود ${data.profitMargin.toFixed(1)}%`);
      }
    });

    return () => {
      console.log('🔌 [KITCHEN_DISPLAY] Cleaning up WebSocket connection');
      newSocket.disconnect();
    };
  }, [user, loadKitchenData, notificationsEnabled, soundEnabled, playNotificationSound, playAlertSound]);

  // Enhanced auto-refresh with configurable interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const refreshInterval = 30; // 30 seconds
    console.log(`🔄 [KITCHEN_DISPLAY] Setting up auto-refresh every ${refreshInterval} seconds`);
    
    refreshTimerRef.current = setInterval(() => {
      console.log('🔄 [KITCHEN_DISPLAY] Auto-refreshing data');
      loadKitchenData();
    }, refreshInterval * 1000);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, loadKitchenData]);

  // Load data on mount and when station changes
  useEffect(() => {
    loadKitchenData();
  }, [loadKitchenData]);

  // Enhanced order status update with better error handling
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      console.log(`🍳 [KITCHEN_DISPLAY] Updating order ${orderId} status to ${newStatus}`);
      await KitchenService.updateKitchenDisplayStatus(orderId, newStatus);
      toast.success(`وضعیت سفارش به ${ORDER_STATUS_LABELS[newStatus]} تغییر یافت`);
      loadKitchenData(); // Refresh data
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY] Error updating order status:', error);
      toast.error('خطا در بروزرسانی وضعیت سفارش');
    }
  };

  // Enhanced order priority update
  const updateOrderPriority = async (kitchenDisplayId: string, newPriority: number) => {
    try {
      console.log(`🍳 [KITCHEN_DISPLAY] Updating kitchen display ${kitchenDisplayId} priority to ${newPriority}`);
      await KitchenService.updateKitchenDisplayPriority(kitchenDisplayId, newPriority);
      toast.success(`اولویت سفارش به ${newPriority} تغییر یافت`);
      loadKitchenData(); // Refresh data
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY] Error updating order priority:', error);
      toast.error('خطا در بروزرسانی اولویت سفارش');
    }
  };


  // Filter and sort orders
  const filteredAndSortedOrders = useCallback(() => {
    let filtered = [...orders];

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(order => filters.status.includes(order.status));
    }

    // Apply priority filter
    if (filters.priority !== null) {
      filtered = filtered.filter(order => order.priority >= filters.priority!);
    }

    // Apply order type filter
    if (filters.orderType.length > 0) {
      filtered = filtered.filter(order => filters.orderType.includes(order.orderType));
    }

    // Apply time range filter
    const now = new Date();
    switch (filters.timeRange) {
      case 'last_30min':
        const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.orderDate) >= thirtyMinAgo);
        break;
      case 'last_hour':
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.orderDate) >= oneHourAgo);
        break;
      case 'today':
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        filtered = filtered.filter(order => new Date(order.orderDate) >= startOfDay);
        break;
    }

    // Apply sorting (default to priority desc for kitchen display)
    filtered.sort((a, b) => {
      // Sort by priority (desc), then by order date (asc)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    });

    return filtered;
  }, [orders, filters]);

  // Group orders by status for better organization
  const groupedOrders = useCallback(() => {
    const filtered = filteredAndSortedOrders();
    const groups: Record<string, KitchenDisplayOrder[]> = {
      [OrderStatus.SUBMITTED]: [],
      [OrderStatus.PENDING]: [],
      [OrderStatus.CONFIRMED]: [],
      [OrderStatus.PREPARING]: [],
      [OrderStatus.READY]: [],
      [OrderStatus.COMPLETED]: [],
    };

    filtered.forEach(order => {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    });

    return groups;
  }, [filteredAndSortedOrders]);

  // Enhanced status color with better visual hierarchy
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.SUBMITTED:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700';
      case OrderStatus.CONFIRMED:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700';
      case OrderStatus.PREPARING:
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700';
      case OrderStatus.READY:
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case OrderStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  // Enhanced status text using imported labels
  const getStatusText = (status: OrderStatus) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  // Enhanced time formatting with Farsi digits
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${toFarsiDigits(hours)}س ${toFarsiDigits(mins)}د`;
    }
    return `${toFarsiDigits(mins)}د`;
  };

  // Enhanced priority color with more granular levels
  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return 'bg-red-600';
    if (priority >= 7) return 'bg-red-500';
    if (priority >= 5) return 'bg-orange-500';
    if (priority >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get priority text
  const getPriorityText = (priority: number) => {
    if (priority >= 9) return 'بحرانی';
    if (priority >= 7) return 'بالا';
    if (priority >= 5) return 'متوسط';
    if (priority >= 3) return 'پایین';
    return 'عادی';
  };

  // Check if order is overdue
  const isOrderOverdue = (order: KitchenDisplayOrder) => {
    return order.elapsedTime > order.estimatedTime;
  };

  // Get order type text
  const getOrderTypeText = (orderType: OrderType) => {
    return ORDER_TYPE_LABELS[orderType] || orderType;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header with Controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
      <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
        <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🍳 نمایشگر آشپزخانه
          </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
            مدیریت سفارشات و نظارت بر آماده‌سازی
          </p>
        </div>
        
        {/* Connection Status */}
              <div className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg ${
            isConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'متصل' : 'قطع اتصال'}
            </span>
              </div>
            </div>
            
            {/* Control Panel */}
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}
                title={soundEnabled ? 'صدا فعال' : 'صدا غیرفعال'}
              >
                {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
              </button>
              
              {/* Notifications Toggle */}
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  notificationsEnabled 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}
                title={notificationsEnabled ? 'اعلان‌ها فعال' : 'اعلان‌ها غیرفعال'}
              >
                {notificationsEnabled ? <FaBell /> : <FaBellSlash />}
              </button>
              
              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}
                title={autoRefresh ? 'بروزرسانی خودکار فعال' : 'بروزرسانی خودکار غیرفعال'}
              >
                {autoRefresh ? <FaPlay /> : <FaPause />}
              </button>
              
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}
                title="فیلترها"
              >
                <FaFilter />
              </button>
              
              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={viewMode === 'grid' ? 'نمایش لیستی' : 'نمایش شبکه‌ای'}
              >
                {viewMode === 'grid' ? <FaList /> : <FaExpand />}
              </button>
            </div>
          </div>
          
          {/* Station Selector and Info */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4 space-x-reverse">
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm font-medium"
          >
            {stations.map((station) => (
              <option key={station.name} value={station.displayName}>
                    {station.name} ({toFarsiDigits(station.currentLoad)} سفارش)
              </option>
            ))}
          </select>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                آخرین بروزرسانی: {formatFarsiDateTime(lastUpdate)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                <span>کل سفارشات: {toFarsiDigits(orders.length)}</span>
                <span>•</span>
                <span>در انتظار: {toFarsiDigits(orders.filter(o => o.status === OrderStatus.PENDING).length)}</span>
                <span>•</span>
                <span>در حال آماده‌سازی: {toFarsiDigits(orders.filter(o => o.status === OrderStatus.PREPARING).length)}</span>
              </div>
              
              <button
                onClick={handleFixExistingOrders}
                className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                title="ایجاد ورودی‌های نمایشگر آشپزخانه برای سفارشات موجود"
              >
                رفع مشکل سفارشات موجود
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وضعیت سفارش
              </label>
              <div className="space-y-2">
                {Object.values(OrderStatus).map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                        } else {
                          setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اولویت
              </label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">همه اولویت‌ها</option>
                <option value="9">بحرانی (9+)</option>
                <option value="7">بالا (7+)</option>
                <option value="5">متوسط (5+)</option>
                <option value="3">پایین (3+)</option>
              </select>
            </div>
            
            {/* Order Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع سفارش
              </label>
              <div className="space-y-2">
                {Object.values(OrderType).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.orderType.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, orderType: [...prev.orderType, type] }));
                        } else {
                          setFilters(prev => ({ ...prev, orderType: prev.orderType.filter(t => t !== type) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                      {ORDER_TYPE_LABELS[type]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                بازه زمانی
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as 'all' | 'today' | 'last_hour' | 'last_30min' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="all">همه زمان‌ها</option>
                <option value="last_30min">آخرین ۳۰ دقیقه</option>
                <option value="last_hour">آخرین ساعت</option>
                <option value="today">امروز</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="mr-3 text-lg text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
        </div>
      )}

      {/* Kitchen Display Board */}
      {!loading && (
          <div className="space-y-6">
            {Object.entries(groupedOrders()).map(([status, statusOrders]) => {
              if (statusOrders.length === 0) return null;
              
              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {ORDER_STATUS_LABELS[status as OrderStatus]}
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status as OrderStatus)}`}>
                      {toFarsiDigits(statusOrders.length)} سفارش
                    </div>
                  </div>
                  
                  <div className={`grid gap-4 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}>
                    {statusOrders.map((order) => (
                      <OrderCard 
              key={order.orderId}
                        order={order}
                        viewMode={viewMode}
                        onUpdateStatus={updateOrderStatus}
                        onUpdatePriority={updateOrderPriority}
                        getStatusColor={getStatusColor}
                        getStatusText={getStatusText}
                        getPriorityColor={getPriorityColor}
                        getPriorityText={getPriorityText}
                        formatTime={formatTime}
                        isOrderOverdue={isOrderOverdue}
                        getOrderTypeText={getOrderTypeText}
                        toFarsiDigits={toFarsiDigits}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUtensils className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              سفارشی در انتظار نیست
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              در حال حاضر سفارشی برای ایستگاه {selectedStation} وجود ندارد
            </p>
            <button
              onClick={loadKitchenData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              بروزرسانی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Order Card Component
interface OrderCardProps {
  order: KitchenDisplayOrder;
  viewMode: 'grid' | 'list';
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePriority: (orderId: string, priority: number) => void;
  getStatusColor: (status: OrderStatus) => string;
  getStatusText: (status: OrderStatus) => string;
  getPriorityColor: (priority: number) => string;
  getPriorityText: (priority: number) => string;
  formatTime: (minutes: number) => string;
  isOrderOverdue: (order: KitchenDisplayOrder) => boolean;
  getOrderTypeText: (orderType: OrderType) => string;
  toFarsiDigits: (text: string | number) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  viewMode,
  onUpdateStatus,
  onUpdatePriority,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityText,
  formatTime,
  isOrderOverdue,
  getOrderTypeText,
  toFarsiDigits
}) => {
  const elapsed = order.elapsedTime;
  const isOverdue = isOrderOverdue(order);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 ${
      isOverdue ? 'ring-2 ring-red-500 ring-opacity-50' : ''
    } ${viewMode === 'list' ? 'flex' : ''}`}>
              {/* Order Header */}
      <div className={`p-3 border-b border-gray-200 dark:border-gray-700 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-base font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </span>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                  
                  {/* Priority Badge */}
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(order.priority)}`} 
                 title={`اولویت: ${getPriorityText(order.priority)}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getPriorityText(order.priority)}
            </span>
          </div>
                </div>

                {/* Order Info */}
        <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between flex-wrap gap-2">
                  {order.tableNumber && (
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <FaTable className="w-3.5 h-3.5" />
                <span className="text-xs">میز {toFarsiDigits(order.tableNumber)}</span>
                    </div>
                  )}
                  
                  {order.customerName && (
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <FaUser className="w-3.5 h-3.5" />
                <span className="text-xs">{order.customerName}</span>
                    </div>
                  )}

            <div className="flex items-center space-x-1.5 space-x-reverse">
              <FaUtensils className="w-3.5 h-3.5" />
              <span className="text-xs">{getOrderTypeText(order.orderType)}</span>
            </div>

                  {/* Timer */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <FaClock className="w-3.5 h-3.5" />
              <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {formatTime(elapsed)} / {formatTime(order.estimatedTime)}
                    </span>
              {isOverdue && <FaExclamationTriangle className="w-3.5 h-3.5 text-red-500" />}
            </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
      <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="space-y-2">
                  {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {toFarsiDigits(item.quantity)}x {item.itemName}
                          </span>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.prepStatus)}`}>
                            {getStatusText(item.prepStatus)}
                          </div>
                        </div>
                        
                        {item.modifiers.length > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {item.modifiers.join('، ')}
                          </div>
                        )}
                        
                        {item.specialRequest && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                            💬 {item.specialRequest}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes and Allergy Info */}
                {(order.notes || order.allergyInfo) && (
          <div className="mt-2 space-y-1.5">
                    {order.notes && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>یادداشت:</strong> {order.notes}
                        </div>
                      </div>
                    )}
                    
                    {order.allergyInfo && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-xs text-red-800 dark:text-red-300">
                  <strong>⚠️ آلرژی:</strong> {order.allergyInfo}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2 space-x-reverse">
          {order.status === OrderStatus.SUBMITTED && (
            <button
              onClick={() => onUpdateStatus(order.orderId, OrderStatus.CONFIRMED)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
            >
              <FaCheckCircle className="w-3.5 h-3.5" />
              <span>تأیید</span>
            </button>
          )}
          
                  {order.status === OrderStatus.CONFIRMED && (
                    <button
              onClick={() => onUpdateStatus(order.orderId, OrderStatus.PREPARING)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
                    >
              <FaPlay className="w-3.5 h-3.5" />
              <span>شروع</span>
                    </button>
                  )}
                  
                  {order.status === OrderStatus.PREPARING && (
                    <button
              onClick={() => onUpdateStatus(order.orderId, OrderStatus.READY)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
                    >
              <FaCheckCircle className="w-3.5 h-3.5" />
              <span>آماده</span>
                    </button>
                  )}
                  
                  <button
            onClick={() => onUpdatePriority(order.kitchenDisplayId, order.priority + 1)}
            className="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    title="افزایش اولویت"
                  >
                    ⬆️
                  </button>
                </div>
              </div>
    </div>
  );
}; 