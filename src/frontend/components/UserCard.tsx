import React from 'react';
import { User } from '../types';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'مدیر سیستم';
      case 'MANAGER':
        return 'مدیر';
      case 'STAFF':
        return 'کارمند';
      default:
        return role;
    }
  };

  return (
    <div className="card card-hover">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{user.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeClass(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div>
          <p>تاریخ ثبت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}</p>
          {user.lastLogin && (
            <p className="mt-1">
              آخرین ورود: {new Date(user.lastLogin).toLocaleDateString('fa-IR')}
            </p>
          )}
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full dark:text-blue-400 dark:hover:bg-blue-900/30"
            title="ویرایش"
          >
            <FaEdit />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full dark:text-red-400 dark:hover:bg-red-900/30"
            title="حذف"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}; 