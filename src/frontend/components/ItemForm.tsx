'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ItemFormProps {
  mode: 'create' | 'edit';
  itemId?: string;
  initialData?: {
    name: string;
    category: string;
    unit: string;
    minStock: number;
    description?: string;
    barcode?: string;
  };
}

interface FormData {
  name: string;
  category: string;
  unit: string;
  minStock: number;
  description: string;
  barcode: string;
}

interface FormErrors {
  name?: string;
  category?: string;
  unit?: string;
  minStock?: string;
  barcode?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ mode, itemId, initialData }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    category: initialData?.category || '',
    unit: initialData?.unit || '',
    minStock: initialData?.minStock || 0,
    description: initialData?.description || '',
    barcode: initialData?.barcode || '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام کالا الزامی است';
    } else if (formData.name.length < 2) {
      newErrors.name = 'نام کالا باید حداقل ۲ کاراکتر باشد';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'دسته‌بندی الزامی است';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'واحد الزامی است';
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'حداقل موجودی نمی‌تواند منفی باشد';
    }

    if (formData.barcode && formData.barcode.length !== 13) {
      newErrors.barcode = 'بارکد باید ۱۳ رقم باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const url = mode === 'create' ? '/api/items' : `/api/items/${itemId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          minStock: formData.minStock,
          description: formData.description || undefined,
          barcode: formData.barcode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ثبت اطلاعات');
      }

      router.push('/items');
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ name: error instanceof Error ? error.message : 'خطا در ثبت اطلاعات' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {mode === 'create' ? 'افزودن کالای جدید' : 'ویرایش کالا'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6" role="form">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            نام کالا *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="نام کالا را وارد کنید"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            دسته‌بندی *
          </label>
          <input
            type="text"
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="دسته‌بندی کالا را وارد کنید"
          />
          {errors.category && <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
            واحد *
          </label>
          <select
            id="unit"
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unit ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">واحد را انتخاب کنید</option>
            <option value="kg">کیلوگرم</option>
            <option value="g">گرم</option>
            <option value="l">لیتر</option>
            <option value="ml">میلی‌لیتر</option>
            <option value="piece">عدد</option>
            <option value="pack">بسته</option>
          </select>
          {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
        </div>

        <div>
          <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
            حداقل موجودی
          </label>
          <input
            type="number"
            id="minStock"
            value={formData.minStock}
            onChange={(e) => handleInputChange('minStock', Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minStock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="حداقل موجودی"
            min="0"
          />
          {errors.minStock && <p className="mt-1 text-sm text-red-600">{errors.minStock}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            توضیحات
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="توضیحات اضافی در مورد کالا"
          />
        </div>

        <div>
          <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
            بارکد
          </label>
          <input
            type="text"
            id="barcode"
            value={formData.barcode}
            onChange={(e) => handleInputChange('barcode', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.barcode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="بارکد ۱۳ رقمی"
            maxLength={13}
          />
          {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'در حال ثبت...' : mode === 'create' ? 'ثبت کالا' : 'به‌روزرسانی'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm; 