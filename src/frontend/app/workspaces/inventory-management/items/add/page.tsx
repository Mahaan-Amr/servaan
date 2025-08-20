'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import * as itemService from '../../../../../services/itemService';
import toast from 'react-hot-toast';

export default function AddItemPage() {
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    minStock: 0,
    description: '',
    barcode: '',
    image: '',
    isActive: true
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we're in edit mode and load item data
  useEffect(() => {
    const editItemId = searchParams.get('edit');
    if (editItemId) {
      setIsEditMode(true);
      setLoadingItem(true);
      
      // Load item data for editing
      itemService.getItemById(editItemId)
        .then(item => {
          setFormData({
            name: item.name || '',
            category: item.category || '',
            unit: item.unit || '',
            minStock: item.minStock || 0,
            description: item.description || '',
            barcode: item.barcode || '',
            image: item.image || '',
            isActive: item.isActive !== undefined ? item.isActive : true
          });
          
          // Set image preview if item has an image
          if (item.image) {
            setImagePreview(item.image);
          }
        })
        .catch(error => {
          console.error('Error loading item:', error);
          toast.error('خطا در بارگذاری اطلاعات کالا');
          router.push('/workspaces/inventory-management/items');
        })
        .finally(() => {
          setLoadingItem(false);
        });
    }
  }, [searchParams, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'minStock' 
          ? value === '' ? 0 : parseInt(value, 10) 
          : value
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('لطفاً فقط فایل تصویری انتخاب کنید');
        return;
      }
      
      // Validate file size (max 2MB for better performance)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('حجم فایل باید کمتر از 2 مگابایت باشد. لطفاً تصویر کوچکتری انتخاب کنید.');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.category.trim() || !formData.unit.trim()) {
        toast.error('لطفاً تمام فیلدهای ضروری را پر کنید');
        return;
      }

      // Prepare base form data
      let finalItemData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        unit: formData.unit.trim(),
        minStock: formData.minStock > 0 ? formData.minStock : undefined,
        description: formData.description.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        image: formData.image || undefined,
        isActive: formData.isActive
      };

      // Handle image upload if there's a new image file
      if (imageFile) {
        try {
          const base64Image = await convertToBase64(imageFile);
          finalItemData = {
            ...finalItemData,
            image: base64Image
          };
        } catch (error) {
          console.error('Error converting image:', error);
          toast.error('خطا در پردازش تصویر');
          return;
        }
      }

      if (isEditMode) {
        // Update existing item
        const editItemId = searchParams.get('edit');
        if (editItemId) {
          await itemService.updateItem(editItemId, finalItemData);
          toast.success('کالا با موفقیت به‌روزرسانی شد');
        }
      } else {
        // Create new item
        await itemService.createItem(finalItemData);
        toast.success('کالا با موفقیت اضافه شد');
      }

      // Navigate back dynamically
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/workspaces/inventory-management/items');
      }
    } catch (error: unknown) {
      let errorMessage = 'خطا در افزودن کالا';
      
      if (error instanceof Error && error.message) {
        // Handle specific error cases
        if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
          errorMessage = 'حجم تصویر انتخاب شده بسیار بزرگ است. لطفاً تصویر کوچکتری انتخاب کنید یا تصویر را حذف کنید.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'درخواست شما به دلیل حجم زیاد داده با مشکل مواجه شد. لطفاً تصویر را حذف کنید و دوباره تلاش کنید.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingItem) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'ویرایش کالا' : 'افزودن کالای جدید'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode ? 'اطلاعات کالا را ویرایش کنید' : 'اطلاعات کالای جدید را وارد کنید'}
            </p>
          </div>
          <button
            onClick={() => {
              const returnUrl = searchParams.get('returnUrl');
              if (returnUrl) {
                router.push(returnUrl);
              } else {
                router.push('/workspaces/inventory-management/items');
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام کالا *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دسته‌بندی *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                واحد اندازه‌گیری *
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                value={formData.unit}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="مثال: کیلوگرم، عدد، بسته"
              />
            </div>

            <div>
              <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                حداقل موجودی
              </label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                اگر موجودی کمتر از این مقدار باشد، هشدار داده می‌شود
              </p>
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                بارکد
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                value={formData.barcode}
                onChange={handleChange}
                disabled={loading}
                placeholder="بارکد کالا (اختیاری)"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                توضیحات
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                placeholder="توضیحات اضافی در مورد کالا..."
              />
            </div>

            {/* Image Upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تصویر کالا
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <Image 
                        src={imagePreview} 
                        alt="پیش‌نمایش تصویر" 
                        width={128}
                        height={128}
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={loading}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="image" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>آپلود تصویر</span>
                          <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                            disabled={loading}
                          />
                        </label>
                        <p className="pl-1">یا بکشید و رها کنید</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF تا 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="isActive" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                  کالا فعال است
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                کالاهای غیرفعال در عملیات معمول نمایش داده نمی‌شوند
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
            <Link
              href="/workspaces/inventory-management/items"
              className={`px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              لغو
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره کالا'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 