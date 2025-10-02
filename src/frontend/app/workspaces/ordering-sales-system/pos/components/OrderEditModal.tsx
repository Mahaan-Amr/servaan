'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaPlus, FaMinus, FaTrash, FaPrint } from 'react-icons/fa';
import Image from 'next/image';
import { OrderService, MenuService } from '../../../../../services/orderingService';
import type { OrderOptions, OrderCalculation, BusinessPreset } from '../../../../../services/orderingService';
import OrderSummary from './OrderSummary';
import { toast } from 'react-hot-toast';
import ReceiptTemplate from './ReceiptTemplate';

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
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: string[];
  specialRequest?: string;
}

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentItems: OrderItem[];
  onOrderUpdated: () => void;
}

interface OrderData {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';
  status: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  items: Array<{
    id: string;
    itemId: string | null;
    menuItemId: string | null;
    itemName: string;
    quantity: number;
    totalPrice: number;
    item?: {
      id: string;
      name: string;
      price: number;
    } | null;
    menuItem?: {
      id: string;
      name: string;
      price: number;
    } | null;
  }>;
  tableInfo?: {
    tableNumber: string;
    tableName?: string;
  };
  paymentData?: {
    paymentMethod: 'CASH' | 'CARD';
    amountReceived: number;
    notes?: string;
  };
}

