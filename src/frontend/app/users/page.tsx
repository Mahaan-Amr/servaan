'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Spinner } from '../../components/ui/Spinner';
import { AlertBox } from '../../components/ui/AlertBox';
import { UserCard } from '../../components/UserCard';
import { UserInvitationModal } from '../../components/UserInvitationModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { User } from '../../types';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function UsersPage() {
  const { } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('خطا در بارگذاری لیست کاربران');
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
    if (!window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await axios.delete(`${apiUrl}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('خطا در حذف کاربر');
    }
  };

  const handleUserFormClose = (refresh = false) => {
    setIsUserFormOpen(false);
    setEditingUser(null);
    if (refresh) {
      fetchUsers();
    }
  };

  return (
    <ProtectedRoute requiredRole="MANAGER">
      <div>
        <PageHeader 
          title="مدیریت کاربران" 
          description="مدیریت کاربران سیستم" 
          actionButtonText="افزودن کاربر جدید"
          onActionButtonClick={handleAddUser}
        />

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="large" />
          </div>
        ) : error ? (
          <AlertBox type="error" message={error} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {users.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">هیچ کاربری یافت نشد</p>
              </div>
            ) : (
              users.map(user => (
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

        {isUserFormOpen && (
          <UserInvitationModal 
            editingUser={editingUser}
            isOpen={isUserFormOpen}
            onClose={handleUserFormClose}
          />
        )}
      </div>
    </ProtectedRoute>
  );
} 