'use client';

import React from 'react';
import Link from 'next/link';
import { Workspace, WorkspaceAccessLevel } from '../../types/workspace';
import { useWorkspaceAccess } from '../../contexts/WorkspaceContext';

interface WorkspaceCardProps {
  workspace: Workspace;
  userAccess?: WorkspaceAccessLevel;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  showFeatures?: boolean;
  isLoading?: boolean;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  userAccess,
  onClick,
  className = '',
  size = 'large',
  showStats = true,
  showFeatures = false,
  isLoading = false
}) => {
  const { canAccess, hasPermission } = useWorkspaceAccess(workspace.id);

  // Size configurations
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const titleSizes = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  // Status indicators
  const isActive = workspace.status === 'active';
  const isComingSoon = workspace.status === 'coming-soon';
  const isUnderMaintenance = workspace.status === 'maintenance';

  // Access control
  const hasAccess = userAccess !== 'none' && canAccess;
  const canView = hasAccess && hasPermission('read');

  // Card content
  const CardContent = () => (
    <div className={`card card-hover ${workspace.color.background} border-2 border-transparent hover:border-${workspace.color.primary.split('-')[0]}-200 transition-all duration-300 group ${sizeClasses[size]} ${className}`}>
      {/* Workspace Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Workspace Icon */}
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${workspace.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={workspace.icon}
              />
            </svg>
          </div>

          {/* Workspace Info */}
          <div className="text-right">
            <h3 className={`font-bold ${titleSizes[size]} ${workspace.color.text} mb-1 group-hover:scale-105 transition-transform duration-200`} dir="rtl">
              {workspace.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium" dir="ltr">
              {workspace.titleEn}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end space-y-2">
          {/* Access-based status (prioritized over generic workspace status) */}
          {userAccess && userAccess !== 'none' && isActive && (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              userAccess === 'full' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : userAccess === 'read-only'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
            }`}>
              {userAccess === 'full' ? 'دسترسی کامل' : 
               userAccess === 'read-only' ? 'دسترسی خواندنی' : 'دسترسی محدود'}
            </span>
          )}
          
          {/* No access indicator */}
          {(!userAccess || userAccess === 'none') && isActive && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-bold rounded-full">
              عدم دسترسی
            </span>
          )}
          
          {/* Generic workspace status for coming soon or maintenance */}
          {isComingSoon && (
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-bold rounded-full">
              به‌زودی
            </span>
          )}
          {isUnderMaintenance && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-bold rounded-full">
              تعمیرات
            </span>
          )}
          
          {/* Additional Access Level Indicator (secondary) */}
          {userAccess && userAccess !== 'none' && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              userAccess === 'full' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : userAccess === 'read-only'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {userAccess === 'full' ? 'کامل' : 
               userAccess === 'read-only' ? 'خواندنی' : 'محدود'}
            </span>
          )}
        </div>
      </div>

      {/* Workspace Description */}
      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-right" dir="rtl">
        {workspace.description}
      </p>

      {/* Stats Section */}
      {showStats && isActive && workspace.stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Primary Stat */}
          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <div className={`${workspace.stats.primary.color} mb-1`}>
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={workspace.stats.primary.icon} />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {workspace.stats.primary.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {workspace.stats.primary.label}
            </div>
          </div>

          {/* Secondary Stat */}
          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <div className={`${workspace.stats.secondary.color} mb-1`}>
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={workspace.stats.secondary.icon} />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {workspace.stats.secondary.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {workspace.stats.secondary.label}
            </div>
          </div>

          {/* Tertiary Stat */}
          {workspace.stats.tertiary && (
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className={`${workspace.stats.tertiary.color} mb-1`}>
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={workspace.stats.tertiary.icon} />
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {workspace.stats.tertiary.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {workspace.stats.tertiary.label}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features Section */}
      {showFeatures && workspace.features && workspace.features.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">ویژگی‌های کلیدی:</h4>
          <div className="flex flex-wrap gap-2">
            {workspace.features.slice(0, 4).map((feature) => (
              <span
                key={feature.id}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  feature.isAvailable
                    ? `bg-${workspace.color.primary.split('-')[0]}-100 dark:bg-${workspace.color.primary.split('-')[0]}-900/30 text-${workspace.color.primary.split('-')[0]}-800 dark:text-${workspace.color.primary.split('-')[0]}-300`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {feature.name}
                {!feature.isAvailable && feature.comingSoon && (
                  <span className="mr-1 text-yellow-500">🔜</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Section */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
        {/* Last Updated */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          به‌روزرسانی: {new Date(workspace.updatedAt).toLocaleDateString('fa-IR')}
        </div>

        {/* Access Indicator */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {!hasAccess && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              عدم دسترسی
            </span>
          )}
          {hasAccess && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              دسترسی مجاز
            </span>
          )}
          {canView && (
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );

  // Render as Link or button based on access and onClick handler
  if (canView && !onClick) {
    return (
      <Link href={workspace.href} className="block group relative">
        <CardContent />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full group relative text-left">
        <CardContent />
      </button>
    );
  }

  // No access - render as disabled card
  return (
    <div className="block group relative opacity-60 cursor-not-allowed">
      <CardContent />
    </div>
  );
}; 