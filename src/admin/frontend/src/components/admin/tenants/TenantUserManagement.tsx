'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  Key
} from 'lucide-react';
import { formatAdminDate } from '@/utils/persianDate';
import toast from 'react-hot-toast';

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

  // Mock data - in real implementation, this would come from API
  const mockUsers: TenantUser[] = [
    {
      id: '1',
      name: 'احمد محمدی',
      email: 'ahmad@example.com',
      phone: '09123456789',
      role: 'admin',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      permissions: ['all']
    },
    {
      id: '2',
      name: 'مریم احمدی',
      email: 'maryam@example.com',
      phone: '09123456788',
      role: 'manager',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      permissions: ['orders', 'customers', 'inventory']
    },
    {
      id: '3',
      name: 'علی رضایی',
      email: 'ali@example.com',
      phone: '09123456787',
      role: 'staff',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      permissions: ['orders', 'customers']
    },
    {
      id: '4',
      name: 'سارا کریمی',
      email: 'sara@example.com',
      phone: '09123456786',
      role: 'viewer',
      status: 'pending',
      lastLogin: undefined,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      permissions: ['view']
    },
    {
      id: '5',
      name: 'حسن نوری',
      email: 'hasan@example.com',
      phone: '09123456785',
      role: 'staff',
      status: 'inactive',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
      permissions: ['orders']
    }
  ];

  useEffect(() => {
    loadUsers();
  }, [tenantId, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredUsers = mockUsers;
      
      // Apply search filter
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone && user.phone.includes(searchTerm))
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }
      
      // Apply role filter
      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      toast.error('خطا در بارگذاری کاربران');
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
    toast.success(`${action} برای کاربر اعمال شد`);
  };

  const handleExport = () => {
    toast.success('گزارش کاربران در حال آماده‌سازی...');
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
            onChange={(e) => setStatusFilter(e.target.value as any)}
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
            onChange={(e) => setRoleFilter(e.target.value as any)}
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
            <span>نمایش {users.length} کاربر از {mockUsers.length} کل کاربران</span>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span>فعال: {mockUsers.filter(u => u.status === 'active').length}</span>
              <span>غیرفعال: {mockUsers.filter(u => u.status === 'inactive').length}</span>
              <span>در انتظار: {mockUsers.filter(u => u.status === 'pending').length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
