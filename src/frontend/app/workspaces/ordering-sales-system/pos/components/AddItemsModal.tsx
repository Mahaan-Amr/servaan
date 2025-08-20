'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaPlus } from 'react-icons/fa';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialRequest?: string;
  }>) => void;
}

export default function AddItemsModal({ isOpen, onClose, onAddItems }: AddItemsModalProps) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; items: MenuItem[] }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialRequest?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMenuData();
    }
  }, [isOpen]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      const mockCategories = [
        {
          id: '1',
          name: 'غذاهای اصلی',
          items: [
            { id: '1', name: 'کباب کوبیده', price: 85000, category: '1', isAvailable: true },
            { id: '2', name: 'کباب برگ', price: 95000, category: '1', isAvailable: true },
            { id: '3', name: 'جوجه کباب', price: 75000, category: '1', isAvailable: true }
          ]
        },
        {
          id: '2',
          name: 'نوشیدنی‌ها',
          items: [
            { id: '4', name: 'دوغ', price: 15000, category: '2', isAvailable: true },
            { id: '5', name: 'نوشابه', price: 12000, category: '2', isAvailable: true },
            { id: '6', name: 'آب معدنی', price: 8000, category: '2', isAvailable: true }
          ]
        }
      ];
      setCategories(mockCategories);
      if (mockCategories.length > 0) {
        setSelectedCategory(mockCategories[0].id);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: MenuItem) => {
    const existingItem = selectedItems.find(selected => selected.itemId === item.id);
    
    if (existingItem) {
      setSelectedItems(prev => prev.map(selected => 
        selected.itemId === item.id 
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems(prev => [...prev, {
        itemId: item.id,
        quantity: 1,
        unitPrice: item.price,
        modifiers: [],
        specialRequest: ''
      }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setSelectedItems(prev => prev.map(item => 
        item.itemId === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleSubmit = () => {
    if (selectedItems.length > 0) {
      onAddItems(selectedItems);
      onClose();
      setSelectedItems([]);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR'
    }).format(amount);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.items.some(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const filteredItems = currentCategory?.items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن آیتم به سفارش</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex gap-6 h-[calc(90vh-200px)]">
          {/* Left Panel - Menu Items */}
          <div className="flex-1 overflow-hidden">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                  placeholder="جستجو در منو..."
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2">
                {filteredCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto h-full">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleAddItem(item)}
                  >
                    {item.imageUrl && (
                      <div className="relative h-24 mb-3">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {item.description || 'توضیحات موجود نیست'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-600 font-bold">{formatPrice(item.price)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItem(item);
                        }}
                        className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors"
                      >
                        <FaPlus className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Selected Items */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-600 pr-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">آیتم‌های انتخاب شده</h3>
            
            <div className="space-y-3 overflow-y-auto h-full">
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>هیچ آیتمی انتخاب نشده</p>
                </div>
              ) : (
                selectedItems.map(item => {
                  const menuItem = categories
                    .flatMap(cat => cat.items)
                    .find(menuItem => menuItem.id === item.itemId);
                  
                  return (
                    <div key={item.itemId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{menuItem?.name}</h4>
                        <button
                          onClick={() => handleRemoveItem(item.itemId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatPrice(item.unitPrice)} × {item.quantity}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                          className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total and Submit */}
            {selectedItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">مجموع:</span>
                  <span className="text-lg font-bold text-amber-600">
                    {formatPrice(selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0))}
                  </span>
                </div>
                
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                >
                  افزودن به سفارش
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
