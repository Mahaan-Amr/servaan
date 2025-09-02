// Admin-specific type definitions for Servaan Platform

// Admin User Types
export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  twoFactorSecret?: string | null;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';

// Admin Authentication Types
export interface AdminLoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string | undefined;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  user: AdminUser;
  expiresIn: string;
}

export interface AdminAuthToken {
  adminUserId: string;  // Changed from 'userId' to 'adminUserId' to match JWT payload
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

// Admin Audit Log Types
export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// System Health Types
export interface SystemHealthMetric {
  id: string;
  metricName: string;
  metricValue: Record<string, any>;
  status: HealthStatus;
  collectedAt: Date;
}

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

// Feature Flag Types
export interface FeatureFlag {
  id: string;
  featureName: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetTenants?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Usage Log Types
export interface ApiUsageLog {
  id: string;
  tenantId?: string;
  endpoint: string;
  method: string;
  responseTime?: number;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
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
  revenue: number;
}

// Admin Dashboard Types
export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: HealthStatus;
  activeUsers: number;
  totalOrders: number;
  totalItems: number;
}

// Admin API Response Types
export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface AdminPaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// Admin Error Types
export interface AdminError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Admin Security Types
export interface AdminSecurityConfig {
  twoFactorAuth: boolean;
  ipWhitelisting: boolean;
  auditLogging: boolean;
  rateLimiting: boolean;
  sessionTimeout: string;
  maxLoginAttempts: number;
}

// Admin Monitoring Types
export interface AdminMonitoringConfig {
  healthCheckInterval: number;
  metricsCollection: boolean;
  alerting: boolean;
  logRetention: number;
  performanceMonitoring: boolean;
}

// Admin Rate Limiting Types
export interface AdminRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

// Admin CORS Types
export interface AdminCorsConfig {
  allowedOrigins: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

// Admin Database Types
export interface AdminDatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  url: string;
  schema: string;
  maxConnections: number;
  idleTimeout: number;
}

// Admin Server Types
export interface AdminServerConfig {
  port: number;
  apiUrl: string;
  environment: string;
  version: string;
  host: string;
  protocol: string;
}

// Admin JWT Types
export interface AdminJwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
  algorithm: string;
}

// Admin Logging Types
export interface AdminLoggingConfig {
  level: string;
  file: string;
  console: boolean;
  maxSize: string;
  maxFiles: number;
  format: string;
}

// Admin Feature Types
export interface AdminFeatures {
  twoFactorAuth: boolean;
  ipWhitelisting: boolean;
  auditLogging: boolean;
  realTimeMonitoring: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  multiLocation: boolean;
  apiAccess: boolean;
}

// Admin Role Permissions Types
export interface AdminRolePermissions {
  SUPER_ADMIN: string[];
  PLATFORM_ADMIN: string[];
  SUPPORT: string[];
  DEVELOPER: string[];
}

// Admin API Endpoint Types
export interface AdminApiEndpoints {
  auth: string;
  tenants: string;
  system: string;
  analytics: string;
  security: string;
  billing: string;
  support: string;
}

// Admin Configuration Interface
export interface AdminConfig {
  database: AdminDatabaseConfig;
  server: AdminServerConfig;
  jwt: AdminJwtConfig;
  security: AdminSecurityConfig;
  cors: AdminCorsConfig;
  rateLimiting: AdminRateLimitConfig;
  logging: AdminLoggingConfig;
  monitoring: AdminMonitoringConfig;
  features: AdminFeatures;
  roles: AdminRolePermissions;
  api: {
    prefix: string;
    version: string;
    endpoints: AdminApiEndpoints;
  };
}
