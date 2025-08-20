// Workspace Permission Utilities for Servaan
// ابزارهای مجوزهای فضای کاری برای سِروان

import { 
  WorkspacePermission, 
  WorkspaceId, 
  PermissionCheckResult, 
  WorkspaceUserPermissions, 
  WorkspaceRolePermissions,
  AdvancedWorkspaceAccessLevel,
  WorkspaceWithPermissions
} from '../types/workspace';
import { User } from '../types';

/**
 * Default Permission Sets for Workspace Access Levels
 * مجموعه مجوزهای پیش‌فرض برای سطوح دسترسی فضای کاری
 */
export const PERMISSION_LEVELS: Record<AdvancedWorkspaceAccessLevel['level'], WorkspacePermission[]> = {
  none: [],
  limited: ['read'],
  full: ['read', 'write', 'view_reports', 'export_data'],
  admin: ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_settings', 'view_reports', 'export_data', 'manage_integrations']
};

/**
 * Role-based Default Permissions
 * مجوزهای پیش‌فرض بر اساس نقش
 */
export const ROLE_PERMISSIONS: Record<User['role'], WorkspacePermission[]> = {
  ADMIN: PERMISSION_LEVELS.admin,
  MANAGER: PERMISSION_LEVELS.full,
  STAFF: PERMISSION_LEVELS.limited
};

/**
 * Workspace-specific Permission Requirements
 * الزامات مجوز خاص فضای کاری
 */
export const WORKSPACE_REQUIRED_PERMISSIONS: Record<WorkspaceId, WorkspacePermission[]> = {
  'inventory-management': ['read', 'write'],
  'business-intelligence': ['read', 'view_reports'],
  'accounting-system': ['read', 'write', 'view_reports'],
  'public-relations': ['read', 'write', 'manage_users'],
  'customer-relationship-management': ['read', 'write', 'manage_users', 'view_reports'],
  'sms-management': ['read', 'write'],
  'ordering-sales-system': ['read', 'write', 'view_reports']
};

/**
 * Check if user has specific permission for workspace
 * بررسی اینکه آیا کاربر مجوز خاصی برای فضای کاری دارد
 */
