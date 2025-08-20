import { useState, useEffect, useCallback, useMemo } from 'react';
import { Supplier } from '../types';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { AlertBox } from '../components/ui/AlertBox';
import { Form, EnhancedFormConfig } from './forms';
import { SupplierFormData } from '../types/forms';

interface SupplierFormModalV2Props {
  supplier: Supplier | null;
  onClose: (refresh?: boolean) => void;
}

export const SupplierFormModalV2: React.FC<SupplierFormModalV2Props> = ({ supplier, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Convert Supplier to SupplierFormData
  const getInitialValues = useCallback((): SupplierFormData => ({
    name: supplier?.name || '',
    contactName: supplier?.contactName || '',
    email: supplier?.email || '',
    phoneNumber: supplier?.phoneNumber || '',
    address: supplier?.address || '',
    notes: supplier?.notes || '',
    isActive: supplier?.isActive ?? true,
  }), [supplier]);

  // Form configuration using the new system
  const formConfig: EnhancedFormConfig<SupplierFormData> = useMemo(() => ({
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'نام تأمین‌کننده',
        type: 'text',
        required: true,
        placeholder: 'نام تأمین‌کننده را وارد کنید',
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'contactName',
        name: 'contactName',
        label: 'نام مسئول',
        type: 'text',
        placeholder: 'نام مسئول تماس',
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'email',
        name: 'email',
        label: 'ایمیل',
        type: 'email',
        placeholder: 'ایمیل تأمین‌کننده',
        validation: {
          custom: (value) => {
            if (value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'ایمیل معتبر نیست';
            }
            return null;
          }
        },
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'phoneNumber',
        name: 'phoneNumber',
        label: 'شماره تماس',
        type: 'tel',
        placeholder: 'شماره تماس تأمین‌کننده',
        validation: {
          custom: (value) => {
            if (value && typeof value === 'string' && !/^(\+98|98|0)?9\d{9}$/.test(value.replace(/\s/g, ''))) {
              return 'شماره تماس معتبر نیست';
            }
            return null;
          }
        },
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'address',
        name: 'address',
        label: 'آدرس',
        type: 'textarea',
        placeholder: 'آدرس تأمین‌کننده',
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'notes',
        name: 'notes',
        label: 'یادداشت‌ها',
        type: 'textarea',
        placeholder: 'یادداشت‌های اضافی',
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'isActive',
        name: 'isActive',
        label: 'فعال',
        type: 'checkbox',
        className: 'form-checkbox',
        wrapperClassName: 'mb-4'
      }
    ],
    validation: (data: SupplierFormData) => {
      const errors: Array<{ field: string; message: string; type: 'required' | 'invalid' | 'custom' | 'server' }> = [];

      // Name validation
      if (!data.name?.trim()) {
        errors.push({ field: 'name', message: 'نام تأمین‌کننده الزامی است', type: 'required' });
      }

      // Email validation
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ field: 'email', message: 'ایمیل معتبر نیست', type: 'invalid' });
      }

      // Phone validation
      if (data.phoneNumber && !/^(\+98|98|0)?9\d{9}$/.test(data.phoneNumber.replace(/\s/g, ''))) {
        errors.push({ field: 'phoneNumber', message: 'شماره تماس معتبر نیست', type: 'invalid' });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },
    initialValues: getInitialValues(),
    submitButton: {
      text: supplier ? 'بروزرسانی' : 'ذخیره',
      className: 'btn btn-primary',
      loadingText: 'در حال ذخیره...'
    },
    resetButton: {
      text: 'انصراف',
      className: 'btn btn-outline',
      show: true
    },
    layout: 'vertical',
    spacing: 'md'
  }), [supplier, getInitialValues]);

  // Form submission handler
  const handleSubmit = async (data: SupplierFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const url = `${apiUrl}/suppliers${supplier ? `/${supplier.id}` : ''}`;
      const method = supplier ? 'put' : 'post';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ذخیره اطلاعات تأمین‌کننده');
      }

      setSuccess(supplier ? 'تأمین‌کننده با موفقیت بروزرسانی شد' : 'تأمین‌کننده جدید با موفقیت ایجاد شد');
      
      // Wait a bit to show success message before closing
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: unknown) {
      console.error('Error submitting supplier form:', err);
      const errorMessage = err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات تأمین‌کننده. لطفا مجددا تلاش کنید';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Form reset handler
  const handleReset = () => {
    onClose();
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

  // Update form config when supplier changes
  useEffect(() => {
    formConfig.initialValues = getInitialValues();
  }, [supplier, formConfig, getInitialValues]);

  return (
    <Modal
      title={supplier ? 'ویرایش تأمین‌کننده' : 'افزودن تأمین‌کننده جدید'}
      onClose={() => onClose()}
    >
      {error && <AlertBox type="error" message={error} className="mb-4" />}
      {success && <AlertBox type="success" message={success} className="mb-4" />}

      {/* Form Component */}
      <Form<SupplierFormData>
        config={formConfig}
        initialValues={formConfig.initialValues}
        onSubmit={handleSubmit}
        lifecycle={lifecycle}
        showValidationErrors={true}
        autoSave={false}
        disabled={loading}
        loading={loading}
      >
        <div>Form content will be rendered based on the configuration</div>
      </Form>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center mt-4">
          <Spinner size="small" />
        </div>
      )}
    </Modal>
  );
};
