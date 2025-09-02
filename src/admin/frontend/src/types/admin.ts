// Admin User Types
export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  twoFactorEnabled?: boolean;
  ipWhitelist?: string[];
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SUPPORT = 'SUPPORT',
  DEVELOPER = 'DEVELOPER'
}

// Admin Authentication Types
export interface AdminLoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUser;
    token: string;
  };
}

export interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasRole: (role: AdminRole) => boolean;
  hasAnyRole: (roles: AdminRole[]) => boolean;
  isAuthenticated: boolean;
}

// Admin Dashboard Types
export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  systemHealth: HealthStatus;
  lastUpdated: Date;
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  MAINTENANCE = 'MAINTENANCE'
}

// Tenant Management Types
export interface Tenant {
  id: string;
  name: string;
  displayName: string;
  subdomain: string;
  domain?: string;
  description?: string;
  businessType?: string;
  city?: string;
  country: string;
  status: TenantStatus;
  plan: TenantPlan;
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  userCount: number;
  storageUsed: number;
  storageLimit: number;
  monthlyRevenue?: number;
  features?: {
    hasInventoryManagement: boolean;
    hasCustomerManagement: boolean;
    hasAccountingSystem: boolean;
    hasReporting: boolean;
    hasNotifications: boolean;
    hasAdvancedReporting: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
    hasMultiLocation: boolean;
    hasAdvancedCRM: boolean;
    hasWhatsappIntegration: boolean;
    hasInstagramIntegration: boolean;
    hasAnalyticsBI: boolean;
  };
  metrics?: {
    userCount: number;
    customerCount: number;
    orderCount: number;
    revenue: number;
  };
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

export enum TenantPlan {
  STARTER = 'STARTER',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE'
}

// System Health Types
export interface SystemHealthMetric {
  id: string;
  metric: string;
  value: number;
  unit: string;
  status: HealthStatus;
  timestamp: Date;
  description?: string;
}

export interface SystemHealth {
  overall: HealthStatus;
  metrics: SystemHealthMetric[];
  lastChecked: Date;
  uptime: number;
  responseTime: number;
}

// Audit Log Types
export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  adminUser?: AdminUser;
}

// Feature Flag Types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  targetAudience: 'ALL' | 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// API Usage Types
export interface ApiUsageLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Admin Navigation Types
export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: AdminRole[];
  children?: AdminNavItem[];
}

// Admin Table Types
export interface AdminTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface AdminTableProps {
  columns: AdminTableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
    onSort: (field: string) => void;
  };
  onRowClick?: (row: any) => void;
}

// Admin Form Types
export interface AdminFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any;
}

export interface AdminFormProps {
  fields: AdminFormField[];
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

// Admin Chart Types
export interface AdminChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface AdminChartProps {
  data: AdminChartData;
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  title?: string;
  height?: number;
  options?: any;
}

// Admin Notification Types
export interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// Admin Settings Types
export interface AdminSettings {
  system: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    ipWhitelistEnabled: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  features: {
    analyticsEnabled: boolean;
    auditLoggingEnabled: boolean;
    realTimeMonitoring: boolean;
    advancedReporting: boolean;
  };
}

// Tenant Management Types (Read-only access)
export interface TenantSummary {
  id: string;
  subdomain: string;
  name: string;
  displayName: string;
  plan: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
  userCount: number;
  itemCount: number;
  customerCount: number;
  orderCount: number;
}

// Enhanced Tenant Management Types
export interface TenantActivityLog {
  id: string;
  tenantId: string;
  type: 'user_login' | 'order_created' | 'inventory_updated' | 'customer_added' | 'system_event';
  description: string;
  details?: Record<string, any>;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface TenantActivityParams {
  page: number;
  limit: number;
  type?: string;
}

export interface TenantActivityResponse {
  activities: TenantActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TenantGrowthAnalytics {
  period: 'day' | 'week' | 'month';
  days: number;
  data: Array<{
    period: string;
    new_tenants: number;
    active_tenants: number;
  }>;
}

export interface TenantRevenueAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  year: number;
  data: Array<{
    period: string;
    revenue: number;
    growth: number;
  }>;
  summary: {
    totalRevenue: number;
    averageGrowth: number;
    topMonth: string;
    topRevenue: number;
  };
}

export interface BulkStatusUpdateRequest {
  tenantIds: string[];
  isActive: boolean;
}

export interface BulkStatusUpdateResponse {
  updatedCount: number;
  totalRequested: number;
}

export interface TenantExportParams {
  format: 'csv' | 'excel' | 'pdf';
  search?: string;
  status?: string;
  plan?: string;
}
