'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { SystemMetrics } from '@/types/dashboard';
import { getSystemMetrics } from '@/services/dashboardService';
import toast from 'react-hot-toast';

interface SystemHealthWidgetProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SystemHealthWidget({ 
  className = '', 
  autoRefresh = true, 
  refreshInterval = 30000 
}: SystemHealthWidgetProps) {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkIO: 0,
    uptime: 0,
    responseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [trends, setTrends] = useState<{
    cpu: 'up' | 'down' | 'stable';
    memory: 'up' | 'down' | 'stable';
    disk: 'up' | 'down' | 'stable';
    network: 'up' | 'down' | 'stable';
  }>({
    cpu: 'stable',
    memory: 'stable',
    disk: 'stable',
    network: 'stable',
  });

  const fetchMetrics = useCallback(async () => {
    try {
      const newMetrics = await getSystemMetrics();
      setMetrics(newMetrics);
      setLastUpdate(new Date());
      
      // Calculate trends (simplified - in real implementation, compare with previous values)
      setTrends({
        cpu: newMetrics.cpuUsage > 70 ? 'up' : 'stable',
        memory: newMetrics.memoryUsage > 80 ? 'up' : 'stable',
        disk: newMetrics.diskUsage > 85 ? 'up' : 'stable',
        network: newMetrics.networkIO > 60 ? 'up' : 'stable',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات سیستم';
      console.error('Error fetching system metrics:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-50';
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <div className="h-3 w-3" />;
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 24);
    const hours = Math.floor((uptime % 24));
    return `${days} روز ${hours} ساعت`;
  };

  if (loading) {
    return (
      <div className={`admin-card ${className}`}>
        <div className="admin-card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-admin-text">نظارت سیستم</h3>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-admin-primary border-t-transparent"></div>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-card ${className}`}>
      <div className="admin-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-admin-primary ml-2" />
            <h3 className="text-lg font-semibold text-admin-text">نظارت سیستم</h3>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs text-admin-text-muted">
              آخرین به‌روزرسانی: {lastUpdate.toLocaleTimeString('fa-IR')}
            </span>
            <button
              onClick={fetchMetrics}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="به‌روزرسانی"
            >
              <RefreshCw className="h-4 w-4 text-admin-text-muted" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Cpu className="h-4 w-4 text-admin-text-muted ml-1" />
                <span className="text-sm font-medium text-admin-text">پردازنده</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                {getTrendIcon(trends.cpu)}
                <span className="text-sm font-semibold text-admin-text">{metrics.cpuUsage}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.cpuUsage >= 80 ? 'bg-red-500' : 
                  metrics.cpuUsage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${metrics.cpuUsage}%` }}
              ></div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.cpuUsage, { warning: 60, critical: 80 })}`}>
              {metrics.cpuUsage >= 80 ? 'بحرانی' : metrics.cpuUsage >= 60 ? 'هشدار' : 'سالم'}
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="h-4 w-4 text-admin-text-muted ml-1" />
                <span className="text-sm font-medium text-admin-text">حافظه</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                {getTrendIcon(trends.memory)}
                <span className="text-sm font-semibold text-admin-text">{metrics.memoryUsage}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.memoryUsage >= 85 ? 'bg-red-500' : 
                  metrics.memoryUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${metrics.memoryUsage}%` }}
              ></div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.memoryUsage, { warning: 70, critical: 85 })}`}>
              {metrics.memoryUsage >= 85 ? 'بحرانی' : metrics.memoryUsage >= 70 ? 'هشدار' : 'سالم'}
            </div>
          </div>

          {/* Disk Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HardDrive className="h-4 w-4 text-admin-text-muted ml-1" />
                <span className="text-sm font-medium text-admin-text">دیسک</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                {getTrendIcon(trends.disk)}
                <span className="text-sm font-semibold text-admin-text">{metrics.diskUsage}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.diskUsage >= 90 ? 'bg-red-500' : 
                  metrics.diskUsage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${metrics.diskUsage}%` }}
              ></div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.diskUsage, { warning: 75, critical: 90 })}`}>
              {metrics.diskUsage >= 90 ? 'بحرانی' : metrics.diskUsage >= 75 ? 'هشدار' : 'سالم'}
            </div>
          </div>

          {/* Network I/O */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="h-4 w-4 text-admin-text-muted ml-1" />
                <span className="text-sm font-medium text-admin-text">شبکه</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                {getTrendIcon(trends.network)}
                <span className="text-sm font-semibold text-admin-text">{metrics.networkIO}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.networkIO >= 80 ? 'bg-red-500' : 
                  metrics.networkIO >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${metrics.networkIO}%` }}
              ></div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.networkIO, { warning: 60, critical: 80 })}`}>
              {metrics.networkIO >= 80 ? 'بحرانی' : metrics.networkIO >= 60 ? 'هشدار' : 'سالم'}
            </div>
          </div>
        </div>

        {/* System Status Summary */}
        <div className="mt-6 pt-4 border-t border-admin-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-admin-text-muted ml-1" />
                <span className="text-sm text-admin-text-muted">زمان کارکرد</span>
              </div>
              <div className="text-lg font-semibold text-admin-text">
                {formatUptime(metrics.uptime)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Database className="h-4 w-4 text-admin-text-muted ml-1" />
                <span className="text-sm text-admin-text-muted">زمان پاسخ</span>
              </div>
              <div className="text-lg font-semibold text-admin-text">
                {metrics.responseTime}ms
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                <span className="text-sm text-admin-text-muted">وضعیت کلی</span>
              </div>
              <div className="text-lg font-semibold text-green-600">
                سالم
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
