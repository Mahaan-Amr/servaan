import { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { AlertBox } from './ui/AlertBox';
import { API_URL } from '../lib/apiUtils';

interface UserFormModalProps {
  user: User | null;
  onClose: (refresh?: boolean) => void;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  phoneNumber: string;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // don't prefill password
        role: user.role || 'STAFF',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}/users${user ? `/${user.id}` : ''}`;
      const method = user ? 'put' : 'post';
      
      // Remove password if empty and editing existing user
      const submitData = { ...formData };
      if (user && !submitData.password) {
        delete submitData.password;
      }

      await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess(user ? 'کاربر با موفقیت بروزرسانی شد' : 'کاربر جدید با موفقیت ایجاد شد');
      
      // Wait a bit to show success message before closing
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: unknown) {
      console.error('Error submitting user form:', err);
      const errorMessage = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && err.response !== null && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'خطا در ذخیره اطلاعات کاربر. لطفا مجددا تلاش کنید';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={user ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
      onClose={() => onClose()}
    >
      {error && <AlertBox type="error" message={error} className="mb-4" />}
      {success && <AlertBox type="success" message={success} className="mb-4" />}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="form-label">
            نام
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
            required
            disabled={!!user} // can't change email for existing users
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            رمز عبور {user && '(در صورت تغییر پر شود)'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required={!user} // required only for new users
            minLength={6}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phoneNumber" className="form-label">
            شماره تماس (اختیاری)
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
          <label htmlFor="role" className="form-label">
            نقش کاربر
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="ADMIN">مدیر سیستم</option>
            <option value="MANAGER">مدیر</option>
            <option value="STAFF">کارمند</option>
          </select>
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
            {loading ? <Spinner size="small" /> : user ? 'بروزرسانی' : 'ذخیره'}
          </button>
        </div>
      </form>
    </Modal>
  );
}; 