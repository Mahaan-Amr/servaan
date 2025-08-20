'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { KitchenService } from '../../../../services/orderingService';
import { OrderStatus, OrderType } from '../../../../types/ordering';
import { useAuth } from '../../../../contexts/AuthContext';
import { io } from 'socket.io-client';

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
  }[];
  priority: number;
  estimatedTime: number;
  elapsedTime: number;
  status: OrderStatus;
  notes?: string;
  allergyInfo?: string;
  guestCount?: number;
}

interface KitchenStation {
  name: string;
  displayName: string;
  isActive: boolean;
  orders: KitchenDisplayOrder[];
  averagePrepTime: number;
  currentLoad: number;
}

interface KitchenOrderUpdate {
  orderId: string;
  status: string;
}

interface KitchenStockAlert {
  itemName: string;
  currentStock: number;
  unit: string;
}

interface KitchenMenuAvailability {
  updates: Array<{ menuItemName: string }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export default function KitchenDisplayPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitchenDisplayOrder[]>([]);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('Main Kitchen');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Load kitchen data
  const loadKitchenData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load orders for selected station
      const ordersData = await KitchenService.getKitchenDisplayOrders(selectedStation) as ApiResponse<KitchenDisplayOrder[]>;
      setOrders(ordersData.data || []);

      // Load all stations
      const stationsData = await KitchenService.getAllKitchenStations() as ApiResponse<KitchenStation[]>;
      setStations(stationsData.data || []);
    } catch (error) {
      console.error('Error loading kitchen data:', error);
      toast.error('خطا در بارگذاری اطلاعات آشپزخانه');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to kitchen display server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from kitchen display server');
      setIsConnected(false);
    });

    newSocket.on('kitchen:order:update', (data: KitchenOrderUpdate) => {
      console.log('Kitchen order update received:', data);
      loadKitchenData(); // Refresh data when orders update
    });

    newSocket.on('kitchen:stock:alert', (data: KitchenStockAlert) => {
      console.log('Kitchen stock alert:', data);
      toast.error(`هشدار موجودی: ${data.itemName} - موجودی: ${data.currentStock} ${data.unit}`);
    });

    newSocket.on('kitchen:menu:availability', (data: KitchenMenuAvailability) => {
      console.log('Menu availability update:', data);
      toast.success('بروزرسانی وضعیت منو');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, loadKitchenData]);

  // Load data on mount and when station changes
  useEffect(() => {
    loadKitchenData();
  }, [loadKitchenData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadKitchenData, 30000);
    return () => clearInterval(interval);
  }, [loadKitchenData]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await KitchenService.updateKitchenDisplayStatus(orderId, newStatus);
      toast.success('وضعیت سفارش بروزرسانی شد');
      loadKitchenData(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطا در بروزرسانی وضعیت سفارش');
    }
  };

  // Update order priority
  const updateOrderPriority = async (orderId: string, newPriority: number) => {
    try {
      await KitchenService.updateKitchenDisplayPriority(orderId, newPriority);
      toast.success('اولویت سفارش بروزرسانی شد');
      loadKitchenData(); // Refresh data
    } catch (error) {
      console.error('Error updating order priority:', error);
      toast.error('خطا در بروزرسانی اولویت سفارش');
    }
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.PREPARING:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case OrderStatus.READY:
        return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status text in Persian
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'در انتظار';
      case OrderStatus.CONFIRMED:
        return 'تایید شده';
      case OrderStatus.PREPARING:
        return 'در حال آماده‌سازی';
      case OrderStatus.READY:
        return 'آماده';
      case OrderStatus.COMPLETED:
        return 'تکمیل شده';
      default:
        return status;
    }
  };

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-500';
    if (priority >= 5) return 'bg-orange-500';
    if (priority >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            نمایشگر آشپزخانه
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            مدیریت سفارشات و نظارت بر آماده‌سازی
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'متصل' : 'قطع اتصال'}
            </span>
          </div>
          
          {/* Station Selector */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            {stations.map((station) => (
              <option key={station.name} value={station.displayName}>
                {station.name} ({station.currentLoad} سفارش)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
        </div>
      )}

      {/* Kitchen Display Board */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                  
                  {/* Priority Badge */}
                  <div className={`w-4 h-4 rounded-full ${getPriorityColor(order.priority)}`} 
                       title={`اولویت: ${order.priority}`}></div>
                </div>

                {/* Order Info */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {order.tableNumber && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>میز {order.tableNumber}</span>
                    </div>
                  )}
                  
                  {order.customerName && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{order.customerName}</span>
                    </div>
                  )}

                  {/* Timer */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={order.elapsedTime > order.estimatedTime ? 'text-red-600 font-medium' : ''}>
                      {formatTime(order.elapsedTime)} / {formatTime(order.estimatedTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4">
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.quantity}x {item.itemName}
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.prepStatus)}`}>
                            {getStatusText(item.prepStatus)}
                          </div>
                        </div>
                        
                        {item.modifiers.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.modifiers.join('، ')}
                          </div>
                        )}
                        
                        {item.specialRequest && (
                          <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            💬 {item.specialRequest}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expandable Recipe Details */}
                <button
                  onClick={() => toggleOrderExpansion(order.orderId)}
                  className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {expandedOrders.has(order.orderId) ? 'مخفی کردن جزئیات' : 'نمایش جزئیات دستور پخت'}
                </button>

                {expandedOrders.has(order.orderId) && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3">جزئیات دستور پخت</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="border-r-4 border-blue-200 pr-3">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                            {item.itemName}
                          </h5>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>مواد اولیه مورد نیاز:</p>
                            <ul className="mt-1 space-y-1">
                              <li>• {item.quantity * 2} گرم آرد</li>
                              <li>• {item.quantity * 150} میلی‌لیتر شیر</li>
                              <li>• {item.quantity * 1} عدد تخم مرغ</li>
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes and Allergy Info */}
                {(order.notes || order.allergyInfo) && (
                  <div className="mt-4 space-y-2">
                    {order.notes && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-sm text-yellow-800 dark:text-yellow-300">
                          <strong>یادداشت آشپزخانه:</strong> {order.notes}
                        </div>
                      </div>
                    )}
                    
                    {order.allergyInfo && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-sm text-red-800 dark:text-red-300">
                          <strong>⚠️ اطلاعات آلرژی:</strong> {order.allergyInfo}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2 space-x-reverse">
                  {order.status === OrderStatus.CONFIRMED && (
                    <button
                      onClick={() => updateOrderStatus(order.orderId, OrderStatus.PREPARING)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      شروع آماده‌سازی
                    </button>
                  )}
                  
                  {order.status === OrderStatus.PREPARING && (
                    <button
                      onClick={() => updateOrderStatus(order.orderId, OrderStatus.READY)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      آماده شد
                    </button>
                  )}
                  
                  <button
                    onClick={() => updateOrderPriority(order.orderId, order.priority + 1)}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    title="افزایش اولویت"
                  >
                    ⬆️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            سفارشی در انتظار نیست
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            در حال حاضر سفارشی برای ایستگاه {selectedStation} وجود ندارد
          </p>
        </div>
      )}
    </div>
  );
} 