// Workspace Types for Servaan Business Management System
// تایپ‌های فضای کاری برای سیستم مدیریت کسب‌وکار سِروان

import { User } from './index';

// ===== CORE WORKSPACE TYPES =====

/**
 * Workspace Identifier - شناسه فضای کاری
 */
export type WorkspaceId = 
  | 'inventory-management'
  | 'business-intelligence' 
  | 'accounting-system'
  | 'public-relations'
  | 'customer-relationship-management'
  | 'sms-management'
  | 'ordering-sales-system';

/**
 * Workspace Status - وضعیت فضای کاری
 */
export type WorkspaceStatus = 'active' | 'coming-soon' | 'maintenance';

/**
 * Workspace Access Level - سطح دسترسی فضای کاری
 */
export type WorkspaceAccessLevel = 'full' | 'read-only' | 'restricted' | 'none';

/**
 * Workspace Permission - مجوز فضای کاری
 */
export type WorkspacePermission = 
  | 'read'
  | 'write'
  | 'delete'
  | 'admin'
  | 'manage_users'
  | 'manage_settings'
  | 'view_reports'
  | 'export_data'
  | 'manage_integrations';

/**
 * Main Workspace Interface - رابط اصلی فضای کاری
 */
export interface Workspace {
  id: WorkspaceId;
  title: string;
  titleEn: string;
  description: string;
  status: WorkspaceStatus;
  icon: string; // Heroicon path or icon name
  color: WorkspaceColor;
  gradient: string; // Tailwind gradient classes
  href: string;
  features: WorkspaceFeature[];
  stats: WorkspaceStats;
  requiredRoles: User['role'][];
  isComingSoon: boolean;
  estimatedLaunch?: string; // For coming soon workspaces
  priority: number; // Display order
  createdAt: string;
  updatedAt: string;
}

/**
 * Workspace Color Scheme - طرح رنگی فضای کاری
 */
export interface WorkspaceColor {
  primary: string; // Main color (e.g., 'blue-500')
  secondary: string; // Secondary color
  background: string; // Background color for cards
  text: string; // Text color
  icon: string; // Icon color
  gradient: {
    from: string;
    to: string;
    direction?: 'r' | 'l' | 'b' | 't' | 'br' | 'bl' | 'tr' | 'tl';
  };
}

/**
 * Workspace Feature - ویژگی فضای کاری
 */
export interface WorkspaceFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  comingSoon?: boolean;
}

/**
 * Workspace Statistics - آمار فضای کاری
 */
export interface WorkspaceStats {
  primary: WorkspaceStat;
  secondary: WorkspaceStat;
  tertiary?: WorkspaceStat;
  lastUpdated: string;
}

/**
 * Individual Workspace Statistic - آمار منفرد فضای کاری
 */
export interface WorkspaceStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string; // e.g., "این ماه"
  };
}

// ===== ACCESS CONTROL TYPES =====

/**
 * User Workspace Access - دسترسی کاربر به فضای کاری
 */
export interface UserWorkspaceAccess {
  userId: string;
  workspaceId: WorkspaceId;
  accessLevel: WorkspaceAccessLevel;
  permissions: WorkspacePermission[];
  customRestrictions?: string[];
  grantedAt: string;
  grantedBy: string; // User ID who granted access
  expiresAt?: string;
  isActive: boolean;
}

/**
 * Access Control Manager Interface - رابط مدیر کنترل دسترسی
 */
export interface WorkspaceAccessManager {
  users: User[];
  workspaces: Workspace[];
  userAccess: UserWorkspaceAccess[];
  onUpdateAccess: (userId: string, workspaceId: WorkspaceId, access: WorkspaceAccessLevel) => void;
  onTogglePermission: (userId: string, workspaceId: WorkspaceId, permission: WorkspacePermission) => void;
  onBulkUpdateAccess: (updates: Partial<UserWorkspaceAccess>[]) => void;
}

// ===== UI COMPONENT TYPES =====

/**
 * Workspace Card Props - پراپرتی‌های کارت فضای کاری
 */