export function hasPermission(
  user: User,
  workspaceId: WorkspaceId,
  permission: WorkspacePermission,
  userPermissions?: WorkspaceUserPermissions,
  rolePermissions?: WorkspaceRolePermissions[]
): boolean {
  // Admin always has all permissions
  if (user.role === 'ADMIN') return true;

  // Check user-specific permissions first
  if (userPermissions && userPermissions.permissions.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const rolePerms = rolePermissions?.find(rp => rp.role === user.role);
  if (rolePerms && rolePerms.permissions.includes(permission)) {
    return true;
  }

  // Check default role permissions
  const defaultPermissions = ROLE_PERMISSIONS[user.role] || [];
  return defaultPermissions.includes(permission);
}

/**
 * Check workspace access for user
 * بررسی دسترسی فضای کاری برای کاربر
 */
export function checkWorkspaceAccess(
  user: User,
  workspaceId: WorkspaceId,
  userPermissions?: WorkspaceUserPermissions,
  rolePermissions?: WorkspaceRolePermissions[]
): PermissionCheckResult {
  const requiredPermissions = WORKSPACE_REQUIRED_PERMISSIONS[workspaceId] || ['read'];
  const missingPermissions: WorkspacePermission[] = [];

  // Check each required permission
  for (const permission of requiredPermissions) {
    if (!hasPermission(user, workspaceId, permission, userPermissions, rolePermissions)) {
      missingPermissions.push(permission);
    }
  }

  const hasAccess = missingPermissions.length === 0;
  let level: AdvancedWorkspaceAccessLevel['level'] = 'none';

  if (hasAccess) {
    // Determine access level based on permissions
    const userPerms = getUserPermissions(user, workspaceId, userPermissions, rolePermissions);
    
    if (userPerms.includes('admin')) {
      level = 'admin';
    } else if (userPerms.includes('write')) {
      level = 'full';
    } else if (userPerms.includes('read')) {
      level = 'limited';
    }
  }

  return {
    hasAccess,
    level,
    missingPermissions,
    reason: !hasAccess ? `کاربر فاقد مجوزهای لازم است: ${missingPermissions.join(', ')}` : undefined
  };
}

/**
 * Get all permissions for user in workspace
 * دریافت تمام مجوزهای کاربر در فضای کاری
 */
export function getUserPermissions(
  user: User,
  workspaceId: WorkspaceId,
  userPermissions?: WorkspaceUserPermissions,
  rolePermissions?: WorkspaceRolePermissions[]
): WorkspacePermission[] {
  const permissions = new Set<WorkspacePermission>();

  // Add default role permissions
  const defaultPermissions = ROLE_PERMISSIONS[user.role] || [];
  defaultPermissions.forEach(p => permissions.add(p));

  // Add role-based permissions for this workspace
  const rolePerms = rolePermissions?.find(rp => rp.role === user.role);
  if (rolePerms) {
    rolePerms.permissions.forEach(p => permissions.add(p));
  }

  // Add user-specific permissions (override role permissions)
  if (userPermissions) {
    userPermissions.permissions.forEach(p => permissions.add(p));
  }

  return Array.from(permissions);
}

/**
 * Check if workspace is coming soon
 * بررسی اینکه آیا فضای کاری به‌زودی است
 */
export function isComingSoonWorkspace(workspaceId: WorkspaceId): boolean {
  return workspaceId === 'public-relations' || workspaceId === 'customer-relationship-management';
}

/**
 * Get permission display name in Persian
 * دریافت نام نمایشی مجوز به فارسی
 */
export function getPermissionDisplayName(permission: WorkspacePermission): string {
  const names: Record<WorkspacePermission, string> = {
    read: 'خواندن',
    write: 'نوشتن',
    delete: 'حذف',
    admin: 'مدیریت',
    manage_users: 'مدیریت کاربران',
    manage_settings: 'مدیریت تنظیمات',
    view_reports: 'مشاهده گزارش‌ها',
    export_data: 'خروجی داده‌ها',
    manage_integrations: 'مدیریت یکپارچگی‌ها'
  };

  return names[permission] || permission;
}

/**
 * Get access level display name in Persian
 * دریافت نام نمایشی سطح دسترسی به فارسی
 */
export function getAccessLevelDisplayName(level: AdvancedWorkspaceAccessLevel['level']): string {
  const names: Record<AdvancedWorkspaceAccessLevel['level'], string> = {
    none: 'عدم دسترسی',
    limited: 'دسترسی محدود',
    full: 'دسترسی کامل',
    admin: 'مدیریت'
  };

  return names[level] || level;
}

/**
 * Filter workspaces based on user access
 * فیلتر فضاهای کاری بر اساس دسترسی کاربر
 */
export function filterWorkspacesByAccess(
  workspaces: WorkspaceWithPermissions[],
  user: User,
  includeComingSoon = true
): WorkspaceWithPermissions[] {
  return workspaces.filter(workspace => {
    // Always show coming soon workspaces if enabled
    if (workspace.isComingSoon && includeComingSoon) {
      return true;
    }

    // Check actual access
    const accessCheck = checkWorkspaceAccess(
      user,
      workspace.id,
      workspace.userPermissions,
      workspace.rolePermissions
    );

    return accessCheck.hasAccess;
  });
}

/**
 * Get workspace security recommendations
 * دریافت توصیه‌های امنیتی فضای کاری
 */
export function getSecurityRecommendations(
  workspace: WorkspaceWithPermissions,
  user: User
): string[] {
  const recommendations: string[] = [];

  // Check if workspace has security settings
  if (!workspace.securitySettings?.enableAuditLog) {
    recommendations.push('فعال‌سازی لاگ حسابرسی برای افزایش امنیت');
  }

  if (!workspace.securitySettings?.requireApprovalForAccess) {
    recommendations.push('فعال‌سازی تأیید دسترسی برای کنترل بیشتر');
  }

  if (workspace.securitySettings?.allowGuestAccess) {
    recommendations.push('غیرفعال‌سازی دسترسی مهمان برای امنیت بیشتر');
  }

  return recommendations;
}

/**
 * Permission validation for UI components
 * اعتبارسنجی مجوز برای کامپوننت‌های UI
 */
export function canPerformAction(
  user: User,
  workspaceId: WorkspaceId,
  action: 'create' | 'edit' | 'delete' | 'view' | 'export' | 'manage',
  userPermissions?: WorkspaceUserPermissions,
  rolePermissions?: WorkspaceRolePermissions[]
): boolean {
  const actionPermissionMap: Record<string, WorkspacePermission> = {
    create: 'write',
    edit: 'write',
    delete: 'delete',
    view: 'read',
    export: 'export_data',
    manage: 'admin'
  };

  const requiredPermission = actionPermissionMap[action];
  if (!requiredPermission) return false;

  return hasPermission(user, workspaceId, requiredPermission, userPermissions, rolePermissions);
} 