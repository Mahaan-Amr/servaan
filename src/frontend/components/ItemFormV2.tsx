'use client';

import { useRouter } from 'next/navigation';
import { getToken } from '../services/authService';
import { Form, EnhancedFormConfig } from './forms';
import { ItemFormData } from '../types/forms';

interface ItemFormV2Props {
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

const ItemFormV2: React.FC<ItemFormV2Props> = ({ mode, itemId, initialData }) => {
  const router = useRouter();
  // const { user } = useAuth(); // Unused but kept for future use

  // Convert initialData to match ItemFormData interface
  const getInitialValues = (): ItemFormData => ({
    name: initialData?.name || '',
    category: initialData?.category || '',
    unit: initialData?.unit || '',
    minStock: initialData?.minStock || 0,
    description: initialData?.description || '',
    barcode: initialData?.barcode || '',
    image: '', // Not used in original form but required by interface
    isActive: true, // Default to active
  });

  // Form configuration using the new system
  const formConfig: EnhancedFormConfig<ItemFormData> = {
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'نام کالا *',
        type: 'text',
        required: true,
        placeholder: 'نام کالا را وارد کنید',
        validation: {
          required: true,
          minLength: 2,
          custom: (value) => {
            if (!value || typeof value !== 'string') return 'نام کالا الزامی است';
            if (value.trim().length < 2) return 'نام کالا باید حداقل ۲ کاراکتر باشد';
            return null;
          }
        },
        className: 'w-full',
        wrapperClassName: 'space-y-2'
      },
      {
        id: 'category',
        name: 'category',
        label: 'دسته‌بندی *',
        type: 'text',
        required: true,
        placeholder: 'دسته‌بندی کالا را وارد کنید',
        validation: {
          required: true,
          custom: (value) => {
            if (!value || typeof value !== 'string' || !value.trim()) {
              return 'دسته‌بندی الزامی است';
            }
            return null;
          }
        },
        className: 'w-full',
        wrapperClassName: 'space-y-2'
      },
      {
        id: 'unit',
        name: 'unit',
        label: 'واحد *',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'واحد را انتخاب کنید' },
          { value: 'kg', label: 'کیلوگرم' },
          { value: 'g', label: 'گرم' },
          { value: 'l', label: 'لیتر' },
          { value: 'ml', label: 'میلی‌لیتر' },
          { value: 'piece', label: 'عدد' },
          { value: 'pack', label: 'بسته' }
        ],
        validation: {
          required: true,
          custom: (value) => {
            if (!value || typeof value !== 'string' || !value.trim()) {
              return 'واحد الزامی است';
            }
            return null;
          }
        },
        className: 'w-full',
        wrapperClassName: 'space-y-2'
      },
      {
        id: 'minStock',
        name: 'minStock',
        label: 'حداقل موجودی',
        type: 'number',
        placeholder: 'حداقل موجودی',
        validation: {
          min: 0,
          custom: (value) => {
            if (value !== undefined && value !== null && Number(value) < 0) {
              return 'حداقل موجودی نمی‌تواند منفی باشد';
            }
            return null;
          }
        },
        className: 'w-full',
        wrapperClassName: 'space-y-2'
      },
      {
        id: 'description',
        name: 'description',
        label: 'توضیحات',
        type: 'textarea',
        placeholder: 'توضیحات اضافی در مورد کالا',
        className: 'w-full',
        wrapperClassName: 'space-y-2'
      },
      {
        id: 'barcode',
        name: 'barcode',
        label: 'بارکد',
        type: 'text',
        placeholder: 'بارکد ۱۳ رقمی',
        validation: {
          custom: (value) => {
            if (value && typeof value === 'string' && value.length > 0 && value.length !== 13) {
              return 'بارکد باید ۱۳ رقم باشد';
            }
            return null;
          }
        },
        className: 'w-full',
        wrapperClassName: 'space-y-2'
      }
    ],
    validation: (data: ItemFormData) => {
      const errors: Array<{ field: string; message: string; type: 'required' | 'invalid' | 'custom' | 'server' }> = [];

      // Name validation
      if (!data.name?.trim()) {
        errors.push({ field: 'name', message: 'نام کالا الزامی است', type: 'required' });
      } else if (data.name.trim().length < 2) {
        errors.push({ field: 'name', message: 'نام کالا باید حداقل ۲ کاراکتر باشد', type: 'invalid' });
      }

      // Category validation
      if (!data.category?.trim()) {
        errors.push({ field: 'category', message: 'دسته‌بندی الزامی است', type: 'required' });
      }

      // Unit validation
      if (!data.unit?.trim()) {
        errors.push({ field: 'unit', message: 'واحد الزامی است', type: 'required' });
      }

      // MinStock validation
      if (data.minStock !== undefined && data.minStock < 0) {
        errors.push({ field: 'minStock', message: 'حداقل موجودی نمی‌تواند منفی باشد', type: 'invalid' });
      }

      // Barcode validation
      if (data.barcode && data.barcode.length !== 13) {
        errors.push({ field: 'barcode', message: 'بارکد باید ۱۳ رقم باشد', type: 'invalid' });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },
    initialValues: getInitialValues(),
    submitButton: {
      text: mode === 'create' ? 'ثبت کالا' : 'به‌روزرسانی',
      className: 'flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
      loadingText: 'در حال ثبت...'
    },
    resetButton: {
      text: 'انصراف',
      className: 'flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500',
      show: true
    },
    layout: 'vertical',
    spacing: 'lg'
  };

  // Form submission handler
  const handleSubmit = async (data: ItemFormData) => {
    try {
      const url = mode === 'create' ? '/api/items' : `/api/items/${itemId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          minStock: data.minStock,
          description: data.description || undefined,
          barcode: data.barcode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ثبت اطلاعات');
      }

      router.push('/items');
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error; // Let the form system handle the error
    }
  };

  // Form reset handler
  const handleReset = () => {
    router.back();
  };

  // Form lifecycle events
  const lifecycle = {
    onFieldChange: (event: { field: string; value: unknown; previousValue: unknown; type: string; timestamp: number }) => {
      console.log('Field changed:', event.field, 'from', event.previousValue, 'to', event.value);
    },
    onValidationComplete: (result: { isValid: boolean; errors: Array<{ field: string; message: string; type: string }>; warnings?: string[] }) => {
      console.log('Validation completed:', result.isValid, 'errors:', result.errors.length);
    },
    onSubmitStart: () => {
      console.log('Form submission started');
    },
    onSubmitComplete: (result: { success: boolean; data?: unknown; message?: string }) => {
      console.log('Form submission completed:', result);
    },
    onReset: () => {
      console.log('Form reset');
      handleReset();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {mode === 'create' ? 'افزودن کالای جدید' : 'ویرایش کالا'}
      </h1>

      {/* Form Component */}
      <Form<ItemFormData>
        config={formConfig}
        initialValues={formConfig.initialValues}
        onSubmit={handleSubmit}
        lifecycle={lifecycle}
        showValidationErrors={true}
        autoSave={false}
        disabled={false}
        loading={false}
      >
        <div>Form content will be rendered based on the configuration</div>
      </Form>
    </div>
  );
};

export default ItemFormV2;