export default function OrderEditModal({ 
  isOpen, 
  onClose, 
  orderId, 
  currentItems, 
  onOrderUpdated 
}: OrderEditModalProps) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; items: MenuItem[] }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(currentItems);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Options and calculation to mirror POS create flow
  const [orderOptions, setOrderOptions] = useState<OrderOptions>({
    discountEnabled: false,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    taxEnabled: true,
    taxPercentage: 9.0,
    serviceEnabled: false,
    servicePercentage: 10.0,
    courierEnabled: false,
    courierAmount: 0,
    courierNotes: ''
  });
  const [calculation, setCalculation] = useState<OrderCalculation>({
    subtotal: 0,
    discountAmount: 0,
    discountPercentage: 0,
    taxAmount: 0,
    taxPercentage: 9.0,
    serviceAmount: 0,
    servicePercentage: 10.0,
    courierAmount: 0,
    totalAmount: 0,
    breakdown: { subtotal: 0, discount: 0, tax: 0, service: 0, courier: 0, total: 0 }
  });
  const [presets] = useState<BusinessPreset[]>([]);
  
  // Receipt printing state
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMenuData();
      // Merge duplicate rows with same itemId into a single entry for clean UI/state
      const mergedMap = new Map<string, OrderItem>();
      currentItems.forEach(ci => {
        const key = (ci.itemId && ci.itemId.trim()) || ci.itemName.trim().toLowerCase();
        const existing = mergedMap.get(key);
        if (existing) {
          const newQty = existing.quantity + ci.quantity;
          mergedMap.set(key, {
            ...existing,
            quantity: newQty,
            totalPrice: Number(existing.unitPrice) * newQty
          });
        } else {
          mergedMap.set(key, { ...ci, unitPrice: Number(ci.unitPrice), totalPrice: Number(ci.totalPrice) });
        }
      });
      setOrderItems(Array.from(mergedMap.values()));
    }
  }, [isOpen, currentItems]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const menuData = await MenuService.getFullMenu();
      console.log('🔍 Menu data received:', menuData);
      
      // Validate and transform menu data
      const validatedMenuData = Array.isArray(menuData) ? menuData.map((category: { id?: string; name?: string; items?: Array<{ id?: string; name?: string; displayName?: string; price?: number | string; menuPrice?: number | string; description?: string; imageUrl?: string; isAvailable?: boolean }> }) => ({
        id: category.id || '',
        name: category.name || '',
        items: Array.isArray(category.items) ? category.items.map((item: { id?: string; name?: string; displayName?: string; price?: number | string; menuPrice?: number | string; description?: string; imageUrl?: string; isAvailable?: boolean }) => ({
          id: item.id || '',
          name: item.name || item.displayName || 'Unknown Item',
          price: Number((item.price as number | string | undefined) ?? (item.menuPrice as number | string | undefined) ?? 0),
          category: category.id || '',
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          isAvailable: item.isAvailable !== false
        })) : []
      })) : [];
      
      console.log('✅ Validated menu data:', validatedMenuData);
      setCategories(validatedMenuData);
      if (validatedMenuData.length > 0) {
        setSelectedCategory(validatedMenuData[0].id);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      toast.error('خطا در بارگذاری منو');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: MenuItem) => {
    // Use functional state update to avoid race conditions and ensure merging
    setOrderItems(prev => {
      const index = prev.findIndex(orderItem =>
        orderItem.itemId === item.id || orderItem.itemName.trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      if (index !== -1) {
        const updated = [...prev];
        const existing = updated[index];
        const newQuantity = existing.quantity + 1;
        updated[index] = {
          ...existing,
          quantity: newQuantity,
          totalPrice: newQuantity * Number(existing.unitPrice)
        };
        return updated;
      }
      const newOrderItem: OrderItem = {
        id: `temp-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price),
        modifiers: [],
        specialRequest: ''
      };
      return [...prev, newOrderItem];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setOrderItems(prev => prev.map(item => 
        item.itemId === itemId 
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * Number(item.unitPrice) }
          : item
      ));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Calculate new totals
      const totals = calculateTotals();
      
      // Find items that were removed (in currentItems but not in orderItems)
      const removedItems = currentItems.filter(currentItem => 
        !orderItems.find(orderItem => orderItem.itemId === currentItem.itemId)
      );
      
      // Find items with quantity changes (in both currentItems and orderItems but with different quantities)
      const quantityChanges = orderItems
        .filter(orderItem => !orderItem.id.startsWith('temp-')) // Only existing items
        .map(orderItem => {
          const currentItem = currentItems.find(item => item.itemId === orderItem.itemId);
          if (currentItem && currentItem.quantity !== orderItem.quantity) {
            return {
              itemId: orderItem.itemId,
              newQuantity: orderItem.quantity
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{ itemId: string; newQuantity: number }>;
      
      // Find new items (items with temp- IDs)
      const newItems = orderItems.filter(item => item.id.startsWith('temp-'));
      
      // Remove items that were deleted
      if (removedItems.length > 0) {
        const itemIdsToRemove = removedItems.map(item => item.id);
        await OrderService.removeItemsFromOrder(orderId, itemIdsToRemove);
      }
      
      // Update quantities for existing items
      if (quantityChanges.length > 0) {
        await OrderService.updateItemQuantities(orderId, quantityChanges);
      }
      
      // Add new items
      if (newItems.length > 0) {
        const apiItems = newItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          modifiers: item.modifiers,
          specialRequest: item.specialRequest
        }));

        await OrderService.addItemsToOrder(orderId, apiItems);
      }
      
      // Update order totals
      const updateData = {
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        serviceCharge: totals.serviceAmount,
        totalAmount: totals.totalAmount
      };
      
      // Remove any duplicate order item rows in backend (if existed originally)
      const duplicatesToRemove: string[] = [];
      const currentByItemId = new Map<string, OrderItem[]>();
      currentItems.forEach(ci => {
        const arr = currentByItemId.get(ci.itemId) || [];
        arr.push(ci);
        currentByItemId.set(ci.itemId, arr);
      });
      currentByItemId.forEach(list => {
        if (list.length > 1) {
          // keep the first, remove the rest
          list.slice(1).forEach(li => duplicatesToRemove.push(li.id));
        }
      });
      if (duplicatesToRemove.length > 0) {
        await OrderService.removeItemsFromOrder(orderId, duplicatesToRemove);
      }

      await OrderService.updateOrder(orderId, updateData);
      
      toast.success('سفارش با موفقیت به‌روزرسانی شد');
      onOrderUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving order changes:', error);
      toast.error('خطا در به‌روزرسانی سفارش');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintReceipt = async () => {
    try {
      setReceiptLoading(true);
      
      // Fetch complete order data
      const orderDetails = await OrderService.getOrderById(orderId) as OrderData;
      console.log('🔍 Order details for receipt:', orderDetails);
      console.log('🔍 Order items structure:', orderDetails.items);
      
      // Debug: Check for null items
      const nullItems = orderDetails.items.filter(item => !item || !item.item);
      if (nullItems.length > 0) {
        console.warn('⚠️ Found items with null item property:', nullItems);
      }
      
      setOrderData(orderDetails);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('خطا در دریافت اطلاعات سفارش برای چاپ رسید');
    } finally {
      setReceiptLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR'
    }).format(amount);
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    // Discount
    let discountAmount = 0;
    if (orderOptions.discountEnabled && orderOptions.discountValue > 0) {
      discountAmount = orderOptions.discountType === 'PERCENTAGE'
        ? (subtotal * orderOptions.discountValue) / 100
        : Math.min(orderOptions.discountValue, subtotal);
    }
    const afterDiscount = subtotal - discountAmount;
    // Tax
    const taxAmount = orderOptions.taxEnabled ? (afterDiscount * orderOptions.taxPercentage) / 100 : 0;
    // Service
    const serviceCharge = orderOptions.serviceEnabled ? (afterDiscount * orderOptions.servicePercentage) / 100 : 0;
    // Courier
    const courierAmount = orderOptions.courierEnabled ? orderOptions.courierAmount : 0;
    const totalAmount = afterDiscount + taxAmount + serviceCharge + courierAmount;
    const calc: OrderCalculation = {
      subtotal,
      discountAmount,
      discountPercentage: orderOptions.discountType === 'PERCENTAGE' ? orderOptions.discountValue : 0,
      taxAmount,
      taxPercentage: orderOptions.taxPercentage,
      serviceAmount: serviceCharge,
      servicePercentage: orderOptions.servicePercentage,
      courierAmount,
      totalAmount,
      breakdown: { subtotal, discount: discountAmount, tax: taxAmount, service: serviceCharge, courier: courierAmount, total: totalAmount }
    };
    return calc;
  };

  // Recalculate when items or options change
  useEffect(() => {
    const calc = calculateTotals();
    // Guard against unnecessary state updates that could cause extra renders
    setCalculation(prev => {
      const same = JSON.stringify(prev) === JSON.stringify(calc);
      return same ? prev : calc;
    });
  }, [orderItems, orderOptions]);

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.items?.some(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const filteredItems = currentCategory?.items?.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Use memoized calculation already in state
  // 'totals' retained for compatibility with existing save logic
  const totals = calculation; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Lock background scroll while modal is open
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous || '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 overscroll-contain">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-7xl h-[95vh] shadow-2xl flex flex-col min-h-0">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">ویرایش سفارش #{orderId}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="flex gap-6 h-full p-4 min-h-0">
            {/* Left Panel - Menu Items */}
            <div className="flex-1 overflow-y-auto pr-2 min-h-0" style={{contain: 'paint'}}>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="جستجو در منو..."
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-1">
                {filteredCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-3">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">در حال بارگذاری...</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-all duration-150 cursor-pointer bg-white dark:bg-gray-700 hover:border-amber-300 dark:hover:border-amber-500 group"
                    onClick={() => handleAddItem(item)}
                  >
                    {item.imageUrl && (
                      <div className="relative h-24 mb-2 rounded-md overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-150"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 break-words line-clamp-2">
                      {item.description || 'توضیحات موجود نیست'}
                    </p>
                    <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

            {/* Right Panel - Order Items */}
            <div className="w-80 h-full flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 overflow-hidden min-h-0" style={{contain: 'paint'}}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">آیتم‌های سفارش</h3>
            
            {/* Scrollable content: items + summary */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4" style={{overscrollBehavior: 'contain'}}>
            {/* Order Items List */}
            <div className="space-y-3">
              {orderItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FaPlus className="text-gray-400" size={24} />
                  </div>
                  <p className="text-lg">هیچ آیتمی در سفارش وجود ندارد</p>
                  <p className="text-sm mt-2">برای اضافه کردن آیتم، روی آیتم‌های منو کلیک کنید</p>
                </div>
              ) : (
                orderItems.map(item => (
                  <div key={item.itemId} className="border border-gray-200 dark:border-gray-600 rounded-md p-2.5 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-xs">{item.itemName}</h4>
                      <button
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white text-xs">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                        className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="w-8 text-center font-semibold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                        className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary - same component as POS */}
            {orderItems.length > 0 && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                <OrderSummary
                  orderItems={orderItems.map(i => ({
                    id: i.id,
                    menuItem: { id: i.itemId, name: i.itemName, price: i.unitPrice, category: '', isAvailable: true },
                    quantity: i.quantity,
                    modifiers: i.modifiers,
                    totalPrice: i.totalPrice
                  }))}
                  options={orderOptions}
                  calculation={calculation}
                  onOptionsChange={setOrderOptions}
                  presets={presets}
                  showItemsList={false}
                  defaultExpanded
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

              </div>
            )}
            </div>

            {/* Footer buttons (fixed within panel) */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-3">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    saving
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
                
                <button
                  onClick={handlePrintReceipt}
                  disabled={receiptLoading}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    receiptLoading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  <FaPrint className="inline ml-2" />
                  {receiptLoading ? 'در حال چاپ...' : 'چاپ رسید'}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold text-sm"
                >
                  انصراف
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">رسید سفارش</h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <ReceiptTemplate
              orderNumber={orderData.orderNumber}
              orderDate={new Date(orderData.orderDate)}
              orderItems={orderData.items
                .filter((item: OrderData['items'][0]) => item && (item.item || item.menuItem || item.itemName)) // Filter out completely invalid items
                .map((item: OrderData['items'][0]) => ({
                  id: item.id,
                  menuItem: {
                    id: item.item?.id || item.menuItem?.id || item.menuItemId || '',
                    name: item.item?.name || item.menuItem?.name || item.itemName || 'Unknown Item',
                    price: item.item?.price || item.menuItem?.price || 0
                  },
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
                }))}
              calculation={{
                subtotal: orderData.subtotal,
                discountAmount: orderData.discountAmount,
                discountPercentage: orderData.discountAmount > 0 ? (orderData.discountAmount / orderData.subtotal) * 100 : 0,
                taxAmount: orderData.taxAmount,
                taxPercentage: 9.00,
                serviceAmount: orderData.serviceCharge,
                servicePercentage: 10.00,
                courierAmount: 0,
                totalAmount: orderData.totalAmount,
                breakdown: {
                  subtotal: orderData.subtotal,
                  discount: orderData.discountAmount,
                  tax: orderData.taxAmount,
                  service: orderData.serviceCharge,
                  courier: 0,
                  total: orderData.totalAmount
                }
              }}
              options={{
                discountEnabled: orderData.discountAmount > 0,
                discountType: 'PERCENTAGE',
                discountValue: 0,
                taxEnabled: orderData.taxAmount > 0,
                taxPercentage: 9.00,
                serviceEnabled: orderData.serviceCharge > 0,
                servicePercentage: 10.00,
                courierEnabled: false,
                courierAmount: 0,
                courierNotes: ''
              }}
              paymentData={orderData.paymentData || {
                paymentMethod: 'CASH',
                amountReceived: orderData.totalAmount,
                notes: ''
              }}
              businessInfo={{
                name: 'کافه سروان',
                address: 'تهران، خیابان ولیعصر',
                phone: '021-12345678',
                taxId: '123456789'
              }}
              orderType={orderData.orderType}
              tableInfo={orderData.tableInfo}
              onPrintComplete={() => setShowReceipt(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
