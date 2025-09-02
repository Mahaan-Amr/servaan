'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaPlus, FaMinus, FaTrash, FaPrint } from 'react-icons/fa';
import Image from 'next/image';
import { OrderService, MenuService } from '../../../../../services/orderingService';
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
  
  // Receipt printing state
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMenuData();
      setOrderItems(currentItems);
    }
  }, [isOpen, currentItems]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const menuData = await MenuService.getFullMenu();
      console.log('🔍 Menu data received:', menuData);
      
      // Validate and transform menu data
      const validatedMenuData = Array.isArray(menuData) ? menuData.map((category: { id?: string; name?: string; items?: Array<{ id?: string; name?: string; displayName?: string; price?: number; menuPrice?: number; description?: string; imageUrl?: string; isAvailable?: boolean }> }) => ({
        id: category.id || '',
        name: category.name || '',
        items: Array.isArray(category.items) ? category.items.map((item: { id?: string; name?: string; displayName?: string; price?: number; menuPrice?: number; description?: string; imageUrl?: string; isAvailable?: boolean }) => ({
          id: item.id || '',
          name: item.name || item.displayName || 'Unknown Item',
          price: item.price || item.menuPrice || 0,
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
    const existingItem = orderItems.find(orderItem => orderItem.itemId === item.id);
    
    if (existingItem) {
      setOrderItems(prev => prev.map(orderItem => 
        orderItem.itemId === item.id 
          ? { ...orderItem, quantity: orderItem.quantity + 1, totalPrice: (orderItem.quantity + 1) * orderItem.unitPrice }
          : orderItem
      ));
    } else {
      const newOrderItem: OrderItem = {
        id: `temp-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
        modifiers: [],
        specialRequest: ''
      };
      setOrderItems(prev => [...prev, newOrderItem]);
    }
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
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
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
        serviceCharge: totals.serviceCharge,
        totalAmount: totals.totalAmount
      };
      
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
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Use proper tax and service percentages (matching POS system)
    const taxPercentage = 9.00; // 9% tax
    const servicePercentage = 10.00; // 10% service charge
    
    const taxAmount = subtotal * (taxPercentage / 100);
    const serviceCharge = subtotal * (servicePercentage / 100);
    const totalAmount = subtotal + taxAmount + serviceCharge;

    return {
      subtotal,
      taxAmount,
      serviceCharge,
      totalAmount
    };
  };

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

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ویرایش سفارش #{orderId}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex gap-8 h-[calc(95vh-200px)]">
          {/* Left Panel - Menu Items */}
          <div className="flex-1 overflow-hidden">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 pl-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="جستجو در منو..."
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div className="flex space-x-3 space-x-reverse overflow-x-auto pb-2">
                {filteredCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-amber-500 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-4">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">در حال بارگذاری...</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white dark:bg-gray-700 hover:border-amber-300 dark:hover:border-amber-500 group"
                    onClick={() => handleAddItem(item)}
                  >
                    {item.imageUrl && (
                      <div className="relative h-32 mb-4 rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 break-words">
                      {item.description || 'توضیحات موجود نیست'}
                    </p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Order Items */}
          <div className="w-96 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">آیتم‌های سفارش</h3>
            
            {/* Order Items List */}
            <div className="flex-1 overflow-y-auto space-y-4">
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
                  <div key={item.itemId} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{item.itemName}</h4>
                      <button
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white text-lg">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-3 space-x-reverse">
                      <button
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <FaMinus size={14} />
                      </button>
                      <span className="w-16 text-center font-semibold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                        className="w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary */}
            {orderItems.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">جمع آیتم‌ها:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">مالیات (۹٪):</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatPrice(totals.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">خدمات (۱۰٪):</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatPrice(totals.serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl border-t pt-3">
                    <span className="text-gray-900 dark:text-white">مجموع کل:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatPrice(totals.totalAmount)}</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
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
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
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
                    className="w-full py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
