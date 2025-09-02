export declare const adminConfig: {
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        url: string;
        schema: string;
    };
    server: {
        port: number;
        apiUrl: string;
        environment: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    security: {
        bcryptRounds: number;
        sessionTimeout: string;
        maxLoginAttempts: number;
        ipWhitelist: string[];
    };
    cors: {
        allowedOrigins: string[];
    };
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string;
        file: string;
    };
    monitoring: {
        healthCheckInterval: number;
        metricsCollection: boolean;
    };
    features: {
        twoFactorAuth: boolean;
        ipWhitelisting: boolean;
        auditLogging: boolean;
        realTimeMonitoring: boolean;
        advancedAnalytics: boolean;
    };
    roles: {
        SUPER_ADMIN: string;
        PLATFORM_ADMIN: string;
        SUPPORT: string;
        DEVELOPER: string;
    };
    api: {
        prefix: string;
        version: string;
        endpoints: {
            auth: string;
            tenants: string;
            system: string;
            analytics: string;
            security: string;
            billing: string;
            support: string;
        };
    };
};
export interface AdminConfig {
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        url: string;
        schema: string;
    };
    server: {
        port: number;
        apiUrl: string;
        environment: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    security: {
        bcryptRounds: number;
        sessionTimeout: string;
        maxLoginAttempts: number;
        ipWhitelist: string[];
    };
    cors: {
        allowedOrigins: string[];
    };
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string;
        file: string;
    };
    monitoring: {
        healthCheckInterval: number;
        metricsCollection: boolean;
    };
    features: {
        twoFactorAuth: boolean;
        ipWhitelisting: boolean;
        auditLogging: boolean;
        realTimeMonitoring: boolean;
        advancedAnalytics: boolean;
    };
    roles: {
        SUPER_ADMIN: string;
        PLATFORM_ADMIN: string;
        SUPPORT: string;
        DEVELOPER: string;
    };
    api: {
        prefix: string;
        version: string;
        endpoints: {
            auth: string;
            tenants: string;
            system: string;
            analytics: string;
            security: string;
            billing: string;
            support: string;
        };
    };
}
//# sourceMappingURL=admin.d.ts.map