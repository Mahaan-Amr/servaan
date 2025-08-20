'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import type { OrderOptions, OrderCalculation, BusinessPreset } from '../../../../services/orderingService';
import { OrderService, PaymentService, MenuService, TableService } from '../../../../services/orderingService';
import { OrderType, PaymentMethod } from '../../../../types/ordering';
import type { MenuCategory as ApiMenuCategory, MenuItem as ApiMenuItem } from '../../../../types/ordering';
import OrderSummary from './components/OrderSummary';
import PaymentModal from './components/PaymentModal';
import ReceiptTemplate from './components/ReceiptTemplate';
import FlexiblePaymentModal from './components/FlexiblePaymentModal';
import AddItemsModal from './components/AddItemsModal';
import { FaList } from 'react-icons/fa';

// Simple toast function for now - we'll replace with proper toast library later
const toast = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message)
};

// Interfaces for POS data structures
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifiers: string[];
  specialRequest?: string;
  totalPrice: number;
}

interface Customer {
  id?: string;
  name?: string;
  phone?: string;
}

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  tableName?: string; // Added for display
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export default function POSInterface() {
  const router = useRouter();
  
  // State for order management
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({});
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  
  // Enhanced POS state
  const [showPayment, setShowPayment] = useState(false);
  const [showFlexiblePayment, setShowFlexiblePayment] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Menu data state
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Order options and calculation
  const [orderOptions, setOrderOptions] = useState<OrderOptions>({
    discountEnabled: false,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    taxEnabled: true,
    taxPercentage: 9.00,
    serviceEnabled: false,
    servicePercentage: 10.00,
    courierEnabled: false,
    courierAmount: 0,
    courierNotes: ''
  });
  
  const [calculation, setCalculation] = useState<OrderCalculation>({
    subtotal: 0,
    discountAmount: 0,
    discountPercentage: 0,
    taxAmount: 0,
    taxPercentage: 9.00,
    serviceAmount: 0,
    servicePercentage: 10.00,
    courierAmount: 0,
    totalAmount: 0,
    breakdown: {
      subtotal: 0,
      discount: 0,
      tax: 0,
      service: 0,
      courier: 0,
      total: 0
    }
  });
  
  const [presets] = useState<BusinessPreset[]>([]);
  const [paymentData, setPaymentData] = useState<{
    paymentMethod: 'CASH' | 'CARD';
    amountReceived: number;
    notes?: string;
  } | null>(null);

  const [tables, setTables] = useState<Table[]>([]);
  const [showTableSelector, setShowTableSelector] = useState(false);

  // Initialize WebSocket connection for real-time updates
  const initializeWebSocket = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to POS real-time server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from POS real-time server');
    });

    // Listen for order status updates
    newSocket.on('order:status:update', (data: { orderId: string; status: string }) => {
      console.log('Order status update received:', data);
      if (data.orderId === currentOrderId) {
        toast.success(`وضعیت سفارش به ${data.status} تغییر کرد`);
      }
    });

    // Listen for payment updates
    newSocket.on('payment:processed', (data: { orderId: string; amount: number }) => {
      console.log('Payment processed:', data);
      if (data.orderId === currentOrderId) {
        toast.success('پرداخت با موفقیت انجام شد');
      }
    });

    // Listen for table status updates
    newSocket.on('table:status:update', (data: { tableId: string; status: string }) => {
      console.log('Table status update:', data);
      if (data.tableId === selectedTable?.id) {
        loadTables(); // Refresh table list
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentOrderId, selectedTable?.id]);

  // Load menu data and tables
  useEffect(() => {
    loadMenuData();
    loadTables();
    initializeWebSocket();
  }, [initializeWebSocket]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch full menu with categories and items
      const menuData = await MenuService.getFullMenu(true) as ApiMenuCategory[]; // onlyAvailable = true
      
      // Transform the data to match our POS interface
      const transformedCategories: MenuCategory[] = menuData.map((category: ApiMenuCategory) => ({
        id: category.id,
        name: category.name,
        items: (category.items || []).map((item: ApiMenuItem) => ({
          id: item.id,
          name: item.displayName,
          price: typeof item.menuPrice === 'string' ? parseFloat(item.menuPrice) : item.menuPrice,
          category: category.id,
          description: item.description || undefined,
          imageUrl: item.thumbnailUrl || undefined,
          isAvailable: item.isAvailable && item.isActive
        }))
      }));
      
      setCategories(transformedCategories);
      
      // Set first category as selected if available
      if (transformedCategories.length > 0) {
        setSelectedCategory(transformedCategories[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات منو';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await TableService.getTables();
      if (Array.isArray(response)) {
        setTables(response);
      } else {
        console.error('Invalid response format for tables:', response);
        setTables([]);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      setTables([]);
      // Don't show error toast for tables as it's not critical for POS functionality
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'آزاد', icon: '🟢', color: 'text-green-600' };
      case 'OCCUPIED':
        return { label: 'مشغول', icon: '🔴', color: 'text-red-600' };
      case 'RESERVED':
        return { label: 'رزرو شده', icon: '🔵', color: 'text-blue-600' };
      case 'CLEANING':
        return { label: 'در حال تمیزکاری', icon: '🟡', color: 'text-yellow-600' };
      case 'OUT_OF_ORDER':
        return { label: 'خارج از سرویس', icon: '⚫', color: 'text-gray-600' };
      default:
        return { label: status, icon: '❓', color: 'text-gray-600' };
    }
  };

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * menuItem.price }
          : item
      ));
    } else {
      const newOrderItem: OrderItem = {
        id: `order-item-${Date.now()}`,
        menuItem,
        quantity: 1,
        modifiers: [],
        totalPrice: menuItem.price
      };
      setOrderItems([...orderItems, newOrderItem]);
    }
  };

  const removeFromOrder = (orderItemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== orderItemId));
  };

  const updateQuantity = (orderItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(orderItemId);
      return;
    }

    setOrderItems(orderItems.map(item =>
      item.id === orderItemId
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.menuItem.price }
        : item
    ));
  };

  // Enhanced calculation with options
  const calculateTotal = useCallback(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Apply discount to subtotal
    let discountAmount = 0;
    if (orderOptions.discountEnabled && orderOptions.discountValue > 0) {
      if (orderOptions.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * orderOptions.discountValue) / 100;
      } else {
        discountAmount = Math.min(orderOptions.discountValue, subtotal);
      }
    }
    
    // Calculate amount after discount
    const amountAfterDiscount = subtotal - discountAmount;
    
    // Apply tax
    let taxAmount = 0;
    if (orderOptions.taxEnabled && orderOptions.taxPercentage > 0) {
      taxAmount = (amountAfterDiscount * orderOptions.taxPercentage) / 100;
    }
    
    // Apply service charge
    let serviceAmount = 0;
    if (orderOptions.serviceEnabled && orderOptions.servicePercentage > 0) {
      serviceAmount = (amountAfterDiscount * orderOptions.servicePercentage) / 100;
    }
    
    // Add courier
    const courierAmount = orderOptions.courierEnabled ? orderOptions.courierAmount : 0;
    
    // Calculate total
    const totalAmount = amountAfterDiscount + taxAmount + serviceAmount + courierAmount;
    
    const newCalculation: OrderCalculation = {
      subtotal,
      discountAmount,
      discountPercentage: orderOptions.discountType === 'PERCENTAGE' ? orderOptions.discountValue : 0,
      taxAmount,
      taxPercentage: orderOptions.taxPercentage,
      serviceAmount,
      servicePercentage: orderOptions.servicePercentage,
      courierAmount,
      totalAmount,
      breakdown: {
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        service: serviceAmount,
        courier: courierAmount,
        total: totalAmount
      }
    };
    
    setCalculation(newCalculation);
    return { subtotal, tax: taxAmount, service: serviceAmount, total: totalAmount };
  }, [orderItems, orderOptions]);

  // Update calculation when order items change
  useEffect(() => {
    calculateTotal();
  }, [orderItems, calculateTotal]);

  // Create order with backend integration
  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('لطفاً حداقل یک آیتم به سفارش اضافه کنید');
      return;
    }

    // Show flexible payment modal instead of immediate payment
    setShowFlexiblePayment(true);
  };

  // Handle flexible payment submission
  const handleFlexiblePaymentSubmit = async (data: {
    paymentType: 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL';
    customerName: string;
    customerPhone: string;
    orderNotes: string;
    paymentMethod?: 'CASH' | 'CARD';
    amountReceived?: number;
    selectedItems?: number[];
  }) => {
    setIsProcessing(true);
    try {
      // Update customer information
      setCustomer({
        name: data.customerName,
        phone: data.customerPhone
      });

      // Prepare order data for backend
      const orderData = {
        orderType,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        tableId: selectedTable?.id,
        guestCount: selectedTable?.capacity,
        items: orderItems.map(item => ({
          itemId: item.menuItem.id,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          specialRequest: item.specialRequest
        })),
        subtotal: calculation.subtotal,
        discountAmount: calculation.discountAmount,
        taxAmount: calculation.taxAmount,
        serviceCharge: calculation.serviceAmount,
        totalAmount: calculation.totalAmount,
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        paidAmount: (() => {
          if (data.paymentType === 'IMMEDIATE') {
            return data.amountReceived || 0;
          } else if (data.paymentType === 'PARTIAL' && data.selectedItems) {
            // Calculate proportional amount for partial payments
            const selectedSubtotal = data.selectedItems.reduce((sum, index) => sum + orderItems[index].totalPrice, 0);
            const subtotalRatio = selectedSubtotal / calculation.subtotal;
            const proportionalDiscount = calculation.discountAmount * subtotalRatio;
            const proportionalTax = calculation.taxAmount * subtotalRatio;
            const proportionalServiceAmount = calculation.serviceAmount * subtotalRatio;
            return selectedSubtotal + proportionalTax + proportionalServiceAmount - proportionalDiscount;
          }
          return 0;
        })(),
        notes: `${orderNotes}\n${data.orderNotes}`.trim()
      };

      // Create order in backend
      const createdOrder = await OrderService.createOrder(orderData);
      
      // Store the order ID for payment processing
      setCurrentOrderId((createdOrder as { id: string }).id);
      
      // Handle immediate payment if selected
      if (data.paymentType === 'IMMEDIATE' && data.paymentMethod && data.amountReceived) {
        setPaymentData({
          paymentMethod: data.paymentMethod,
          amountReceived: data.amountReceived,
          notes: data.orderNotes
        });
        setShowPayment(true);
        // Don't reset form yet - wait until payment is complete
      } else if (data.paymentType === 'PARTIAL' && data.paymentMethod && data.selectedItems && data.selectedItems.length > 0) {
        // For partial payments, calculate proportional amount from selected items
        const selectedSubtotal = data.selectedItems.reduce((sum, index) => sum + orderItems[index].totalPrice, 0);
        const subtotalRatio = selectedSubtotal / calculation.subtotal;
        
        // Calculate proportional adjustments
        const proportionalDiscount = calculation.discountAmount * subtotalRatio;
        const proportionalTax = calculation.taxAmount * subtotalRatio;
        const proportionalServiceAmount = calculation.serviceAmount * subtotalRatio;
        
        // Calculate final proportional total
        const selectedItemsAmount = selectedSubtotal + proportionalTax + proportionalServiceAmount - proportionalDiscount;
        
        // Process partial payment immediately
        try {
          await PaymentService.processPayment({
            orderId: (createdOrder as { id: string }).id,
            amount: selectedItemsAmount,
            paymentMethod: data.paymentMethod as PaymentMethod,
            cashReceived: data.paymentMethod === 'CASH' ? selectedItemsAmount : undefined
          });

          toast.success(`پرداخت جزئی ${formatPrice(selectedItemsAmount)} ریال با موفقیت انجام شد`);
          setShowReceipt(true);
          
          // Reset form after partial payment
          setOrderItems([]);
          setCustomer({});
          setSelectedTable(null);
          setOrderNotes('');
          setCurrentOrderId(null);
          
          // Redirect to orders page for DINE_IN orders
          if (orderType === OrderType.DINE_IN) {
            setTimeout(() => {
              router.push('/workspaces/ordering-sales-system/orders?fromPOS=true&orderType=DINE_IN');
            }, 2000); // Wait 2 seconds to show receipt
          }
        } catch (error) {
          console.error('Error processing partial payment:', error);
          toast.error('خطا در پردازش پرداخت جزئی: ' + (error instanceof Error ? error.message : 'خطای نامشخص'));
        }
      } else {
        // For pay after service, show success message and reset form
        toast.success('سفارش با موفقیت ایجاد شد');
        setShowReceipt(true);
        
        // Reset form only for non-immediate payments
        setOrderItems([]);
        setCustomer({});
        setSelectedTable(null);
        setOrderNotes('');
        
        // Redirect to orders page for DINE_IN orders
        if (orderType === OrderType.DINE_IN) {
          setTimeout(() => {
            router.push('/workspaces/ordering-sales-system/orders?fromPOS=true&orderType=DINE_IN');
          }, 2000); // Wait 2 seconds to show receipt
        }
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('خطا در ایجاد سفارش: ' + (error instanceof Error ? error.message : 'خطای نامشخص'));
    } finally {
      setIsProcessing(false);
      setShowFlexiblePayment(false);
    }
  };

  // Handle adding items to existing order
  const handleAddItemsToOrder = async (items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialRequest?: string;
  }>) => {
    if (!currentOrderId) {
      toast.error('هیچ سفارش فعالی یافت نشد');
      return;
    }

    try {
      // Convert items to the correct format for the API
      const apiItems = items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        modifiers: item.modifiers?.map(mod => ({ modifierId: mod, quantity: 1 })) || [],
        specialRequest: item.specialRequest
      }));

      const updatedOrder = await OrderService.addItemToOrder(currentOrderId, apiItems[0]); // API expects single item
      toast.success('آیتم‌ها با موفقیت به سفارش اضافه شدند');
      
      // Refresh order data if needed
      console.log('Order updated:', updatedOrder);
      
    } catch (error) {
      console.error('Error adding items to order:', error);
      toast.error('خطا در افزودن آیتم‌ها: ' + (error instanceof Error ? error.message : 'خطای نامشخص'));
    }
  };

  // Handle showing add items modal
  const handleShowAddItems = () => {
    if (!currentOrderId) {
      toast.error('هیچ سفارش فعالی یافت نشد');
      return;
    }
    setShowAddItems(true);
  };

  // Handle payment completion with backend integration
  const handlePaymentComplete = async (paymentData: {
    paymentMethod: 'CASH' | 'CARD';
    amountReceived: number;
    notes?: string;
  }) => {
    if (!currentOrderId) {
      toast.error('خطا: شناسه سفارش یافت نشد');
      return;
    }

    setIsProcessing(true);
    try {
      // Process payment in backend
      const paymentResult = await PaymentService.processPayment({
        orderId: currentOrderId,
        amount: paymentData.amountReceived,
        paymentMethod: paymentData.paymentMethod as PaymentMethod,
        cashReceived: paymentData.paymentMethod === 'CASH' ? paymentData.amountReceived : undefined
      });

      // Set payment data for receipt
      setPaymentData(paymentData);
      setShowPayment(false);
      setShowReceipt(true);

      // Log integration results
      console.log('Payment processed:', paymentResult);

      toast.success('پرداخت با موفقیت انجام شد و سفارش تکمیل شد');

      // Reset form after successful payment
      setOrderItems([]);
      setCustomer({});
      setSelectedTable(null);
      setOrderNotes('');
      setCurrentOrderId(null);

      // Redirect to orders page for DINE_IN orders
      if (orderType === OrderType.DINE_IN) {
        setTimeout(() => {
          router.push('/workspaces/ordering-sales-system/orders?fromPOS=true&orderType=DINE_IN');
        }, 2000); // Wait 2 seconds to show receipt
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Handle different error structures
      let errorMessage = 'خطای نامشخص';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error responses
        const apiError = error as { message?: string; error?: string; details?: string };
        if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        } else if (apiError.details) {
          errorMessage = apiError.details;
        }
      }
      
      toast.error('خطا در پردازش پرداخت: ' + errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCategoryItems = categories.find(cat => cat.id === selectedCategory)?.items || [];

  // Recalculate totals whenever order items or options change
  useEffect(() => {
    if (orderItems.length > 0) {
      calculateTotal();
    } else {
      // Reset calculation when no items
      setCalculation({
        subtotal: 0,
        discountAmount: 0,
        discountPercentage: 0,
        taxAmount: 0,
        taxPercentage: orderOptions.taxPercentage,
        serviceAmount: 0,
        servicePercentage: orderOptions.servicePercentage,
        courierAmount: 0,
        totalAmount: 0,
        breakdown: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          service: 0,
          courier: 0,
          total: 0
        }
      });
    }
  }, [orderItems, orderOptions.discountEnabled, orderOptions.discountValue, orderOptions.discountType, orderOptions.taxEnabled, orderOptions.taxPercentage, orderOptions.serviceEnabled, orderOptions.servicePercentage, orderOptions.courierEnabled, orderOptions.courierAmount, calculateTotal]);

  // Initial calculation trigger
  useEffect(() => {
    if (orderItems.length > 0) {
      calculateTotal();
    }
  }, [orderItems.length, calculateTotal]); // Run only on mount

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">ثبت سفارش جدید</h1>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-gray-500 dark:text-gray-400">نوع سفارش:</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={OrderType.DINE_IN}>صرف در محل</option>
                  <option value={OrderType.TAKEAWAY}>بیرون بر</option>
                  <option value={OrderType.DELIVERY}>تحویل</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Link href="/workspaces/ordering-sales-system/orders">
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  <FaList className="inline mr-2" />
                  سفارش‌ها
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 md:p-4">
          <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2">
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">در حال بارگذاری منو...</p>
            ) : error ? (
              <p className="text-center text-red-500 dark:text-red-400">{error}</p>
            ) : categories.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">منوی موجودیت ندارد.</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">در حال بارگذاری آیتم‌ها...</p>
            ) : error ? (
              <p className="text-center text-red-500 dark:text-red-400">{error}</p>
            ) : selectedCategoryItems.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>آیتمی در این دسته پیدا نشد.</p>
              </div>
            ) : (
              selectedCategoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToOrder(item)}
                  disabled={!item.isAvailable}
                  className={`p-3 md:p-4 rounded-lg border-2 text-right transition-all ${
                    item.isAvailable
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 hover:shadow-md'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Item Image */}
                    {item.imageUrl && (
                      <div className="w-full h-24 md:h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2 relative">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={() => {
                            // Hide the image container on error
                            const container = document.querySelector(`[data-image-error="${item.id}"]`);
                            if (container) {
                              (container as HTMLElement).style.display = 'none';
                            }
                          }}
                          data-image-error={item.id}
                        />
                      </div>
                    )}
                    
                    {/* Item Name */}
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm md:text-base line-clamp-2">
                      {item.name}
                    </h3>
                    
                    {/* Item Description */}
                    {item.description && (
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Price */}
                    <p className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(item.price)}
                    </p>
                    
                    {/* Availability Status */}
                    {!item.isAvailable && (
                      <span className="text-xs text-red-500">ناموجود</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Order Cart */}
      <div className="w-full md:w-[400px] lg:w-[500px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Cart Header */}
        <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">سفارش جاری</h2>
          {orderItems.length > 0 && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {orderItems.length} آیتم
            </p>
          )}
        </div>

        {/* Customer & Table Info */}
        <div className="p-3 md:p-4 space-y-2 border-b border-gray-200 dark:border-gray-700">
          {orderType === 'DINE_IN' && (
            <button
              onClick={() => setShowTableSelector(true)}
              className="w-full p-3 text-right bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              {selectedTable ? (
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-white">میز {selectedTable.tableNumber}</div>
                    {selectedTable.tableName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedTable.tableName}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs ${getStatusInfo(selectedTable.status).color}`}>
                    {getStatusInfo(selectedTable.status).label}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">انتخاب میز</span>
              )}
            </button>
          )}
          
          <button
            className="w-full p-3 text-right bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            {customer.name ? (
              <span className="text-gray-900 dark:text-white">{customer.name}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">اطلاعات مشتری (اختیاری)</span>
            )}
          </button>
        </div>

        {/* Order Items - Scrollable Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-4">
            {orderItems.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>سبد خرید خالی است</p>
                <p className="text-sm mt-1">آیتم مورد نظر را انتخاب کنید</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">آیتم‌های انتخاب شده</h3>
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    {orderItems.length} آیتم
                  </span>
                </div>
                
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm md:text-base mb-1 line-clamp-2">{item.menuItem.name}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {formatPrice(item.menuItem.price)} × {item.quantity}
                          </p>
                          <p className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
                            {formatPrice(item.totalPrice)} ریال
                          </p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 md:space-x-3 space-x-reverse">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="w-8 md:w-12 text-center font-bold text-gray-900 dark:text-white text-sm md:text-lg">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromOrder(item.id)}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Actions - Fixed at Bottom */}
        {orderItems.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <OrderSummary
              orderItems={orderItems}
              options={orderOptions}
              calculation={calculation}
              onOptionsChange={setOrderOptions}
              presets={presets}
              onPresetSelect={(preset) => {
                setOrderOptions({
                  discountEnabled: preset.discountEnabled,
                  discountType: preset.discountType as 'PERCENTAGE' | 'AMOUNT',
                  discountValue: preset.discountValue,
                  taxEnabled: preset.taxEnabled,
                  taxPercentage: preset.taxPercentage,
                  serviceEnabled: preset.serviceEnabled,
                  servicePercentage: preset.servicePercentage,
                  courierEnabled: preset.courierEnabled,
                  courierAmount: preset.courierAmount,
                  courierNotes: ''
                });
              }}
            />

            <div className="p-3 md:p-4 space-y-2">
              <button
                onClick={handleCreateOrder}
                disabled={isProcessing}
                className={`w-full py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${
                  isProcessing
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isProcessing ? 'در حال پردازش...' : 'پرداخت و ثبت سفارش'}
              </button>
              
              <button
                onClick={() => setOrderItems([])}
                disabled={isProcessing}
                className={`w-full py-2 rounded-lg transition-colors text-sm md:text-base ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                پاک کردن سبد
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          orderItems={orderItems}
          calculation={calculation}
          options={orderOptions}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Flexible Payment Modal */}
      {showFlexiblePayment && (
        <FlexiblePaymentModal
          isOpen={showFlexiblePayment}
          onClose={() => setShowFlexiblePayment(false)}
          onSubmit={handleFlexiblePaymentSubmit}
          totalAmount={calculation.totalAmount}
          orderItems={orderItems}
          calculation={calculation}
        />
      )}

      {/* Add Items Modal */}
      {showAddItems && (
        <AddItemsModal
          isOpen={showAddItems}
          onClose={() => setShowAddItems(false)}
          onAddItems={handleAddItemsToOrder}
        />
      )}

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">انتخاب میز</h3>
              <button
                onClick={() => setShowTableSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    setShowTableSelector(false);
                  }}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    table.status === 'AVAILABLE'
                      ? 'border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30'
                      : 'border-red-200 bg-red-50 cursor-not-allowed dark:bg-red-900/20 dark:border-red-700'
                  }`}
                  disabled={table.status !== 'AVAILABLE'}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    میز {table.tableNumber}
                  </div>
                  {table.tableName && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {table.tableName}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {table.capacity} نفر
                  </div>
                  <div className={`text-xs mt-1 ${
                    table.status === 'AVAILABLE' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {table.status === 'AVAILABLE' ? 'خالی' : 'اشغال'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && paymentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <ReceiptTemplate
              orderNumber={`ORD-${Date.now()}`}
              orderDate={new Date()}
              orderItems={orderItems}
              calculation={calculation}
              options={orderOptions}
              paymentData={paymentData}
              businessInfo={{
                name: 'کافه سروان',
                address: 'تهران، خیابان ولیعصر',
                phone: '021-12345678',
                taxId: '123456789'
              }}
            />
            <div className="mt-4 flex space-x-2 space-x-reverse modal-buttons">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setPaymentData(null);
                  setOrderItems([]);
                  setCurrentOrderId(null);
                  setOrderOptions({
                    discountEnabled: false,
                    discountType: 'PERCENTAGE',
                    discountValue: 0,
                    taxEnabled: true,
                    taxPercentage: 9.00,
                    serviceEnabled: false,
                    servicePercentage: 10.00,
                    courierEnabled: false,
                    courierAmount: 0,
                    courierNotes: ''
                  });
                }}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 font-medium"
              >
                تکمیل سفارش
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Button */}
      {currentOrderId && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleShowAddItems}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
            title="افزودن آیتم به سفارش"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 