export interface WorkspaceCardProps {
  workspace: Workspace;
  userAccess: WorkspaceAccessLevel;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  showFeatures?: boolean;
  isLoading?: boolean;
}

/**
 * Workspace Grid Props - پراپرتی‌های شبکه فضای کاری
 */
export interface WorkspaceGridProps {
  user: User;
  workspaces: Workspace[];
  userAccess: UserWorkspaceAccess[];
  onWorkspaceClick?: (workspace: Workspace) => void;
  layout?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  showComingSoon?: boolean;
  isLoading?: boolean;
}

/**
 * Coming Soon Card Props - پراپرتی‌های کارت به‌زودی
 */
export interface ComingSoonCardProps {
  workspace: Workspace;
  className?: string;
  showEstimatedLaunch?: boolean;
  onNotifyMe?: (workspaceId: WorkspaceId) => void;
}

/**
 * Workspace Layout Props - پراپرتی‌های چیدمان فضای کاری
 */
export interface WorkspaceLayoutProps {
  workspace: Workspace;
  user: User;
  children: React.ReactNode;
  showSidebar?: boolean;
  showBreadcrumb?: boolean;
  sidebarItems?: WorkspaceSidebarItem[];
}

/**
 * Workspace Sidebar Item - آیتم نوار کناری فضای کاری
 */
export interface WorkspaceSidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
  badge?: string | number;
  children?: WorkspaceSidebarItem[];
  requiredPermissions?: WorkspacePermission[];
}

/**
 * Workspace Breadcrumb Props - پراپرتی‌های مسیر فضای کاری
 */
export interface WorkspaceBreadcrumbProps {
  workspace: Workspace;
  currentPage?: string;
  customItems?: BreadcrumbItem[];
}

/**
 * Breadcrumb Item - آیتم مسیر
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

// ===== SERVICE TYPES =====

/**
 * Workspace Service Interface - رابط سرویس فضای کاری
 */
export interface WorkspaceService {
  getAllWorkspaces(): Promise<Workspace[]>;
  getWorkspaceById(id: WorkspaceId): Promise<Workspace | null>;
  getUserWorkspaceAccess(userId: string): Promise<UserWorkspaceAccess[]>;
  updateWorkspaceStats(workspaceId: WorkspaceId): Promise<WorkspaceStats>;
  checkUserAccess(userId: string, workspaceId: WorkspaceId): Promise<WorkspaceAccessLevel>;
  hasPermission(userId: string, workspaceId: WorkspaceId, permission: WorkspacePermission): Promise<boolean>;
}

/**
 * Workspace Configuration - پیکربندی فضای کاری
 */
export interface WorkspaceConfig {
  defaultWorkspaces: Workspace[];
  accessControlEnabled: boolean;
  defaultAccessLevel: WorkspaceAccessLevel;
  roleBasedAccess: Record<User['role'], WorkspaceAccessLevel>;
  comingSoonEnabled: boolean;
  statsUpdateInterval: number; // in minutes
}

// ===== PREDEFINED WORKSPACE DATA =====

/**
 * Predefined Workspace Colors - رنگ‌های از پیش تعریف شده فضای کاری
 */
export const WORKSPACE_COLORS: Record<WorkspaceId, WorkspaceColor> = {
  'inventory-management': {
    primary: 'blue-500',
    secondary: 'blue-100',
    background: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-300',
    icon: 'text-blue-500',
    gradient: {
      from: 'from-blue-500',
      to: 'to-blue-600',
      direction: 'br'
    }
  },
  'business-intelligence': {
    primary: 'purple-500',
    secondary: 'purple-100',
    background: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-300',
    icon: 'text-purple-500',
    gradient: {
      from: 'from-purple-500',
      to: 'to-purple-600',
      direction: 'br'
    }
  },
  'accounting-system': {
    primary: 'green-500',
    secondary: 'green-100',
    background: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-300',
    icon: 'text-green-500',
    gradient: {
      from: 'from-green-500',
      to: 'to-green-600',
      direction: 'br'
    }
  },
  'public-relations': {
    primary: 'orange-500',
    secondary: 'orange-100',
    background: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-300',
    icon: 'text-orange-500',
    gradient: {
      from: 'from-orange-500',
      to: 'to-orange-600',
      direction: 'br'
    }
  },
  'customer-relationship-management': {
    primary: 'pink-500',
    secondary: 'pink-100',
    background: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-300',
    icon: 'text-pink-500',
    gradient: {
      from: 'from-pink-500',
      to: 'to-pink-600',
      direction: 'br'
    }
  },
  'sms-management': {
    primary: 'emerald-500',
    secondary: 'emerald-100',
    background: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-300',
    icon: 'text-emerald-500',
    gradient: {
      from: 'from-emerald-500',
      to: 'to-emerald-600',
      direction: 'br'
    }
  },
  'ordering-sales-system': {
    primary: 'amber-500',
    secondary: 'amber-100',
    background: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-300',
    icon: 'text-amber-500',
    gradient: {
      from: 'from-amber-500',
      to: 'to-amber-600',
      direction: 'br'
    }
  }
};

