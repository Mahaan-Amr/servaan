// Dashboard Types for Admin Frontend
// انواع داده‌های داشبورد برای فرانت‌اند مدیریت

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical' | 'maintenance';
  lastUpdated: Date;
}

export interface RecentActivity {
  id: string;
  type: 'tenant' | 'user' | 'system' | 'security';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  uptime: number;
  responseTime: number;
}

export interface TenantGrowthData {
  date: Date;
  count: number;
}

export interface RevenueData {
  date: Date;
  amount: number;
}

export interface UserActivityData {
  date: Date;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  systemMetrics: SystemMetrics;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
}

export interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'maintenance' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  tenantId?: string;
  userId?: string;
  activityType?: string;
  severity?: string;
}

export interface DashboardExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeData: boolean;
}
