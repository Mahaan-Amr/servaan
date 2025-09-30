'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, UserCheck, Users, Eye, UserX, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/services/adminAuthService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'manager' | 'staff' | 'viewer';
    status: 'active' | 'inactive' | 'pending';
  } | null;
}

interface EditUserData {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
}

export default function EditUserModal({ isOpen, onClose, onSuccess, tenantId, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<EditUserData>({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        status: user.status || 'active'
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'نام کاربر الزامی است';
    if (!formData.email) {
      newErrors.email = 'ایمیل کاربر الزامی است';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'فرمت ایمیل نامعتبر است';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) {
      return;
    }

    setLoading(true);
    try {
      // Update user via API using adminApi
      await adminApi.put(`/admin/tenants/${tenantId}/users/${user.id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        status: formData.status
      });
      
      toast.success('اطلاعات کاربر با موفقیت به‌روزرسانی شد');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const message = error instanceof Error ? error.message : 'خطا در به‌روزرسانی کاربر';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 ml-2" />;
      case 'manager': return <UserCheck className="h-4 w-4 ml-2" />;
      case 'staff': return <Users className="h-4 w-4 ml-2" />;
      case 'viewer': return <Eye className="h-4 w-4 ml-2" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-4 w-4 ml-2 text-green-500" />;
      case 'inactive': return <UserX className="h-4 w-4 ml-2 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 ml-2 text-yellow-500" />;
      default: return null;
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-admin p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <User className="h-6 w-6 text-admin-primary ml-2" />
            <h3 className="text-lg font-semibold text-admin-text">ویرایش کاربر</h3>
          </div>
          <button
            onClick={onClose}
            className="text-admin-text-muted hover:text-admin-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">
              نام و نام خانوادگی *
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2 border ${errors.name ? 'border-red-500' : 'border-admin-border'} rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent`}
                placeholder="نام و نام خانوادگی کاربر"
                required
              />
            </div>
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">
              ایمیل *
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2 border ${errors.email ? 'border-red-500' : 'border-admin-border'} rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent`}
                placeholder="user@example.com"
                required
              />
            </div>
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">
              شماره تلفن
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="09123456789"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">
              نقش
            </label>
            <div className="relative">
              {getRoleIcon(formData.role)}
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent appearance-none"
              >
                <option value="staff">کارمند</option>
                <option value="manager">مدیر</option>
                <option value="admin">ادمین</option>
                <option value="viewer">مشاهده‌گر</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">
              وضعیت
            </label>
            <div className="relative">
              {getStatusIcon(formData.status)}
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent appearance-none"
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="pending">در انتظار</option>
              </select>
            </div>
          </div>

          {/* Role Preview */}
          <div className="bg-gray-50 rounded-admin p-3">
            <div className="flex items-center">
              {getRoleIcon(formData.role)}
              <span className="text-sm text-admin-text">
                نقش انتخاب شده: <span className="font-medium">
                  {formData.role === 'admin' ? 'ادمین' : 
                   formData.role === 'manager' ? 'مدیر' : 
                   formData.role === 'staff' ? 'کارمند' : 'مشاهده‌گر'}
                </span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 space-x-reverse pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-admin-border rounded-admin hover:bg-admin-bg transition-colors"
              disabled={loading}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-admin-primary text-white rounded-admin hover:bg-admin-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                  در حال به‌روزرسانی...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 ml-2" />
                  به‌روزرسانی کاربر
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
