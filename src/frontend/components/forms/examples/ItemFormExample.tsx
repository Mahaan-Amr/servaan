import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { getToken } from '../../../services/authService';
import { Form, EnhancedFormConfig } from '../index';
import { ItemFormData } from '../../../types/forms';

interface ItemFormExampleProps {
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

/**
 * Example of using the new form system with ItemForm
 * Demonstrates the enhanced form capabilities
 */
export const ItemFormExample: React.FC<ItemFormExampleProps> = ({ 
  mode, 
  itemId, 
  initialData 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  // Form configuration using the new system
  const formConfig: EnhancedFormConfig<ItemFormData> = {
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'نام کالا',
        type: 'text',
        required: true,
        placeholder: 'نام کالا را وارد کنید',
        helpText: 'نام کامل و توصیفی کالا',
        validation: {
          required: true,
          minLength: 2,
          maxLength: 100
        }
      },
      {
        id: 'category',
        name: 'category',
        label: 'دسته‌بندی',
        type: 'select',
        required: true,
        placeholder: 'دسته‌بندی را انتخاب کنید',
        options: [
          { value: 'electronics', label: 'الکترونیک' },
          { value: 'clothing', label: 'پوشاک' },
          { value: 'food', label: 'مواد غذایی' },
          { value: 'books', label: 'کتاب' },
          { value: 'other', label: 'سایر' }
        ]
      },
      {
        id: 'unit',
        name: 'unit',
        label: 'واحد',
        type: 'select',
        required: true,
        placeholder: 'واحد را انتخاب کنید',
        options: [
          { value: 'piece', label: 'عدد' },
          { value: 'kg', label: 'کیلوگرم' },
          { value: 'liter', label: 'لیتر' },
          { value: 'meter', label: 'متر' },
          { value: 'box', label: 'جعبه' }
        ]
      },
      {
        id: 'minStock',
        name: 'minStock',
        label: 'حداقل موجودی',
        type: 'number',
        required: false,
        placeholder: '0',
        helpText: 'حداقل موجودی مورد نیاز برای هشدار',
        validation: {
          min: 0
        }
      },
      {
        id: 'description',
        name: 'description',
        label: 'توضیحات',
        type: 'textarea',
        required: false,
        placeholder: 'توضیحات اضافی درباره کالا',
        helpText: 'توضیحات اختیاری برای کالا'
      },
      {
        id: 'barcode',
        name: 'barcode',
        label: 'بارکد',
        type: 'text',
        required: false,
        placeholder: '13 رقم بارکد',
        helpText: 'بارکد 13 رقمی کالا (اختیاری)',
        validation: {
          pattern: /^\d{13}$/
        }
      }
    ],
    validation: (data: ItemFormData) => {
      const errors: Array<{ field: string; message: string; type: 'required' | 'invalid' | 'custom' | 'server' }> = [];

      // Required field validation
      if (!data.name?.trim()) {
        errors.push({ field: 'name', message: 'نام کالا الزامی است', type: 'required' });
      } else if (data.name.length < 2) {
        errors.push({ field: 'name', message: 'نام کالا باید حداقل ۲ کاراکتر باشد', type: 'invalid' });
      }

      if (!data.category?.trim()) {
        errors.push({ field: 'category', message: 'دسته‌بندی الزامی است', type: 'required' });
      }

      if (!data.unit?.trim()) {
        errors.push({ field: 'unit', message: 'واحد الزامی است', type: 'required' });
      }

      // Number validation
      if (data.minStock !== undefined && data.minStock < 0) {
        errors.push({ field: 'minStock', message: 'حداقل موجودی نمی‌تواند منفی باشد', type: 'invalid' });
      }

      // Barcode validation
      if (data.barcode && data.barcode.length !== 13) {
        errors.push({ field: 'barcode', message: 'بارکد باید ۱۳ رقم باشد', type: 'invalid' });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: []
      };
    },
    initialValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      unit: initialData?.unit || '',
      minStock: initialData?.minStock || 0,
      description: initialData?.description || '',
      barcode: initialData?.barcode || '',
      image: '',
      isActive: true
    },
    submitButton: {
      text: mode === 'create' ? 'ایجاد کالا' : 'بروزرسانی کالا',
      loadingText: 'در حال ذخیره...',
      className: 'w-full md:w-auto'
    },
    resetButton: {
      text: 'بازنشانی',
      show: true,
      className: 'w-full md:w-auto'
    },
    layout: 'vertical',
    spacing: 'md'
  };

  // Form submission handler
  const handleSubmit = async (data: ItemFormData) => {
    if (!user) {
      throw new Error('کاربر وارد نشده است');
    }

    setLoading(true);
    setSuccess(false);

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
          ...data,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ذخیره کالا');
      }

      setSuccess(true);
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/workspaces/inventory-management/items');
      }, 1500);

    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Form lifecycle events
  const lifecycle = {
    onFieldChange: (event: { field: string; value: unknown; previousValue: unknown; type: string; timestamp: number }) => {
      console.log('Field changed:', event);
    },
    onValidationComplete: (result: { isValid: boolean; errors: Array<{ field: string; message: string; type: string }>; warnings?: string[] }) => {
      console.log('Validation completed:', result);
    },
    onSubmitStart: () => {
      console.log('Form submission started');
    },
    onSubmitComplete: (result: { success: boolean; data?: unknown; message?: string }) => {
      console.log('Form submission completed:', result);
    },
    onReset: () => {
      console.log('Form reset');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'افزودن کالای جدید' : 'ویرایش کالا'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {mode === 'create' 
              ? 'اطلاعات کالای جدید را وارد کنید' 
              : 'اطلاعات کالا را ویرایش کنید'
            }
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {mode === 'create' ? 'کالا با موفقیت ایجاد شد' : 'کالا با موفقیت بروزرسانی شد'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Component */}
        <Form<ItemFormData>
          config={formConfig}
          initialValues={formConfig.initialValues}
          onSubmit={handleSubmit}
          lifecycle={lifecycle}
          showValidationErrors={true}
          autoSave={true}
          autoSaveDelay={5000}
          disabled={loading}
          loading={loading}
        >
          {/* Form content is handled by the config */}
          <div>Form content will be rendered based on the configuration</div>
        </Form>
      </div>
    </div>
  );
};
