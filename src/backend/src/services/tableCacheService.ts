import { PrismaClient, TableStatus, Table } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

// Cache configuration
const CACHE_TTL = {
  TABLE_LIST: 5 * 60, // 5 minutes
  TABLE_DETAILS: 2 * 60, // 2 minutes
  RESERVATIONS: 1 * 60, // 1 minute
  ANALYTICS: 10 * 60, // 10 minutes
  STATS: 30, // 30 seconds
};

// In-memory cache (in production, use Redis)
class TableCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Get cached data or fetch from database
   */
  async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = CACHE_TTL.TABLE_LIST
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl * 1000) {
      this.cacheHits++;
      return cached.data as T;
    }

    this.cacheMisses++;
    const data = await fetchFunction();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl
    });

    return data;
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern: string) {
    const keysToDelete: string[] = [];
    
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    return {
      totalRequests,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: `${hitRate.toFixed(2)}%`,
      cacheSize: this.cache.size
    };
  }

  /**
   * Cache table list with filters
   */
  async getCachedTables(tenantId: string, filters: any = {}) {
    const cacheKey = `tables:${tenantId}:${JSON.stringify(filters)}`;
    
    return this.getCachedData(
      cacheKey,
      async () => {
        const whereClause: any = { tenantId, isActive: true };
        
        if (filters.status && filters.status.length > 0) {
          whereClause.status = { in: filters.status };
        }
        
        if (filters.section) {
          whereClause.section = filters.section;
        }
        
        if (filters.floor) {
          whereClause.floor = filters.floor;
        }
        
        if (filters.capacity) {
          if (filters.capacity.min) {
            whereClause.capacity = { gte: filters.capacity.min };
          }
          if (filters.capacity.max) {
            whereClause.capacity = { ...whereClause.capacity, lte: filters.capacity.max };
          }
        }

        return await prisma.table.findMany({
          where: whereClause,
          include: {
            orders: {
              where: {
                status: {
                  notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID']
                }
              },
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                }
              },
              orderBy: {
                orderDate: 'desc'
              },
              take: 1
            },
            reservations: {
              where: {
                status: 'CONFIRMED',
                reservationDate: {
                  gte: new Date(),
                  lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
                }
              },
              orderBy: {
                reservationDate: 'asc'
              },
              take: 1
            }
          },
          orderBy: { tableNumber: 'asc' }
        });
      },
      CACHE_TTL.TABLE_LIST
    );
  }

  /**
   * Cache table statistics
   */
  async getCachedTableStats(tenantId: string) {
    const cacheKey = `table_stats:${tenantId}`;
    
    return this.getCachedData(
      cacheKey,
      async () => {
        const tables = await prisma.table.findMany({
          where: { tenantId, isActive: true },
          select: { status: true }
        });

        const stats = {
          total: tables.length,
          available: tables.filter(t => t.status === 'AVAILABLE').length,
          occupied: tables.filter(t => t.status === 'OCCUPIED').length,
          reserved: tables.filter(t => t.status === 'RESERVED').length,
          cleaning: tables.filter(t => t.status === 'CLEANING').length,
          outOfOrder: tables.filter(t => t.status === 'OUT_OF_ORDER').length
        };

        return stats;
      },
      CACHE_TTL.STATS
    );
  }

  /**
   * Cache table reservations
   */
  async getCachedReservations(tenantId: string, filters: any = {}) {
    const cacheKey = `reservations:${tenantId}:${JSON.stringify(filters)}`;
    
    return this.getCachedData(
      cacheKey,
      async () => {
        const whereClause: any = { tenantId };
        
        if (filters.tableId) {
          whereClause.tableId = filters.tableId;
        }
        
        if (filters.customerId) {
          whereClause.customerId = filters.customerId;
        }
        
        if (filters.date) {
          whereClause.reservationDate = {
            gte: new Date(filters.date),
            lt: new Date(new Date(filters.date).getTime() + 24 * 60 * 60 * 1000)
          };
        }
        
        if (filters.startDate && filters.endDate) {
          whereClause.reservationDate = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
          };
        }
        
        if (filters.status && filters.status.length > 0) {
          whereClause.status = { in: filters.status };
        }

        return await prisma.tableReservation.findMany({
          where: whereClause,
          include: {
            table: {
              select: {
                id: true,
                tableNumber: true,
                tableName: true,
                capacity: true,
                section: true
              }
            }
          },
          orderBy: { reservationDate: 'asc' }
        });
      },
      CACHE_TTL.RESERVATIONS
    );
  }

  /**
   * Invalidate table-related cache when table is updated
   */
  async invalidateTableCache(tenantId: string, tableId?: string) {
    this.invalidateCache(`tables:${tenantId}`);
    this.invalidateCache(`table_stats:${tenantId}`);
    this.invalidateCache(`reservations:${tenantId}`);
    
    if (tableId) {
      this.invalidateCache(`table:${tableId}`);
    }
    
    console.log(`🔄 Table cache invalidated for tenant: ${tenantId}`);
  }

  /**
   * Invalidate analytics cache
   */
  async invalidateAnalyticsCache(tenantId: string) {
    this.invalidateCache(`analytics:${tenantId}`);
    console.log(`🔄 Analytics cache invalidated for tenant: ${tenantId}`);
  }
}

export const tableCacheService = new TableCacheService(); 
