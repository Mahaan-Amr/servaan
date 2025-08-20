'use client';

import React from 'react';
import { Workspace, UserWorkspaceAccess } from '../../types/workspace';
import { User } from '../../types';
import { WorkspaceCard } from './WorkspaceCard';
import { ComingSoonCard } from './ComingSoonCard';

interface WorkspaceGridProps {
  user: User;
  workspaces: Workspace[];
  userAccess: UserWorkspaceAccess[];
  onWorkspaceClick?: (workspace: Workspace) => void;
  layout?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  showComingSoon?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const WorkspaceGrid: React.FC<WorkspaceGridProps> = ({
  user,
  workspaces,
  userAccess,
  onWorkspaceClick,
  layout = 'grid',
  columns = 3,
  showComingSoon = true,
  isLoading = false,
  className = ''
}) => {
  
  // Filter workspaces based on user role and access
  const getFilteredWorkspaces = () => {
    const filteredWorkspaces = workspaces.filter(workspace => {
      // Check if user has required role
      if (!workspace.requiredRoles.includes(user.role)) {
        return false;
      }
      
      // Show coming soon workspaces only if enabled
      if (workspace.status === 'coming-soon' && !showComingSoon) {
        return false;
      }
      
      return true;
    });
    
    // Sort by priority
    return filteredWorkspaces.sort((a, b) => a.priority - b.priority);
  };

  // Get user access level for a workspace
  const getUserAccessLevel = (workspaceId: string) => {
    if (!Array.isArray(userAccess)) {
      return 'none';
    }
    const access = userAccess.find(a => a.workspaceId === workspaceId);
    return access?.accessLevel || 'none';
  };

  // Grid configuration
  const getGridClasses = () => {
    if (layout === 'list') {
      return 'grid grid-cols-1 gap-6';
    }
    
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 lg:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };
    
    return `grid ${gridCols[columns]} gap-6`;
  };

  const filteredWorkspaces = getFilteredWorkspaces();

  // Loading state
  if (isLoading) {
    return (
      <div className={`${getGridClasses()} ${className}`}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                <div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!filteredWorkspaces.length) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            فضای کاری موجود نیست
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            با توجه به نقش شما، هیچ فضای کاری در دسترس نیست. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {filteredWorkspaces.map((workspace) => {
        const accessLevel = getUserAccessLevel(workspace.id);
        
        // Render Coming Soon Card for future workspaces
        if (workspace.status === 'coming-soon') {
          return (
            <ComingSoonCard
              key={workspace.id}
              workspace={workspace}
              showEstimatedLaunch={true}
              onNotifyMe={(workspaceId) => {
                // TODO: Implement notification subscription
                console.log(`User ${user.id} requested notification for workspace ${workspaceId}`);
              }}
            />
          );
        }

        // Render Workspace Card for active workspaces
        return (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            userAccess={accessLevel}
            onClick={onWorkspaceClick ? () => onWorkspaceClick(workspace) : undefined}
            size={layout === 'list' ? 'medium' : 'large'}
            showStats={true}
            showFeatures={layout === 'list'}
            isLoading={false}
          />
        );
      })}
    </div>
  );
}; 