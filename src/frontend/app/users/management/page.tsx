'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from '../../../components/ui/Spinner';
import { AlertBox } from '../../../components/ui/AlertBox';
import { UserCard } from '../../../components/UserCard';
import { UserInvitationModal } from '../../../components/UserInvitationModal';
import { PageHeader } from '../../../components/ui/PageHeader';
import { User } from '../../../types';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { handleAuthError, isCurrentUser, clearAuthTokens } from '../../../utils/auth';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState('all');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
      setError('');
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      
      // Use auth utility for consistent error handling
      if (!handleAuthError(err, setError)) {
        setError('خطا در بارگذاری لیست کاربران');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    // Special warning for self-deletion
    const confirmMessage = isCurrentUser(userId) 
      ? 'آیا از حذف حساب کاربری خود اطمینان دارید؟ این عمل باعث خروج شما از سیستم خواهد شد.'
      : 'آیا از حذف این کاربر اطمینان دارید؟';
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await axios.delete(`${apiUrl}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });
      
      // Check if user deleted themselves
      if (isCurrentUser(userId)) {
        setError('شما حساب کاربری خود را حذف کردید. در حال انتقال به صفحه ورود...');
        clearAuthTokens();
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }
      
      // If not self-deletion, refresh user list
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      
      // Use auth utility for consistent error handling
      if (!handleAuthError(error, setError)) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 404) {
          setError('کاربر یافت نشد یا قبلاً حذف شده است');
        } else {
          setError('خطا در حذف کاربر');
        }
      }
    }
  };

  const handleUserFormClose = (refresh = false) => {
    setIsUserFormOpen(false);
    setEditingUser(null);
    if (refresh) {
      fetchUsers();
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
  };

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  return (
    <ProtectedRoute requiredRole="MANAGER">
      <div>
        <PageHeader 
          title="مدیریت کاربران" 
          description="مدیریت کاربران و دسترسی‌های سیستم" 
          actionButtonText="افزودن کاربر جدید"
          onActionButtonClick={handleAddUser}
        />

        {error && <AlertBox type="error" message={error} />}

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
              فیلتر بر اساس نقش:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={handleFilterChange}
              className="form-input py-2 px-3 w-auto"
            >
              <option value="all">همه کاربران</option>
              <option value="ADMIN">مدیران سیستم</option>
              <option value="MANAGER">مدیران</option>
              <option value="STAFF">کارمندان</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredUsers.length} کاربر نمایش داده شده از {users.length} کاربر
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">هیچ کاربری یافت نشد</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <UserCard 
                  key={user.id}
                  user={user}
                  onEdit={() => handleEditUser(user)}
                  onDelete={() => handleDeleteUser(user.id)}
                />
              ))
            )}
          </div>
        )}

        <UserInvitationModal 
          isOpen={isUserFormOpen}
          onClose={handleUserFormClose}
          editingUser={editingUser}
        />
      </div>
    </ProtectedRoute>
  );
} 