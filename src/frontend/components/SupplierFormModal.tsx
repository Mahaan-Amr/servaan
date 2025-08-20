import { useState, useEffect } from 'react';
import axios from 'axios';
import { Supplier } from '../types';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { AlertBox } from '../components/ui/AlertBox';

interface SupplierFormModalProps {
  supplier: Supplier | null;
  onClose: (refresh?: boolean) => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ supplier, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phoneNumber: '',
    address: '',
    notes: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contactName: supplier.contactName || '',
        email: supplier.email || '',
        phoneNumber: supplier.phoneNumber || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive
      });
    }
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const url = `${apiUrl}/suppliers${supplier ? `/${supplier.id}` : ''}`;
      const method = supplier ? 'put' : 'post';
      
      await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess(supplier ? 'تأمین‌کننده با موفقیت بروزرسانی شد' : 'تأمین‌کننده جدید با موفقیت ایجاد شد');
      
      // Wait a bit to show success message before closing
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: unknown) {
      console.error('Error submitting supplier form:', err);
      const errorMessage = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && err.response !== null && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'خطا در ذخیره اطلاعات تأمین‌کننده. لطفا مجددا تلاش کنید';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={supplier ? 'ویرایش تأمین‌کننده' : 'افزودن تأمین‌کننده جدید'}
      onClose={() => onClose()}
    >
      {error && <AlertBox type="error" message={error} className="mb-4" />}
      {success && <AlertBox type="success" message={success} className="mb-4" />}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="form-label">
            نام تأمین‌کننده
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contactName" className="form-label">
            نام شخص رابط
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="form-label">
            ایمیل
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phoneNumber" className="form-label">
            شماره تماس
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="form-label">
            آدرس
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="notes" className="form-label">
            یادداشت‌ها
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-input"
            rows={3}
          />
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-primary-500"
          />
          <label htmlFor="isActive" className="form-label ml-2 mb-0">
            فعال
          </label>
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse mt-6">
          <button
            type="button"
            onClick={() => onClose()}
            className="btn btn-outline"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <Spinner size="small" /> : supplier ? 'بروزرسانی' : 'ذخیره'}
          </button>
        </div>
      </form>
    </Modal>
  );
}; 