import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { AlertBox } from './ui/AlertBox';
import { API_URL } from '../lib/apiUtils';
import { Form, EnhancedFormConfig } from './forms';
import { UserFormData } from '../types/forms';

interface UserFormModalV2Props {
  user: User | null;
  onClose: (refresh?: boolean) => void;
}

export const UserFormModalV2: React.FC<UserFormModalV2Props> = ({ user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Convert User to UserFormData
  const getInitialValues = useCallback((): UserFormData => ({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'STAFF',
    phoneNumber: user?.phoneNumber || '',
    isActive: user?.active !== false, // Default to true if not specified
  }), [user]);

  // Form configuration using the new system
  const formConfig: EnhancedFormConfig<UserFormData> = useMemo(() => ({
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'نام',
        type: 'text',
        required: true,
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'email',
        name: 'email',
        label: 'ایمیل',
        type: 'email',
        required: true,
        disabled: !!user, // can't change email for existing users
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'password',
        name: 'password',
        label: user ? 'رمز عبور (در صورت تغییر پر شود)' : 'رمز عبور',
        type: 'password',
        required: !user, // required only for new users
        validation: {
          minLength: 6,
          custom: (value) => {
            if (!user && (!value || typeof value !== 'string' || value.length < 6)) {
              return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
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
        label: 'شماره تماس (اختیاری)',
        type: 'tel',
        className: 'form-input',
        wrapperClassName: 'mb-4'
      },
      {
        id: 'role',
        name: 'role',
        label: 'نقش کاربر',
        type: 'select',
        required: true,
        options: [
          { value: 'ADMIN', label: 'مدیر سیستم' },
          { value: 'MANAGER', label: 'مدیر' },
          { value: 'STAFF', label: 'کارمند' }
        ],
        className: 'form-input',
        wrapperClassName: 'mb-4'
      }
    ],
    validation: (data: UserFormData) => {
      const errors: Array<{ field: string; message: string; type: 'required' | 'invalid' | 'custom' | 'server' }> = [];

      // Name validation
      if (!data.name?.trim()) {
        errors.push({ field: 'name', message: 'نام الزامی است', type: 'required' });
      }

      // Email validation
      if (!data.email?.trim()) {
        errors.push({ field: 'email', message: 'ایمیل الزامی است', type: 'required' });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ field: 'email', message: 'ایمیل معتبر نیست', type: 'invalid' });
      }

      // Password validation for new users
      if (!user && (!data.password || typeof data.password !== 'string' || data.password.length < 6)) {
        errors.push({ field: 'password', message: 'رمز عبور باید حداقل ۶ کاراکتر باشد', type: 'required' });
      }

      // Role validation
      if (!data.role) {
        errors.push({ field: 'role', message: 'نقش کاربر الزامی است', type: 'required' });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },
    initialValues: getInitialValues(),
    submitButton: {
      text: user ? 'بروزرسانی' : 'ذخیره',
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
  }), [user, getInitialValues]);

  // Form submission handler
  const handleSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}/users${user ? `/${user.id}` : ''}`;
      const method = user ? 'put' : 'post';
      
      // Remove password if empty and editing existing user
      const submitData = { ...data };
      if (user && !submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ذخیره اطلاعات کاربر');
      }

      setSuccess(user ? 'کاربر با موفقیت بروزرسانی شد' : 'کاربر جدید با موفقیت ایجاد شد');
      
      // Wait a bit to show success message before closing
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: unknown) {
      console.error('Error submitting user form:', err);
      const errorMessage = err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات کاربر. لطفا مجددا تلاش کنید';
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

  // Update form config when user changes
  useEffect(() => {
    formConfig.initialValues = getInitialValues();
  }, [user, formConfig, getInitialValues]);

  return (
    <Modal
      title={user ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
      onClose={() => onClose()}
    >
      {error && <AlertBox type="error" message={error} className="mb-4" />}
      {success && <AlertBox type="success" message={success} className="mb-4" />}

      {/* Form Component */}
      <Form<UserFormData>
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
