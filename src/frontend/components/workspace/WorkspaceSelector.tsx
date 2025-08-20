'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { WorkspaceGrid } from './WorkspaceGrid';
import { Workspace, WorkspaceSortBy, WorkspaceSortOrder } from '../../types/workspace';

interface WorkspaceSelectorProps {
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  defaultLayout?: 'grid' | 'list';
  defaultColumns?: 1 | 2 | 3 | 4;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  title,
  subtitle,
  showFilters = true,
  showSearch = true,
  defaultLayout = 'grid',
  defaultColumns = 3
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const {
    workspaces,
    userAccess,
    isLoading,
    error,
    clearError,
    getActiveWorkspaces,
    getComingSoonWorkspaces,
    getAccessibleWorkspaces
  } = useWorkspace();

  // Local state
  const [layout, setLayout] = useState<'grid' | 'list'>(defaultLayout);
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(defaultColumns);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<WorkspaceSortBy>('priority');
  const [sortOrder, setSortOrder] = useState<WorkspaceSortOrder>('asc');
  const [showComingSoon, setShowComingSoon] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'coming-soon'>('all');

  if (!user) {
    return null;
  }

  // Define tenant-specific default title and subtitle
  const displayTitle = title || `فضاهای کاری ${tenant?.displayName || 'سِروان'}`;
  const displaySubtitle = subtitle || (tenant ? `انتخاب فضای کاری مورد نظر برای ${tenant.displayName}` : 'انتخاب فضای کاری مورد نظر برای شروع کار');

  // Filter and search workspaces
  const getFilteredWorkspaces = () => {
    // Start with workspaces the user actually has access to
    let filtered = getAccessibleWorkspaces();

    // Status filter
    if (selectedStatus === 'active') {
      filtered = filtered.filter(w => w.status === 'active');
    } else if (selectedStatus === 'coming-soon') {
      filtered = filtered.filter(w => w.status === 'coming-soon');
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(workspace =>
        workspace.title.toLowerCase().includes(query) ||
        workspace.titleEn.toLowerCase().includes(query) ||
        workspace.description.toLowerCase().includes(query) ||
        workspace.features.some(feature => 
          feature.name.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query)
        )
      );
    }

    // Sort workspaces
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title, 'fa');
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        case 'lastUpdated':
          compareValue = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'priority':
        default:
          compareValue = a.priority - b.priority;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    if (workspace.status === 'active') {
      router.push(workspace.href);
    }
  };

  const filteredWorkspaces = getFilteredWorkspaces();
  const accessibleWorkspaces = getAccessibleWorkspaces();
  const activeWorkspaces = getActiveWorkspaces();
  const comingSoonWorkspaces = getComingSoonWorkspaces();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {displayTitle}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {displaySubtitle}
            </p>
            
            {/* Stats Overview */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                  {workspaces.length}
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400">
                  کل فضاهای کاری
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {activeWorkspaces.length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  فعال
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                  {comingSoonWorkspaces.length}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  به‌زودی
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {accessibleWorkspaces.length}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  قابل دسترس
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              {showSearch && (
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در فضاهای کاری..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                      dir="rtl"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-4">
                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'coming-soon')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                  dir="rtl"
                >
                  <option value="all">همه فضاها</option>
                  <option value="active">فعال</option>
                  <option value="coming-soon">به‌زودی</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as WorkspaceSortBy)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                  dir="rtl"
                >
                  <option value="priority">اولویت</option>
                  <option value="title">نام</option>
                  <option value="status">وضعیت</option>
                  <option value="lastUpdated">آخرین بروزرسانی</option>
                </select>

                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  title={`مرتب‌سازی ${sortOrder === 'asc' ? 'صعودی' : 'نزولی'}`}
                >
                  <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Layout Toggle */}
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setLayout('grid')}
                    className={`p-2 text-sm ${layout === 'grid' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    title="نمای شبکه"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={`p-2 text-sm ${layout === 'list' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    title="نمای لیست"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Columns (for grid layout) */}
                {layout === 'grid' && (
                  <select
                    value={columns}
                    onChange={(e) => setColumns(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                    dir="rtl"
                  >
                    <option value={1}>1 ستون</option>
                    <option value={2}>2 ستون</option>
                    <option value={3}>3 ستون</option>
                    <option value={4}>4 ستون</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  خطا در بارگذاری فضاهای کاری
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  {error}
                </p>
                <button
                  onClick={clearError}
                  className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300" dir="rtl">
            {filteredWorkspaces.length} فضای کاری
            {searchQuery && ` برای "${searchQuery}"`}
          </div>
          
          {/* Coming Soon Toggle */}
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={showComingSoon}
              onChange={(e) => setShowComingSoon(e.target.checked)}
              className="rounded text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300" dir="rtl">نمایش فضاهای به‌زودی</span>
          </label>
        </div>

        {/* Workspace Grid */}
        <WorkspaceGrid
          user={user}
          workspaces={filteredWorkspaces}
          userAccess={userAccess}
          onWorkspaceClick={handleWorkspaceClick}
          layout={layout}
          columns={columns}
          showComingSoon={showComingSoon}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}; 