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
    adminUserId: string;
    email: string;
    role: AdminRole;
    iat: number;
    exp: number;
}
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
export interface SystemHealthMetric {
    id: string;
    metricName: string;
    metricValue: Record<string, any>;
    status: HealthStatus;
    collectedAt: Date;
}
export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
export interface FeatureFlag {
    id: string;
    featureName: string;
    isEnabled: boolean;
    rolloutPercentage: number;
    targetTenants?: string[];
    createdAt: Date;
    updatedAt: Date;
}
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
export interface AdminError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
}
export interface AdminSecurityConfig {
    twoFactorAuth: boolean;
    ipWhitelisting: boolean;
    auditLogging: boolean;
    rateLimiting: boolean;
    sessionTimeout: string;
    maxLoginAttempts: number;
}
export interface AdminMonitoringConfig {
    healthCheckInterval: number;
    metricsCollection: boolean;
    alerting: boolean;
    logRetention: number;
    performanceMonitoring: boolean;
}
export interface AdminRateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}
export interface AdminCorsConfig {
    allowedOrigins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
}
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
export interface AdminServerConfig {
    port: number;
    apiUrl: string;
    environment: string;
    version: string;
    host: string;
    protocol: string;
}
export interface AdminJwtConfig {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
    algorithm: string;
}
export interface AdminLoggingConfig {
    level: string;
    file: string;
    console: boolean;
    maxSize: string;
    maxFiles: number;
    format: string;
}
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
export interface AdminRolePermissions {
    SUPER_ADMIN: string[];
    PLATFORM_ADMIN: string[];
    SUPPORT: string[];
    DEVELOPER: string[];
}
export interface AdminApiEndpoints {
    auth: string;
    tenants: string;
    system: string;
    analytics: string;
    security: string;
    billing: string;
    support: string;
}
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
//# sourceMappingURL=admin.d.ts.map