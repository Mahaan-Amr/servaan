'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Item, InventoryEntryType } from '../../../../../shared/types';
import * as itemService from '../../../../services/itemService';
import * as inventoryService from '../../../../services/inventoryService';
import UniversalScanner from '../../../../components/scanner/UniversalScanner';
import toast from 'react-hot-toast';

interface UniversalScanResult {
  code: string;
  format: string;
  timestamp: number;
  mode: 'barcode' | 'qr';
}

export default function ScannerPage() {
  const [foundItem, setFoundItem] = useState<Item | null>(null);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [quickAction, setQuickAction] = useState<'in' | 'out' | null>(null);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [lastScanResult, setLastScanResult] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  // Explicitly type searchResults:
  type SearchResult = { item: Item; score: number; matchType: string };

  // Helper function to calculate edit distance (Levenshtein distance)
  const getEditDistance = useCallback((str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(i - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }, []);

  // Helper function to calculate string similarity
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const editDistance = getEditDistance(longer, shorter);
    return Math.round(((longer.length - editDistance) / longer.length) * 100);
  }, [getEditDistance]);

  // Helper function to suggest similar items
  const suggestSimilarItems = useCallback(async (searchTerm: string, items: Item[]): Promise<Item[]> => {
    const suggestions: { item: Item; score: number }[] = [];
    
    items.forEach(item => {
      let maxScore = 0;
      
      // Check similarity with name
      const nameScore = calculateSimilarity(item.name.toLowerCase(), searchTerm.toLowerCase());
      maxScore = Math.max(maxScore, nameScore);
      
      // Check similarity with category
      const categoryScore = calculateSimilarity(item.category.toLowerCase(), searchTerm.toLowerCase());
      maxScore = Math.max(maxScore, categoryScore);
      
      // Check similarity with barcode
      if (item.barcode) {
        const barcodeScore = calculateSimilarity(item.barcode.toLowerCase(), searchTerm.toLowerCase());
        maxScore = Math.max(maxScore, barcodeScore);
      }
      
      if (maxScore > 30) { // Threshold for suggestions
        suggestions.push({ item, score: maxScore });
      }
    });
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.item);
  }, [calculateSimilarity]);

  const lookupItem = useCallback(async (code: string) => {
    try {
      setIsLookingUp(true);
      
      // Get all items and find by barcode or QR code
      const items = await itemService.getItems();
      
      // Local search results array for this lookup
      const searchResults: SearchResult[] = [];
      
      // Enhanced search with multiple criteria and fuzzy matching
      
      // 1. Exact matches (highest priority)
      const exactMatch = items.find(i => 
        i.barcode === code || 
        i.id === code || 
        i.name === code ||
        i.category === code
      );
      
      if (exactMatch) {
        searchResults.push({ item: exactMatch, score: 100, matchType: 'exact' });
      }
      
      // 2. Partial matches in barcode/ID (high priority)
      items.forEach(item => {
        if (item.barcode && item.barcode.includes(code)) {
          searchResults.push({ item, score: 90, matchType: 'barcode_partial' });
        }
        if (item.id.includes(code)) {
          searchResults.push({ item, score: 85, matchType: 'id_partial' });
        }
      });
      
      // 3. Fuzzy matching in name (medium priority)
      items.forEach(item => {
        const nameLower = item.name.toLowerCase();
        const codeLower = code.toLowerCase();
        
        if (nameLower.includes(codeLower)) {
          const similarity = calculateSimilarity(nameLower, codeLower);
          searchResults.push({ item, score: 60 + similarity, matchType: 'name_fuzzy' });
        }
      });
      
      // 4. Category matching (medium priority)
      items.forEach(item => {
        const categoryLower = item.category.toLowerCase();
        const codeLower = code.toLowerCase();
        
        if (categoryLower.includes(codeLower)) {
          const similarity = calculateSimilarity(categoryLower, codeLower);
          searchResults.push({ item, score: 40 + similarity, matchType: 'category_fuzzy' });
        }
      });
      
      // 5. Supplier matching (low priority)
      items.forEach(item => {
        if (item.suppliers && item.suppliers.length > 0) {
          const supplierMatch = item.suppliers.find(supplier => 
            supplier.supplier?.name.toLowerCase().includes(code.toLowerCase())
          );
          if (supplierMatch) {
            searchResults.push({ item, score: 30, matchType: 'supplier_match' });
          }
        }
      });
      
      // 6. Description/notes matching (lowest priority)
      items.forEach(item => {
        if (item.description && item.description.toLowerCase().includes(code.toLowerCase())) {
          searchResults.push({ item, score: 20, matchType: 'description_match' });
        }
      });
      
      // Remove duplicates and sort by score
      const uniqueResults = searchResults.reduce<SearchResult[]>((acc, current) => {
        const existingIndex = acc.findIndex(r => r.item.id === current.item.id);
        if (existingIndex === -1) {
          acc.push(current);
        } else if (current.score > acc[existingIndex].score) {
          acc[existingIndex] = current;
        }
        return acc;
      }, [] as SearchResult[]);
      
      uniqueResults.sort((a, b) => b.score - a.score);
      
      if (uniqueResults.length > 0) {
        const bestMatch = uniqueResults[0];
        setFoundItem(bestMatch.item);
        
        // Get current inventory status
        const inventory = await inventoryService.getCurrentInventory();
        const stock = inventory.find(inv => inv.itemId === bestMatch.item.id);
        setCurrentStock(stock?.current || 0);
        
        // Show appropriate success message based on match type
        const matchMessages: Record<string, string> = {
          exact: 'کالا یافت شد (تطبیق دقیق)',
          barcode_partial: 'کالا یافت شد (بارکد)',
          id_partial: 'کالا یافت شد (شناسه)',
          name_fuzzy: 'کالا یافت شد (نام)',
          category_fuzzy: 'کالا یافت شد (دسته‌بندی)',
          supplier_match: 'کالا یافت شد (تأمین‌کننده)',
          description_match: 'کالا یافت شد (توضیحات)'
        };
        
        const message = matchMessages[bestMatch.matchType] || 'کالا یافت شد';
        toast.success(`${message}: ${bestMatch.item.name}`);
        
        // Store search suggestion for future use
        // const searchSuggestion = {
        //   code,
        //   itemId: bestMatch.item.id,
        //   itemName: bestMatch.item.name,
        //   matchType: bestMatch.matchType,
        //   score: bestMatch.score,
        //   timestamp: Date.now()
        // };
        
        // Add to search history (keep last 10)
        setScanHistory(prev => {
          const newHistory = [code, ...prev.filter(c => c !== code)].slice(0, 10);
          return newHistory;
        });
        
        // Show additional matches if available
        if (uniqueResults.length > 1) {
          toast(`${uniqueResults.length - 1} نتیجه مشابه دیگر نیز یافت شد`);
        }
        
      } else {
        toast.error('کالایی با این کد یافت نشد');
        setFoundItem(null);
        setCurrentStock(0);
        
        // Suggest closest matches
        const suggestions = await suggestSimilarItems(code, items);
        if (suggestions.length > 0) {
          toast(`آیا منظورتان این موارد بود؟ ${suggestions.slice(0, 2).map(s => s.name).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error looking up item:', error);
      toast.error('خطا در جستجوی کالا');
      setFoundItem(null);
      setCurrentStock(0);
    } finally {
      setIsLookingUp(false);
    }
  }, [calculateSimilarity, suggestSimilarItems]);

  const handleScanResult = useCallback((result: UniversalScanResult) => {
    const { code, mode } = result;
    
    // Update scan history
    setScanHistory(prev => {
      const newHistory = [code, ...prev.filter(c => c !== code)].slice(0, 5);
      return newHistory;
    });
    
    setLastScanResult(code);
    
    // Show scan mode in toast
    const modeText = mode === 'barcode' ? 'بارکد' : 'QR کد';
    toast.success(`${modeText} اسکن شد: ${code.substring(0, 20)}${code.length > 20 ? '...' : ''}`);
    
    // Lookup item
    lookupItem(code);
  }, [lookupItem]);

  const handleScanError = useCallback((error: string) => {
    console.error('Scanner error:', error);
    toast.error(error);
  }, []);

  const handleQuickTransaction = async () => {
    if (!foundItem || !quickAction || !quantity) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      toast.error('مقدار باید بیشتر از صفر باشد');
      return;
    }

    if (quickAction === 'out' && qty > currentStock) {
      toast.error('موجودی کافی نیست');
      return;
    }

    try {
      setLoading(true);
      
      await inventoryService.createInventoryEntry({
        itemId: foundItem.id,
        quantity: qty,
        type: quickAction === 'in' ? InventoryEntryType.IN : InventoryEntryType.OUT,
        note: note.trim() || `${quickAction === 'in' ? 'ورود' : 'خروج'} سریع از طریق اسکنر`
      });

      toast.success(`${quickAction === 'in' ? 'ورود' : 'خروج'} کالا با موفقیت ثبت شد`);
      
      // Reset form
      setQuantity('');
      setNote('');
      setQuickAction(null);
      
      // Update current stock
      const newStock = quickAction === 'in' 
        ? currentStock + qty 
        : currentStock - qty;
      setCurrentStock(newStock);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت تراکنش';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setFoundItem(null);
    setCurrentStock(0);
    setQuantity('');
    setNote('');
    setQuickAction(null);
    setLastScanResult('');
  };

  const retryLastScan = () => {
    if (lastScanResult) {
      lookupItem(lastScanResult);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              اسکنر هوشمند
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              اسکن بارکد و QR کد کالاها برای عملیات سریع انبار
            </p>
          </div>
          <Link
            href="/workspaces/inventory-management"
            className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            بازگشت
          </Link>
        </div>
      </div>

      {/* Scanner */}
      <UniversalScanner
        onScanResult={handleScanResult}
        onError={handleScanError}
        defaultMode="barcode"
        showModeSelector={true}
      />

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">تاریخچه اسکن</h3>
          <div className="space-y-2">
            {scanHistory.map((code, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3 gap-2 sm:gap-0">
                <span className="font-mono text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-all">
                  {code.length > 30 ? `${code.substring(0, 30)}...` : code}
                </span>
                <button
                  onClick={() => lookupItem(code)}
                  disabled={isLookingUp}
                  className="px-2 sm:px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
                >
                  جستجو مجدد
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan Result */}
      {lastScanResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">نتیجه اسکن</h2>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={retryLastScan}
                disabled={isLookingUp}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                {isLookingUp ? 'در حال جستجو...' : 'جستجو مجدد'}
              </button>
              <button
                onClick={resetScanner}
                className="px-2 sm:px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm"
              >
                اسکن جدید
              </button>
            </div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد اسکن شده
              </label>
              <p className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-lg break-all">
                {lastScanResult}
              </p>
            </div>

            {isLookingUp ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                <span className="mr-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">در حال جستجوی کالا...</span>
              </div>
            ) : foundItem ? (
              <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-medium text-green-800 dark:text-green-400 mb-2 sm:mb-3">
                  ✅ کالا یافت شد
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">نام:</span>
                    <span className="mr-2 text-green-800 dark:text-green-400">{foundItem.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">دسته‌بندی:</span>
                    <span className="mr-2 text-green-800 dark:text-green-400">{foundItem.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">واحد:</span>
                    <span className="mr-2 text-green-800 dark:text-green-400">{foundItem.unit}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">موجودی فعلی:</span>
                    <span className="mr-2 text-green-800 dark:text-green-400">
                      {currentStock.toLocaleString('fa-IR')} {foundItem.unit}
                    </span>
                  </div>
                  {foundItem.barcode && (
                    <div>
                      <span className="font-medium text-green-700 dark:text-green-300">بارکد:</span>
                      <span className="mr-2 text-green-800 dark:text-green-400 font-mono text-xs">
                        {foundItem.barcode}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">حداقل موجودی:</span>
                    <span className="mr-2 text-green-800 dark:text-green-400">
                      {foundItem.minStock?.toLocaleString('fa-IR') || 'تعیین نشده'} {foundItem.unit}
                    </span>
                  </div>
                </div>
                
                {/* Stock Status Alert */}
                <div className="mt-3">
                  {currentStock === 0 ? (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      ⚠️ کالا خارج از موجودی است
                    </div>
                  ) : foundItem.minStock && currentStock <= foundItem.minStock ? (
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      ⚠️ موجودی کم است
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      ✅ موجودی مناسب
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-medium text-red-800 dark:text-red-400 mb-2">
                  ❌ کالا یافت نشد
                </h3>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mb-3">
                  کالایی با این کد در سیستم ثبت نشده است.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
                  <Link
                    href="/workspaces/inventory-management/items/add"
                    className="inline-flex items-center px-2 sm:px-3 py-2 border border-red-300 dark:border-red-700 text-xs sm:text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    افزودن کالای جدید
                  </Link>
                  <button
                    onClick={retryLastScan}
                    disabled={isLookingUp}
                    className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 disabled:opacity-50"
                  >
                    تلاش مجدد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {foundItem && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">عملیات سریع انبار</h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
              <button
                onClick={() => setQuickAction('in')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${
                  quickAction === 'in'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ورود کالا
              </button>
              <button
                onClick={() => setQuickAction('out')}
                disabled={currentStock === 0}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                  quickAction === 'out'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                خروج کالا {currentStock === 0 && '(ناموجود)'}
              </button>
            </div>

            {quickAction && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                {/* Preset Quantity Buttons */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مقادیر پیش‌فرض
                  </label>
                  <div className="flex space-x-2 space-x-reverse flex-wrap gap-2">
                    {[1, 5, 10, 25, 50, 100].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setQuantity(preset.toString())}
                        disabled={quickAction === 'out' && preset > currentStock}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          quantity === preset.toString()
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    {foundItem.minStock && (
                      <button
                        onClick={() => setQuantity(foundItem.minStock!.toString())}
                        disabled={quickAction === 'out' && foundItem.minStock! > currentStock}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          quantity === foundItem.minStock!.toString()
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-500'
                        }`}
                      >
                        حداقل ({foundItem.minStock})
                      </button>
                    )}
                    {quickAction === 'out' && currentStock > 0 && (
                      <button
                        onClick={() => setQuantity(currentStock.toString())}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          quantity === currentStock.toString()
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40 border border-red-300 dark:border-red-500'
                        }`}
                      >
                        همه ({currentStock})
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الگوهای سریع
                  </label>
                  <div className="flex space-x-2 space-x-reverse flex-wrap gap-2">
                    {quickAction === 'in' ? (
                      <>
                        <button
                          onClick={() => {
                            setQuantity('50');
                            setNote('تأمین عادی');
                          }}
                          className="px-3 py-1 rounded-md text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40 border border-green-300 dark:border-green-500"
                        >
                          تأمین عادی
                        </button>
                        <button
                          onClick={() => {
                            setQuantity('100');
                            setNote('تأمین فوری');
                          }}
                          className="px-3 py-1 rounded-md text-sm font-medium bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40 border border-orange-300 dark:border-orange-500"
                        >
                          تأمین فوری
                        </button>
                        <button
                          onClick={() => {
                            const restockAmount = foundItem.minStock ? Math.max(foundItem.minStock * 2, 20) : 20;
                            setQuantity(restockAmount.toString());
                            setNote('تکمیل موجودی');
                          }}
                          className="px-3 py-1 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40 border border-blue-300 dark:border-blue-500"
                        >
                          تکمیل موجودی
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setQuantity('1');
                            setNote('فروش خرده');
                          }}
                          className="px-3 py-1 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40 border border-blue-300 dark:border-blue-500"
                        >
                          فروش خرده
                        </button>
                        <button
                          onClick={() => {
                            setQuantity('10');
                            setNote('فروش عمده');
                          }}
                          className="px-3 py-1 rounded-md text-sm font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40 border border-purple-300 dark:border-purple-500"
                        >
                          فروش عمده
                        </button>
                        <button
                          onClick={() => {
                            setQuantity('1');
                            setNote('معیوب/منقضی');
                          }}
                          className="px-3 py-1 rounded-md text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40 border border-red-300 dark:border-red-500"
                        >
                          معیوب/منقضی
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مقدار * ({foundItem.unit})
                    </label>
                    <div className="flex space-x-2 space-x-reverse">
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0.01"
                        max={quickAction === 'out' ? currentStock : undefined}
                        step="0.01"
                        disabled={loading}
                        className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                        placeholder={`مقدار ${quickAction === 'in' ? 'ورودی' : 'خروجی'}`}
                      />
                      {/* Quick +/- buttons */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseFloat(quantity) || 0;
                            const newValue = current + 1;
                            if (quickAction === 'in' || newValue <= currentStock) {
                              setQuantity(newValue.toString());
                            }
                          }}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-t border border-gray-300 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseFloat(quantity) || 0;
                            const newValue = Math.max(0, current - 1);
                            setQuantity(newValue.toString());
                          }}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-b border border-gray-300 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
                        >
                          -
                        </button>
                      </div>
                    </div>
                    {quickAction === 'out' && (
                      <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        حداکثر: {currentStock.toLocaleString('fa-IR')} {foundItem.unit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="note" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      توضیحات
                    </label>
                    <input
                      type="text"
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={loading}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                      placeholder="توضیحات اختیاری"
                    />
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                {quantity && (
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {quickAction === 'in' ? (
                        <>
                          موجودی پس از ورود: <span className="font-medium text-green-600 dark:text-green-400">
                            {(currentStock + parseFloat(quantity)).toLocaleString('fa-IR')} {foundItem.unit}
                          </span>
                        </>
                      ) : (
                        <>
                          موجودی پس از خروج: <span className="font-medium text-red-600 dark:text-red-400">
                            {(currentStock - parseFloat(quantity)).toLocaleString('fa-IR')} {foundItem.unit}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => {
                          setQuantity('');
                          setNote('');
                        }}
                        className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm sm:text-base"
                      >
                        پاک کردن
                      </button>
                      <button
                        onClick={handleQuickTransaction}
                        disabled={loading || !quantity || (quickAction === 'out' && parseFloat(quantity) > currentStock)}
                        className={`px-4 sm:px-6 py-2 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                          quickAction === 'in' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -mr-1 ml-3 h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            در حال ثبت...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            ثبت {quickAction === 'in' ? 'ورود' : 'خروج'} ({parseFloat(quantity).toLocaleString('fa-IR')} {foundItem.unit})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      {foundItem && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">لینک‌های سریع</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href={`/workspaces/inventory-management/items/${foundItem.id}`}
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 ml-2 sm:ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">جزئیات کالا</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">مشاهده اطلاعات کامل</p>
              </div>
            </Link>

            <Link
              href={`/workspaces/inventory-management/items/${foundItem.id}/edit`}
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 ml-2 sm:ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">ویرایش کالا</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">اصلاح اطلاعات</p>
              </div>
            </Link>

            <Link
              href="/workspaces/inventory-management/inventory/add"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 ml-2 sm:ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">تراکنش جدید</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ثبت تراکنش دستی</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 