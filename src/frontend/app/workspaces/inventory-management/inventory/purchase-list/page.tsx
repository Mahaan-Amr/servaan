'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as inventoryService from '../../../../../services/inventoryService';
import * as itemService from '../../../../../services/itemService';
import type { Item } from '../../../../../services/itemService';
import { InventoryStatus, InventoryEntryType } from '../../../../../../shared/types';
import toast from 'react-hot-toast';
import { FormattedNumberInput } from '../../../../../components/ui/FormattedNumberInput';
import { FarsiDatePicker } from '../../../../../components/ui/FarsiDatePicker';

// localStorage key for purchase lists
const PURCHASE_LISTS_KEY = 'inventory_purchase_lists';

interface PurchaseListItem {
  id: string; // itemId for existing items, custom ID for custom items
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  neededAmount?: number; // Optional amount to buy
  isCustom: boolean; // true for custom items not in inventory
  isCompleted?: boolean; // true if item has been purchased/added to inventory
  completedAt?: string; // ISO date string when item was marked as completed
}

interface PurchaseList {
  id: string; // Unique ID for the purchase list
  name: string; // Name/title of the purchase list
  description?: string; // Optional description
  targetDate: string; // Target date for the purchase (YYYY-MM-DD format)
  status: 'active' | 'completed' | 'cancelled'; // Status of the list
  items: PurchaseListItem[]; // Items in this list
  createdAt: string; // ISO date string when list was created
  updatedAt: string; // ISO date string when list was last updated
  completedAt?: string; // ISO date string when list was completed
}

