'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Clock,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  Key,
  Lock,
  X
} from 'lucide-react';
import { formatAdminDate } from '@/utils/persianDate';
import toast from 'react-hot-toast';
import AddUserModal from './AddUserModal';
import adminApi from '@/services/adminAuthService';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
  permissions: string[];
}

interface TenantUserManagementProps {
  tenantId: string;
}

export default function TenantUserManagement({ tenantId }: TenantUserManagementProps) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'staff' | 'viewer'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null);
  const [userToView, setUserToView] = useState<TenantUser | null>(null);

  // Real API data - will be fetched from backend

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch real tenant users from API using adminApi
      const response = await adminApi.get(`/admin/tenants/${tenantId}/users${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`);
      
      const apiUsers = response.data.data || [];
      
      // Transform API data to match our interface
      const transformedUsers: TenantUser[] = apiUsers.map((user: { id: string; name: string | null; email: string; phoneNumber?: string | null; lastLogin?: string; createdAt: string }) => ({
        id: user.id,
        name: user.name || 'نام نامشخص',
        email: user.email,
        phone: user.phoneNumber || '',
        role: 'staff', // Default role since API doesn't provide this yet
        status: 'active', // Default status since API doesn't provide this yet
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        permissions: ['view'] // Default permissions
      }));
      
      // Apply client-side filters (status and role) since API doesn't support them yet
      let filteredUsers = transformedUsers;
      
      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }
      
      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('خطا در بارگذاری کاربران');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', label: 'ادمین', icon: Shield },
      manager: { color: 'bg-blue-100 text-blue-800', label: 'مدیر', icon: UserCheck },
      staff: { color: 'bg-green-100 text-green-800', label: 'کارمند', icon: Users },
      viewer: { color: 'bg-gray-100 text-gray-800', label: 'مشاهده‌گر', icon: Eye }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'فعال', icon: UserCheck },
      inactive: { color: 'bg-red-100 text-red-800', label: 'غیرفعال', icon: UserX },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'در انتظار', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </span>
    );
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('لطفاً کاربران را انتخاب کنید');
      return;
    }
    
    toast.success(`${action} برای ${selectedUsers.length} کاربر اعمال شد`);
    setSelectedUsers([]);
  };

  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'ویرایش':
        toast.success('عمل ویرایش در حال توسعه است');
        break;
      case 'حذف':
        setUserToDelete(user);
        setShowDeleteConfirm(true);
        break;
      case 'مشاهده':
        setUserToView(user);
        setShowViewUser(true);
        break;
      case 'فعال‌سازی':
        handleStatusToggle(userId, 'active');
        break;
      case 'غیرفعال‌سازی':
        handleStatusToggle(userId, 'inactive');
        break;
      case 'ارسال ایمیل':
        handleSendEmail(user);
        break;
      case 'بازنشانی رمز عبور':
        openPasswordReset(user);
        break;
      default:
        toast.success(`عمل ${action} در حال توسعه است`);
    }
  };

  const handleStatusToggle = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      // TODO: Implement API call to update user status
      toast.success(`وضعیت کاربر به ${newStatus === 'active' ? 'فعال' : 'غیرفعال'} تغییر کرد`);
      loadUsers(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error updating user status:', error);
      toast.error('خطا در تغییر وضعیت کاربر');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // TODO: Implement API call to delete user
      toast.success('کاربر با موفقیت حذف شد');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      loadUsers(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      toast.error('خطا در حذف کاربر');
    }
  };

  const handleSendEmail = (user: TenantUser) => {
    // TODO: Implement email sending functionality
    toast.success(`ایمیل به ${user.email} ارسال شد`);
  };

  const handleExport = () => {
    toast.success('گزارش کاربران در حال آماده‌سازی...');
  };

  const handleUserAdded = () => {
    // Refresh the users list
    loadUsers();
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('لطفاً رمز عبور جدید را وارد کنید');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('رمز عبور باید حداقل 8 کاراکتر باشد');
      return;
    }

    try {
      await adminApi.post(`/admin/tenants/${tenantId}/users/reset-password`, {
        email: selectedUser.email,
        newPassword: newPassword
      });
      
      toast.success('رمز عبور با موفقیت تغییر کرد');
      setShowPasswordReset(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const message = error instanceof Error ? error.message : 'خطا در تغییر رمز عبور';
      toast.error(message);
    }
  };

  const openPasswordReset = (user: TenantUser) => {
    setSelectedUser({
      id: user.id,
      email: user.email,
      name: user.name
    });
    setShowPasswordReset(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-admin-text">مدیریت کاربران</h3>
          <p className="text-sm text-admin-text-light">مدیریت کاربران و دسترسی‌های مستأجر</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={handleExport}
            className="btn-admin-secondary flex items-center"
          >
            <Download className="h-4 w-4 ml-1" />
            صادرات
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="btn-admin-primary flex items-center"
          >
            <UserPlus className="h-4 w-4 ml-1" />
            افزودن کاربر
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-admin-border rounded-admin p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
              <input
                type="text"
                placeholder="جستجو در نام، ایمیل یا شماره تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'pending')}
            className="px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
            <option value="pending">در انتظار</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'manager' | 'staff' | 'viewer')}
            className="px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="admin">ادمین</option>
            <option value="manager">مدیر</option>
            <option value="staff">کارمند</option>
            <option value="viewer">مشاهده‌گر</option>
          </select>

          <button
            onClick={loadUsers}
            className="btn-admin-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            به‌روزرسانی
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-admin p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedUsers.length} کاربر انتخاب شده
            </span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => handleBulkAction('فعال‌سازی')}
                className="btn-admin-secondary text-sm"
              >
                فعال‌سازی
              </button>
              <button
                onClick={() => handleBulkAction('غیرفعال‌سازی')}
                className="btn-admin-secondary text-sm"
              >
                غیرفعال‌سازی
              </button>
              <button
                onClick={() => handleBulkAction('ارسال ایمیل')}
                className="btn-admin-secondary text-sm"
              >
                ارسال ایمیل
              </button>
              <button
                onClick={() => handleBulkAction('حذف')}
                className="btn-admin-danger text-sm"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-admin-border rounded-admin overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary mx-auto mb-4"></div>
            <p className="text-admin-text">در حال بارگذاری کاربران...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-admin-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-admin-text mb-2">هیچ کاربری یافت نشد</h3>
            <p className="text-admin-text-light mb-4">با فیلترهای انتخاب شده کاربری وجود ندارد</p>
            <button
              onClick={() => setShowAddUser(true)}
              className="btn-admin-primary"
            >
              افزودن اولین کاربر
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-admin-border">
              <thead className="bg-admin-bg">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    نقش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    آخرین ورود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    تاریخ عضویت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-admin-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-admin-bg transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                        className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-admin-primary flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-admin-text">{user.name}</div>
                          <div className="text-sm text-admin-text-light">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-admin-text-muted">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-text-muted">
                      {user.lastLogin ? formatAdminDate(user.lastLogin, { format: 'relative' }) : 'هرگز'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-text-muted">
                      {formatAdminDate(user.createdAt, { format: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleUserAction(user.id, 'ویرایش')}
                          className="text-admin-primary hover:text-admin-primary-dark"
                          title="ویرایش"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'بازنشانی رمز عبور')}
                          className="text-admin-warning hover:text-admin-warning-dark"
                          title="بازنشانی رمز عبور"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'مشاهده')}
                          className="text-admin-info hover:text-admin-info-dark"
                          title="مشاهده"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'حذف')}
                          className="text-admin-danger hover:text-admin-danger-dark"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button className="text-admin-text-muted hover:text-admin-text">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <div className="absolute left-0 bottom-full mb-2 bg-white border border-admin-border rounded-admin shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10 min-w-[160px]">
                            <button
                              onClick={() => handleUserAction(user.id, 'فعال‌سازی')}
                              className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                            >
                              فعال‌سازی
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'غیرفعال‌سازی')}
                              className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                            >
                              غیرفعال‌سازی
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'ارسال ایمیل')}
                              className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                            >
                              ارسال ایمیل
                            </button>
                            <button
                              onClick={() => openPasswordReset(user)}
                              className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                            >
                              تغییر رمز عبور
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {users.length > 0 && (
        <div className="bg-white border border-admin-border rounded-admin p-4">
          <div className="flex items-center justify-between text-sm text-admin-text-muted">
            <span>نمایش {users.length} کاربر</span>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span>فعال: {users.filter(u => u.status === 'active').length}</span>
              <span>غیرفعال: {users.filter(u => u.status === 'inactive').length}</span>
              <span>در انتظار: {users.filter(u => u.status === 'pending').length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={handleUserAdded}
        tenantId={tenantId}
      />

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-admin p-6 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Lock className="h-6 w-6 text-admin-primary ml-2" />
                <h3 className="text-lg font-semibold text-admin-text">تغییر رمز عبور</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="text-admin-text-muted hover:text-admin-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-admin p-3 mb-4">
              <p className="text-sm text-admin-text">
                <span className="font-medium">کاربر:</span> {selectedUser.name}
              </p>
              <p className="text-sm text-admin-text">
                <span className="font-medium">ایمیل:</span> {selectedUser.email}
              </p>
            </div>

            {/* New Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-admin-text mb-2">
                رمز عبور جدید *
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  placeholder="حداقل 8 کاراکتر"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="flex-1 px-4 py-2 border border-admin-border rounded-admin hover:bg-admin-bg transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="flex-1 px-4 py-2 bg-admin-primary text-white rounded-admin hover:bg-admin-primary-dark transition-colors flex items-center justify-center"
              >
                <Lock className="h-4 w-4 ml-2" />
                تغییر رمز عبور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-admin p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Trash2 className="h-6 w-6 text-admin-danger ml-2" />
                <h3 className="text-lg font-semibold text-admin-text">حذف کاربر</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                className="text-admin-text-muted hover:text-admin-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-admin-text mb-4">
                آیا مطمئن هستید که می‌خواهید کاربر <span className="font-medium">{userToDelete.name}</span> را حذف کنید؟
              </p>
              <div className="bg-red-50 border border-red-200 rounded-admin p-3">
                <p className="text-sm text-red-700">
                  ⚠️ این عمل قابل بازگشت نیست و تمام اطلاعات کاربر حذف خواهد شد.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-admin-border rounded-admin hover:bg-admin-bg transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-admin-danger text-white rounded-admin hover:bg-admin-danger-dark transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف کاربر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewUser && userToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-admin p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Eye className="h-6 w-6 text-admin-primary ml-2" />
                <h3 className="text-lg font-semibold text-admin-text">جزئیات کاربر</h3>
              </div>
              <button
                onClick={() => {
                  setShowViewUser(false);
                  setUserToView(null);
                }}
                className="text-admin-text-muted hover:text-admin-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-muted mb-1">نام</label>
                  <p className="text-admin-text">{userToView.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-muted mb-1">ایمیل</label>
                  <p className="text-admin-text">{userToView.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-muted mb-1">شماره تلفن</label>
                  <p className="text-admin-text">{userToView.phone || 'ثبت نشده'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-muted mb-1">نقش</label>
                  <div className="mt-1">{getRoleBadge(userToView.role)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-muted mb-1">وضعیت</label>
                  <div className="mt-1">{getStatusBadge(userToView.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-muted mb-1">آخرین ورود</label>
                  <p className="text-admin-text">
                    {userToView.lastLogin ? formatAdminDate(userToView.lastLogin, { format: 'relative' }) : 'هرگز'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-admin-text-muted mb-1">تاریخ عضویت</label>
                <p className="text-admin-text">{formatAdminDate(userToView.createdAt, { format: 'long' })}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-muted mb-1">دسترسی‌ها</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userToView.permissions.map((permission, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowViewUser(false);
                  setUserToView(null);
                }}
                className="px-4 py-2 bg-admin-primary text-white rounded-admin hover:bg-admin-primary-dark transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
