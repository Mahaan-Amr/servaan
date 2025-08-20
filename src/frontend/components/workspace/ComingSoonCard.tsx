'use client';

import React, { useState } from 'react';
import { Workspace, WorkspaceId } from '../../types/workspace';

interface ComingSoonCardProps {
  workspace: Workspace;
  className?: string;
  showEstimatedLaunch?: boolean;
  onNotifyMe?: (workspaceId: WorkspaceId) => void;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({
  workspace,
  className = '',
  showEstimatedLaunch = true,
  onNotifyMe
}) => {
  const [isNotifyRequested, setIsNotifyRequested] = useState(false);

  const handleNotifyMe = () => {
    if (onNotifyMe) {
      onNotifyMe(workspace.id);
      setIsNotifyRequested(true);
    }
  };

  return (
    <div className={`card ${workspace.color.background} border-2 border-dashed border-gray-300 dark:border-gray-600 transition-all duration-300 group p-8 relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Workspace Icon - Grayed out */}
            <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-lg opacity-60">
              <svg
                className="w-8 h-8 text-gray-500 dark:text-gray-400"
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
            <div>
              <h3 className="font-bold text-2xl text-gray-600 dark:text-gray-300 mb-1">
                {workspace.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {workspace.titleEn}
              </p>
            </div>
          </div>

          {/* Coming Soon Badge */}
          <div className="flex flex-col items-end space-y-2">
            <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
              به‌زودی
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              درحال توسعه
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {workspace.description}
        </p>

        {/* Features Preview */}
        {workspace.features && workspace.features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              ویژگی‌های در نظر گرفته شده:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspace.features.slice(0, 4).map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center space-x-3 space-x-reverse p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm opacity-70"
                >
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Launch Estimation */}
        {showEstimatedLaunch && workspace.estimatedLaunch && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 space-x-reverse">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  زمان‌بندی پیش‌بینی شده
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {workspace.estimatedLaunch}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
          {/* Priority Indicator */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              اولویت: {workspace.priority}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              تاریخ تولید: {new Date(workspace.createdAt).toLocaleDateString('fa-IR')}
            </span>
          </div>

          {/* Notify Me Button */}
          {onNotifyMe && (
            <button
              onClick={handleNotifyMe}
              disabled={isNotifyRequested}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isNotifyRequested
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 cursor-not-allowed'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/40'
              }`}
            >
              {isNotifyRequested ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>ثبت شد</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h0v14z" />
                  </svg>
                  <span>اطلاع رسانی</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              پیشرفت توسعه
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              0%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full w-0 transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100 dark:to-gray-800 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}; 