export default function PurchaseListPage() {
  // View mode: 'list' = show all lists, 'edit' = edit a specific list
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLists, setPurchaseLists] = useState<PurchaseList[]>([]);
  const [currentList, setCurrentList] = useState<PurchaseList | null>(null);
  const [items, setItems] = useState<PurchaseListItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryStatus[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListForm, setNewListForm] = useState({
    name: '',
    description: '',
    targetDate: new Date().toISOString().split('T')[0] // Default to today (YYYY-MM-DD)
  });
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddToInventoryModal, setShowAddToInventoryModal] = useState(false);
  const [selectedItemForInventory, setSelectedItemForInventory] = useState<PurchaseListItem | null>(null);
  const [inventoryFormData, setInventoryFormData] = useState({
    quantity: '',
    unitPrice: '',
    batchNumber: '',
    expiryDate: '',
    note: ''
  });
  const [submittingInventory, setSubmittingInventory] = useState(false);
  const [showCompletedItems, setShowCompletedItems] = useState(true);
  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    category: '',
    unit: '',
    neededAmount: ''
  });
  const [selectedItemId, setSelectedItemId] = useState('');

  // Load all purchase lists from localStorage
  const loadPurchaseLists = useCallback(() => {
    try {
      const savedLists = localStorage.getItem(PURCHASE_LISTS_KEY);
      if (savedLists) {
        const lists: PurchaseList[] = JSON.parse(savedLists);
        // Migrate old lists that don't have targetDate - set to createdAt date
        const migratedLists = lists.map(list => ({
          ...list,
          targetDate: list.targetDate || new Date(list.createdAt).toISOString().split('T')[0]
        }));
        // Save migrated lists back to localStorage
        localStorage.setItem(PURCHASE_LISTS_KEY, JSON.stringify(migratedLists));
        setPurchaseLists(migratedLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      } else {
        setPurchaseLists([]);
      }
    } catch (e) {
      console.error('Error parsing saved purchase lists:', e);
      setPurchaseLists([]);
    }
  }, []);

  // Load inventory data (items, stock, low stock)
  const loadInventoryData = useCallback(async () => {
    try {
      const [itemsData, inventoryData, lowStockData] = await Promise.all([
        itemService.getItems(),
        inventoryService.getCurrentInventory(),
        inventoryService.getLowStockItems()
      ]);

      setAllItems(itemsData.filter(item => item.isActive));
      setInventoryStatus(inventoryData);
      setLowStockItems(lowStockData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات';
      toast.error(errorMessage);
    }
  }, []);

  // Update items with current stock levels
  const updateItemsWithCurrentStock = useCallback(async (listItems: PurchaseListItem[]): Promise<PurchaseListItem[]> => {
    const [itemsData, inventoryData] = await Promise.all([
      itemService.getItems(),
      inventoryService.getCurrentInventory()
    ]);

    return listItems.map(listItem => {
      if (listItem.isCustom) {
        return listItem;
      }
      const item = itemsData.find(i => i.id === listItem.id);
      const invStatus = inventoryData.find(inv => inv.itemId === listItem.id);
      if (item && invStatus) {
        return {
          ...listItem,
          currentStock: invStatus.current,
          minStock: item.minStock || 0
        };
      }
      return listItem;
    });
  }, []);


  useEffect(() => {
    loadInventoryData();
    loadPurchaseLists();
  }, [loadInventoryData, loadPurchaseLists]);

  // Load list items when editing a list
  useEffect(() => {
    if (viewMode === 'edit' && selectedListId && purchaseLists.length > 0) {
      setLoading(true);
      const list = purchaseLists.find(l => l.id === selectedListId);
      if (list) {
        setCurrentList(list);
        updateItemsWithCurrentStock(list.items).then(updatedItems => {
          setItems(updatedItems);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, [viewMode, selectedListId, purchaseLists, updateItemsWithCurrentStock]);

  // Save current list to localStorage whenever items change (only in edit mode)
  useEffect(() => {
    if (viewMode === 'edit' && currentList && items.length >= 0) {
      const updatedList: PurchaseList = {
        ...currentList,
        items: items,
        updatedAt: new Date().toISOString()
      };
      
      const updatedLists = purchaseLists.map(l => 
        l.id === updatedList.id ? updatedList : l
      );
      setPurchaseLists(updatedLists);
      localStorage.setItem(PURCHASE_LISTS_KEY, JSON.stringify(updatedLists));
    }
  }, [items, currentList, viewMode, purchaseLists]);

  // Create new purchase list from low stock items
  const handleCreateNewList = () => {
    if (!newListForm.name.trim()) {
      toast.error('نام لیست خرید الزامی است');
      return;
    }

    // Create list items from low stock items
    const listItems: PurchaseListItem[] = lowStockItems
      .map(lowStock => {
        const item = allItems.find(i => i.id === lowStock.itemId);
        if (item) {
          const minStock = item.minStock || 0;
          const autoNeededAmount = minStock > 0 ? minStock * 1.5 : undefined;
          return {
            id: lowStock.itemId,
            name: lowStock.itemName,
            category: lowStock.category,
            unit: lowStock.unit,
            currentStock: lowStock.current,
            minStock: minStock,
            neededAmount: autoNeededAmount,
            isCustom: false
          } as PurchaseListItem;
        }
        return null;
      })
      .filter((item): item is PurchaseListItem => item !== null);

    const newList: PurchaseList = {
      id: `list_${Date.now()}`,
      name: newListForm.name.trim(),
      description: newListForm.description.trim() || undefined,
      targetDate: newListForm.targetDate, // Target date for the purchase
      status: 'active',
      items: listItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedLists = [newList, ...purchaseLists];
    setPurchaseLists(updatedLists);
    localStorage.setItem(PURCHASE_LISTS_KEY, JSON.stringify(updatedLists));

    // Switch to edit mode for the new list
    setSelectedListId(newList.id);
    setCurrentList(newList);
    setItems(listItems);
    setViewMode('edit');
    setShowCreateListModal(false);
    setNewListForm({ 
      name: '', 
      description: '',
      targetDate: new Date().toISOString().split('T')[0] // Reset to today
    });
    toast.success('لیست خرید جدید ایجاد شد');
  };

  // Open a list for editing
  const handleOpenList = (listId: string) => {
    setSelectedListId(listId);
    setViewMode('edit');
  };

  // Delete a purchase list
  const handleDeleteList = (listId: string) => {
    if (confirm('آیا از حذف این لیست خرید اطمینان دارید؟')) {
      const updatedLists = purchaseLists.filter(l => l.id !== listId);
      setPurchaseLists(updatedLists);
      localStorage.setItem(PURCHASE_LISTS_KEY, JSON.stringify(updatedLists));
      toast.success('لیست خرید حذف شد');
      
      if (selectedListId === listId) {
        setViewMode('list');
        setSelectedListId(null);
        setCurrentList(null);
        setItems([]);
      }
    }
  };

  // Mark list as completed
  const handleCompleteList = (listId: string) => {
    const updatedLists = purchaseLists.map(l => 
      l.id === listId 
        ? { ...l, status: 'completed' as const, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : l
    );
    setPurchaseLists(updatedLists);
    localStorage.setItem(PURCHASE_LISTS_KEY, JSON.stringify(updatedLists));
    toast.success('لیست خرید به عنوان تکمیل شده علامت‌گذاری شد');
  };

  // Add custom item
  const handleAddCustomItem = () => {
    if (!customItemForm.name.trim()) {
      toast.error('نام کالا الزامی است');
      return;
    }

    const newItem: PurchaseListItem = {
      id: `custom_${Date.now()}`,
      name: customItemForm.name.trim(),
      category: customItemForm.category.trim() || 'سایر',
      unit: customItemForm.unit.trim() || 'عدد',
      currentStock: 0,
      minStock: 0,
      neededAmount: customItemForm.neededAmount ? parseFloat(customItemForm.neededAmount) : undefined,
      isCustom: true
    };

    setItems(prev => [...prev, newItem]);
    setCustomItemForm({ name: '', category: '', unit: '', neededAmount: '' });
    setShowAddCustomModal(false);
    toast.success('کالای سفارشی اضافه شد');
  };

  // Add existing item to list
  const handleAddExistingItem = () => {
    if (!selectedItemId) {
      toast.error('لطفاً یک کالا انتخاب کنید');
      return;
    }

    const item = allItems.find(i => i.id === selectedItemId);
    const invStatus = inventoryStatus.find(inv => inv.itemId === selectedItemId);

    if (!item || !invStatus) {
      toast.error('کالا یافت نشد');
      return;
    }

    // Check if already in list
    if (items.find(i => i.id === selectedItemId && !i.isCustom)) {
      toast.error('این کالا قبلاً در لیست اضافه شده است');
      return;
    }

    const minStock = item.minStock || 0;
    const autoNeededAmount = minStock > 0 ? minStock * 1.5 : undefined;
    
    const newItem: PurchaseListItem = {
      id: selectedItemId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: invStatus.current,
      minStock: minStock,
      neededAmount: autoNeededAmount,
      isCustom: false
    };

    setItems(prev => [...prev, newItem]);
    setSelectedItemId('');
    setShowAddItemModal(false);
    toast.success('کالا به لیست اضافه شد');
  };

  // Remove item from list
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('کالا از لیست حذف شد');
  };

  // Update needed amount
  const handleUpdateNeededAmount = (id: string, value: string) => {
    const amount = value ? parseFloat(value) : undefined;
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, neededAmount: amount } : item
      )
    );
  };

  // Mark item as done/completed manually
  const handleMarkAsDone = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              isCompleted: true,
              completedAt: new Date().toISOString()
            }
          : item
      )
    );
    toast.success('کالا به عنوان خریداری شده علامت‌گذاری شد');
  };

  // Unmark item as done (undo)
  const handleUnmarkAsDone = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              isCompleted: false,
              completedAt: undefined
            }
          : item
      )
    );
    toast.success('وضعیت کالا بازگردانده شد');
  };

  // Open add to inventory modal
  const handleOpenAddToInventory = (item: PurchaseListItem) => {
    if (item.isCustom) {
      toast.error('امکان ثبت ورود برای کالای سفارشی وجود ندارد');
      return;
    }
    setSelectedItemForInventory(item);
    setInventoryFormData({
      quantity: item.neededAmount?.toString() || '',
      unitPrice: '',
      batchNumber: '',
      expiryDate: '',
      note: `خرید از لیست خرید: ${item.name}`
    });
    setShowAddToInventoryModal(true);
  };

  // Handle add to inventory submission
  const handleAddToInventory = async () => {
    if (!selectedItemForInventory || selectedItemForInventory.isCustom) {
      return;
    }

    if (!inventoryFormData.quantity || parseFloat(inventoryFormData.quantity) <= 0) {
      toast.error('مقدار باید بیشتر از صفر باشد');
      return;
    }

    setSubmittingInventory(true);
    try {
      await inventoryService.createInventoryEntry({
        itemId: selectedItemForInventory.id,
        quantity: parseFloat(inventoryFormData.quantity),
        type: InventoryEntryType.IN,
        note: inventoryFormData.note.trim() || undefined,
        unitPrice: inventoryFormData.unitPrice ? parseFloat(inventoryFormData.unitPrice) : undefined,
        batchNumber: inventoryFormData.batchNumber.trim() || undefined,
        expiryDate: inventoryFormData.expiryDate || undefined
      });

      toast.success('ورود کالا به انبار با موفقیت ثبت شد');
      
      // Mark item as completed
      setItems(prev =>
        prev.map(item =>
          item.id === selectedItemForInventory.id
            ? {
                ...item,
                isCompleted: true,
                completedAt: new Date().toISOString()
              }
            : item
        )
      );
      
      // Close modal and reset form
      setShowAddToInventoryModal(false);
      setSelectedItemForInventory(null);
      setInventoryFormData({
        quantity: '',
        unitPrice: '',
        batchNumber: '',
        expiryDate: '',
        note: ''
      });

      // Reload inventory data to refresh stock levels
      await loadInventoryData();
      // Update items with new stock
      const updatedItems = await updateItemsWithCurrentStock(items);
      setItems(updatedItems);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت ورود کالا';
      toast.error(errorMessage);
    } finally {
      setSubmittingInventory(false);
    }
  };

  // Get available categories
  const availableCategories = Array.from(new Set(allItems.map(item => item.category))).sort();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format date for display (date only, no time)
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure it's treated as a date, not datetime
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'persian'
    }).format(date);
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading && viewMode === 'list') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // List View - Show all purchase lists
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                لیست خرید انبار
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                مدیریت و ایجاد لیست‌های خرید
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateListModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ایجاد لیست خرید
              </button>
              <Link
                href="/workspaces/inventory-management/inventory"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                بازگشت
              </Link>
            </div>
          </div>
        </div>

        {/* Purchase Lists Grid */}
        {purchaseLists.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              هیچ لیست خریدی وجود ندارد
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              برای شروع، یک لیست خرید جدید ایجاد کنید
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateListModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ایجاد لیست خرید
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseLists.map((list) => (
              <div
                key={list.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {list.name}
                    </h3>
                    {list.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {list.description}
                      </p>
                    )}
                  </div>
                  {list.status === 'completed' && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      تکمیل شده
                    </span>
                  )}
                  {list.status === 'cancelled' && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      لغو شده
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">تعداد اقلام:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{list.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">خریداری شده:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {list.items.filter(i => i.isCompleted).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">تاریخ خرید:</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs">
                      {formatDateOnly(list.targetDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">ایجاد شده:</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs">
                      {formatDate(list.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {list.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleOpenList(list.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleCompleteList(list.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        title="علامت‌گذاری به عنوان تکمیل شده"
                      >
                        ✓
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    title="حذف لیست"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create List Modal */}
        {showCreateListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ایجاد لیست خرید جدید
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام لیست خرید *
                  </label>
                  <input
                    type="text"
                    value={newListForm.name}
                    onChange={(e) => setNewListForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مثال: خرید هفتگی - هفته اول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات (اختیاری)
                  </label>
                  <textarea
                    value={newListForm.description}
                    onChange={(e) => setNewListForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="توضیحات اضافی در مورد این لیست خرید"
                  />
                </div>
                <div>
                  <FarsiDatePicker
                    value={newListForm.targetDate}
                    onChange={(value) => setNewListForm(prev => ({ ...prev, targetDate: value }))}
                    label="تاریخ خرید (پیش‌فرض: امروز)"
                    placeholder="تاریخ خرید را انتخاب کنید"
                    minDate={getTodayDate()} // Prevent selecting past dates
                    className="w-full"
                  />
                </div>
                {lowStockItems.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {lowStockItems.length} کالای کم موجود به صورت خودکار به لیست اضافه خواهد شد
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListForm({ 
                      name: '', 
                      description: '',
                      targetDate: new Date().toISOString().split('T')[0] // Reset to today
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateNewList}
                  disabled={!newListForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ایجاد لیست
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit View - Edit a specific purchase list
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentList?.name || 'ویرایش لیست خرید'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentList?.description || 'مدیریت اقلام لیست خرید'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedListId(null);
                setCurrentList(null);
                setItems([]);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بازگشت به لیست‌ها
            </button>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              افزودن کالا
            </button>
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              افزودن سفارشی
            </button>
            <Link
              href="/workspaces/inventory-management/inventory"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بازگشت
            </Link>
          </div>
        </div>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                تعداد اقلام در لیست: {items.length}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {items.filter(i => i.isCustom).length} کالای سفارشی • {items.filter(i => !i.isCustom).length} کالای موجود
                {items.filter(i => i.isCompleted).length > 0 && (
                  <> • {items.filter(i => i.isCompleted).length} خریداری شده</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {items.filter(i => i.isCompleted).length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompletedItems}
                    onChange={(e) => setShowCompletedItems(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    نمایش خریداری شده‌ها
                  </span>
                </label>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  اقلام با مقدار مشخص: {items.filter(i => i.neededAmount !== undefined).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase List Table */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            لیست خرید خالی است
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            می‌توانید کالاهای موجود یا سفارشی به لیست اضافه کنید
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              افزودن کالا
            </button>
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              افزودن سفارشی
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    نام کالا
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    موجودی فعلی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    حداقل موجودی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    مقدار مورد نیاز (اختیاری)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {items
                  .filter(item => showCompletedItems || !item.isCompleted)
                  .map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      item.isCompleted ? 'opacity-60 bg-gray-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.isCustom && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            سفارشی
                          </span>
                        )}
                        {item.isCompleted && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            ✓ خریداری شده
                          </span>
                        )}
                        <div className={`text-sm font-medium ${
                          item.isCompleted 
                            ? 'text-gray-500 dark:text-gray-400 line-through' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.minStock.toLocaleString()} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-32">
                        <FormattedNumberInput
                          value={item.neededAmount?.toString() || ''}
                          onChange={(value) => handleUpdateNeededAmount(item.id, value)}
                          placeholder="مقدار مورد نیاز"
                          min={0}
                          allowDecimals={true}
                          dir="ltr"
                          className="text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        {!item.isCustom && !item.isCompleted && (
                          <button
                            onClick={() => handleOpenAddToInventory(item)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium"
                            title="ثبت ورود به انبار"
                          >
                            ثبت ورود
                          </button>
                        )}
                        {!item.isCompleted ? (
                          <button
                            onClick={() => handleMarkAsDone(item.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            title="علامت‌گذاری به عنوان خریداری شده"
                          >
                            انجام شد
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnmarkAsDone(item.id)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium"
                            title="بازگرداندن وضعیت"
                          >
                            بازگرداندن
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Custom Item Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              افزودن کالای سفارشی
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام کالا *
                </label>
                <input
                  type="text"
                  value={customItemForm.name}
                  onChange={(e) => setCustomItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="نام کالا"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <input
                  type="text"
                  value={customItemForm.category}
                  onChange={(e) => setCustomItemForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="دسته‌بندی (اختیاری)"
                  list="categories"
                />
                <datalist id="categories">
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  واحد
                </label>
                <input
                  type="text"
                  value={customItemForm.unit}
                  onChange={(e) => setCustomItemForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="واحد (مثلاً: کیلوگرم، عدد)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مقدار مورد نیاز (اختیاری)
                </label>
                <FormattedNumberInput
                  value={customItemForm.neededAmount}
                  onChange={(value) => setCustomItemForm(prev => ({ ...prev, neededAmount: value }))}
                  placeholder="مقدار مورد نیاز"
                  min={0}
                  allowDecimals={true}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddCustomModal(false);
                  setCustomItemForm({ name: '', category: '', unit: '', neededAmount: '' });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleAddCustomItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              افزودن کالا از موجودی
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  انتخاب کالا *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">انتخاب کنید...</option>
                  {allItems
                    .filter(item => !items.find(i => i.id === item.id && !i.isCustom))
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.category}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setSelectedItemId('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleAddExistingItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Inventory Modal */}
      {showAddToInventoryModal && selectedItemForInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ثبت ورود کالا به انبار
            </h2>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                کالا: {selectedItemForInventory.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                موجودی فعلی: {selectedItemForInventory.currentStock.toLocaleString()} {selectedItemForInventory.unit}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مقدار * {selectedItemForInventory.unit && `(${selectedItemForInventory.unit})`}
                </label>
                <FormattedNumberInput
                  value={inventoryFormData.quantity}
                  onChange={(value) => setInventoryFormData(prev => ({ ...prev, quantity: value }))}
                  placeholder="مقدار ورودی"
                  min={0.01}
                  allowDecimals={true}
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  قیمت واحد (اختیاری)
                </label>
                <FormattedNumberInput
                  value={inventoryFormData.unitPrice}
                  onChange={(value) => setInventoryFormData(prev => ({ ...prev, unitPrice: value }))}
                  placeholder="قیمت واحد"
                  min={0}
                  allowDecimals={true}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره بچ (اختیاری)
                </label>
                <input
                  type="text"
                  value={inventoryFormData.batchNumber}
                  onChange={(e) => setInventoryFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="شماره بچ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاریخ انقضا (اختیاری)
                </label>
                <input
                  type="date"
                  value={inventoryFormData.expiryDate}
                  onChange={(e) => setInventoryFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  یادداشت (اختیاری)
                </label>
                <textarea
                  value={inventoryFormData.note}
                  onChange={(e) => setInventoryFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="یادداشت (مثال: خرید از لیست خرید)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddToInventoryModal(false);
                  setSelectedItemForInventory(null);
                  setInventoryFormData({
                    quantity: '',
                    unitPrice: '',
                    batchNumber: '',
                    expiryDate: '',
                    note: ''
                  });
                }}
                disabled={submittingInventory}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleAddToInventory}
                disabled={submittingInventory || !inventoryFormData.quantity || parseFloat(inventoryFormData.quantity) <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submittingInventory ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ثبت...
                  </>
                ) : (
                  'ثبت ورود'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
