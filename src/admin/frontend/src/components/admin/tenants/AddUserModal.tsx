'use client';

import { useState } from 'react';
import { X, UserPlus, Mail, Phone, Shield, UserCheck, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

interface NewUserData {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState<NewUserData>({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('نام و ایمیل الزامی است');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await createTenantUser(tenantId, formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('کاربر با موفقیت اضافه شد');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        status: 'active'
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطا در اضافه کردن کاربر';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'manager': return UserCheck;
      case 'staff': return Users;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'ادمین';
      case 'manager': return 'مدیر';
      case 'staff': return 'کارمند';
      case 'viewer': return 'مشاهده‌گر';
      default: return 'کارمند';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-admin p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <UserPlus className="h-6 w-6 text-admin-primary ml-2" />
            <h3 className="text-lg font-semibold text-admin-text">افزودن کاربر جدید</h3>
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
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              placeholder="نام و نام خانوادگی کاربر"
              required
            />
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
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="user@example.com"
                required
              />
            </div>
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
              <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
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
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            >
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="pending">در انتظار</option>
            </select>
          </div>

          {/* Role Preview */}
          <div className="bg-gray-50 rounded-admin p-3">
            <div className="flex items-center">
              {(() => {
                const Icon = getRoleIcon(formData.role);
                return <Icon className="h-4 w-4 text-admin-text-muted ml-2" />;
              })()}
              <span className="text-sm text-admin-text">
                نقش انتخاب شده: <span className="font-medium">{getRoleLabel(formData.role)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 space-x-reverse pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-admin-border rounded-admin hover:bg-admin-bg transition-colors"
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
                  در حال اضافه کردن...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-2" />
                  افزودن کاربر
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