/**
 * Default Role-Based Access Levels - سطوح دسترسی پیش‌فرض بر اساس نقش
 */
export const DEFAULT_ROLE_ACCESS: Record<User['role'], WorkspaceAccessLevel> = {
  'ADMIN': 'full',
  'MANAGER': 'full',
  'STAFF': 'read-only'
};

/**
 * Workspace Icons - آیکون‌های فضای کاری (Heroicons)
 */
export const WORKSPACE_ICONS: Record<WorkspaceId, string> = {
  'inventory-management': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'business-intelligence': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'accounting-system': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'public-relations': 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  'customer-relationship-management': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'sms-management': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  'ordering-sales-system': 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01'
};

// ===== UTILITY TYPES =====

/**
 * Workspace Filter Options - گزینه‌های فیلتر فضای کاری
 */
export interface WorkspaceFilterOptions {
  status?: WorkspaceStatus[];
  accessLevel?: WorkspaceAccessLevel[];
  roles?: User['role'][];
  searchQuery?: string;
}

/**
 * Workspace Sort Options - گزینه‌های مرتب‌سازی فضای کاری
 */
export type WorkspaceSortBy = 'priority' | 'title' | 'status' | 'lastUpdated';
export type WorkspaceSortOrder = 'asc' | 'desc';

/**
 * Workspace Analytics - تحلیل‌های فضای کاری
 */
export interface WorkspaceAnalytics {
  workspaceId: WorkspaceId;
  totalUsers: number;
  activeUsers: number;
  usageStats: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  popularFeatures: {
    featureId: string;
    usageCount: number;
    percentage: number;
  }[];
  lastAnalyzed: string;
}

// Advanced Permission Checking
export interface PermissionCheckResult {
  hasAccess: boolean;
  level: AdvancedWorkspaceAccessLevel['level'];
  missingPermissions: WorkspacePermission[];
  reason?: string;
}

export interface WorkspaceSecuritySettings {
  requireApprovalForAccess: boolean;
  maxUsersPerWorkspace?: number;
  allowGuestAccess: boolean;
  sessionTimeout?: number; // in minutes
  ipWhitelist?: string[];
  enableAuditLog: boolean;
}

// Advanced Workspace Permission System
export interface WorkspaceUserPermissions {
  userId: string;
  workspaceId: WorkspaceId;
  permissions: WorkspacePermission[];
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string;
}

export interface WorkspaceRolePermissions {
  role: User['role'];
  workspaceId: WorkspaceId;
  permissions: WorkspacePermission[];
  isDefault: boolean;
}

export interface AdvancedWorkspaceAccessLevel {
  level: 'none' | 'limited' | 'full' | 'admin';
  permissions: WorkspacePermission[];
  description: string;
}

// Enhanced Workspace Interface
export interface WorkspaceWithPermissions extends Workspace {
  userPermissions?: WorkspaceUserPermissions;
  rolePermissions?: WorkspaceRolePermissions[];
  securitySettings?: WorkspaceSecuritySettings;
  accessLevel?: AdvancedWorkspaceAccessLevel['level'];
  canAccess?: boolean;
  lastAccessedAt?: string;
} 