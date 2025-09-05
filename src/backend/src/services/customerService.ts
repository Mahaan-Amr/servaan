import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// Types and Interfaces
export interface CustomerFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  segment?: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP';
  tierLevel?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  city?: string;
  birthdayMonth?: number;
  createdFrom?: Date;
  createdTo?: Date;
  lastVisitFrom?: Date;
  lastVisitTo?: Date;
}

export interface CustomerCreateData {
  phone: string;
  name: string;
  nameEnglish?: string;
  email?: string;
  birthday?: Date;
  anniversary?: Date;
  notes?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  preferences?: Record<string, any>;
  tenantId: string; // Add tenantId to creation data
}

export interface CustomerUpdateData {
  name?: string;
  nameEnglish?: string;
  email?: string;
  birthday?: Date;
  anniversary?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  notes?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  preferences?: Record<string, any>;
}

export interface CustomerSummary {
  id: string;
  phone: string;
  phoneNormalized: string;
  name: string;
  email?: string;
  status: string;
  segment: string;
  totalVisits: number;
  currentPoints: number;
  tierLevel: string;
  lifetimeSpent: number;
  lastVisitDate?: Date;
  daysSinceLastVisit?: number;
  visitedRecently: boolean;
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  errors: string[];
}

/**
 * Validate and normalize Iranian phone number
 */
export function validateAndNormalizePhone(phone: string): PhoneValidationResult {
  const errors: string[] = [];
  
  if (!phone || phone.trim() === '') {
    errors.push('شماره تلفن الزامی است');
    return { isValid: false, errors };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  
  // Validate Iranian mobile patterns
  const iranianMobilePatterns = [
    /^989[0-9]{9}$/, // +989XXXXXXXXX
    /^09[0-9]{9}$/,  // 09XXXXXXXXX
    /^9[0-9]{9}$/,   // 9XXXXXXXXX
    /^0098[0-9]{10}$/, // 0098XXXXXXXXX
    /^98[0-9]{10}$/  // 98XXXXXXXXX
  ];

  const isValidPattern = iranianMobilePatterns.some(pattern => pattern.test(digitsOnly));
  
  if (!isValidPattern) {
    errors.push('فرمت شماره تلفن معتبر نیست. شماره همراه ایرانی وارد کنید');
    return { isValid: false, errors };
  }

  // Normalize using database function pattern
  let normalized = digitsOnly;
  if (normalized.startsWith('09')) {
    normalized = '+98' + normalized.substring(1);
  } else if (normalized.startsWith('9') && normalized.length === 10) {
    normalized = '+98' + normalized;
  } else if (normalized.startsWith('0098')) {
    normalized = '+' + normalized.substring(2);
  } else if (normalized.startsWith('98') && normalized.length === 12) {
    normalized = '+' + normalized;
  } else if (normalized.startsWith('989') && normalized.length === 12) {
    normalized = '+' + normalized;
  }

  return {
    isValid: true,
    normalized,
    errors: []
  };
}

/**
 * Check if customer exists by phone
 */
export async function customerExistsByPhone(phone: string, tenantId: string): Promise<boolean> {
  const phoneValidation = validateAndNormalizePhone(phone);
  if (!phoneValidation.isValid) {
    return false;
  }

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: phone },
        { phone: phoneValidation.normalized! },
        { phoneNormalized: phoneValidation.normalized! }
      ],
      tenantId: tenantId, // Add tenant filtering
      isActive: true
    }
  });

  return !!customer;
}

/**
 * Create new customer
 */
export async function createCustomer(
  data: CustomerCreateData, 
  createdBy: string
): Promise<any> {
  // Validate phone
  const phoneValidation = validateAndNormalizePhone(data.phone);
  if (!phoneValidation.isValid) {
    throw new AppError(phoneValidation.errors.join(', '), 400);
  }

  // Check if customer already exists
  const exists = await customerExistsByPhone(data.phone, data.tenantId);
  if (exists) {
    throw new AppError('مشتری با این شماره تلفن قبلاً ثبت شده است', 409);
  }

  // Validate email if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError('فرمت ایمیل معتبر نیست', 400);
    }
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        phone: data.phone,
        phoneNormalized: phoneValidation.normalized!,
        name: data.name.trim(),
        nameEnglish: data.nameEnglish?.trim(),
        email: data.email?.toLowerCase().trim(),
        birthday: data.birthday,
        anniversary: data.anniversary,
        notes: data.notes?.trim(),
        address: data.address?.trim(),
        city: data.city?.trim(),
        postalCode: data.postalCode?.trim(),
        preferences: data.preferences || {},
        segment: 'NEW', // New customers start as NEW
        status: 'ACTIVE',
        tenantId: data.tenantId, // Add tenantId
        createdBy,
        updatedBy: createdBy
      },
      include: {
        loyalty: true,
        createdByUser: {
          select: { name: true, email: true }
        }
      }
    });

    // Create initial loyalty record
    await prisma.customerLoyalty.create({
      data: {
        customerId: customer.id,
        tenantId: data.tenantId, // Add tenantId
        pointsEarned: 0,
        pointsRedeemed: 0,
        currentPoints: 0,
        tierLevel: 'BRONZE',
        lifetimeSpent: 0,
        currentYearSpent: 0,
        currentMonthSpent: 0,
        totalVisits: 0,
        visitsThisMonth: 0
      }
    });

    return customer;
  } catch (error: any) {
    console.error('Error creating customer:', error);
    if (error.code === 'P2002') {
      throw new AppError('مشتری با این شماره تلفن قبلاً ثبت شده است', 409);
    }
    throw new AppError('خطا در ثبت مشتری', 500);
  }
}

/**
 * Get customer by ID with loyalty information
 */
export async function getCustomerById(id: string, tenantId: string): Promise<any> {
  const customer = await prisma.customer.findUnique({
    where: { 
      id, 
      tenantId: tenantId, // Add tenant filtering
      isActive: true 
    },
    include: {
      loyalty: true,
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 5,
        include: {
          createdByUser: {
            select: { name: true }
          }
        }
      },
      feedback: {
        orderBy: { createdAt: 'desc' },
        take: 3
      },
      loyaltyTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      createdByUser: {
        select: { name: true, email: true }
      }
    }
  });

  if (!customer) {
    throw new AppError('مشتری یافت نشد', 404);
  }

  return customer;
}

/**
 * Get customer by phone
 */
export async function getCustomerByPhone(phone: string, tenantId: string): Promise<any> {
  const phoneValidation = validateAndNormalizePhone(phone);
  if (!phoneValidation.isValid) {
    throw new AppError(phoneValidation.errors.join(', '), 400);
  }

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: phone },
        { phone: phoneValidation.normalized! },
        { phoneNormalized: phoneValidation.normalized! }
      ],
      tenantId: tenantId, // Add tenant filtering
      isActive: true
    },
    include: {
      loyalty: true,
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 5
      }
    }
  });

  if (!customer) {
    throw new AppError('مشتری با این شماره تلفن یافت نشد', 404);
  }

  return customer;
}

/**
 * Update customer
 */
export async function updateCustomer(
  id: string,
  data: CustomerUpdateData,
  updatedBy: string,
  tenantId: string
): Promise<any> {
  // Check if customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { 
      id, 
      tenantId: tenantId, // Add tenant filtering
      isActive: true 
    }
  });

  if (!existingCustomer) {
    throw new AppError('مشتری یافت نشد', 404);
  }

  // Validate email if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError('فرمت ایمیل نامعتبر نیست', 400);
    }
  }

  try {
    const customer = await prisma.customer.update({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        ...data,
        name: data.name?.trim(),
        nameEnglish: data.nameEnglish?.trim(),
        email: data.email?.toLowerCase().trim(),
        notes: data.notes?.trim(),
        address: data.address?.trim(),
        city: data.city?.trim(),
        postalCode: data.postalCode?.trim(),
        updatedBy,
        updatedAt: new Date()
      },
      include: {
        loyalty: true,
        createdByUser: {
          select: { name: true, email: true }
        }
      }
    });

    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new AppError('خطا در بروزرسانی مشتری', 500);
  }
}

/**
 * Soft delete customer
 */
export async function deleteCustomer(id: string, deletedBy: string, tenantId: string): Promise<void> {
  const customer = await prisma.customer.findUnique({
    where: { 
      id, 
      tenantId: tenantId, // Add tenant filtering
      isActive: true 
    }
  });

  if (!customer) {
    throw new AppError('مشتری یافت نشد', 404);
  }

  try {
    await prisma.customer.update({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedBy: deletedBy,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new AppError('خطا در حذف مشتری', 500);
  }
}

/**
 * Get customers with filters and pagination
 */
export async function getCustomers(filter: CustomerFilter = {}, tenantId: string): Promise<any> {
  const {
    page = 1,
    limit = 50,
    search,
    status,
    segment,
    tierLevel,
    city,
    birthdayMonth,
    createdFrom,
    createdTo,
    lastVisitFrom,
    lastVisitTo
  } = filter;

  const skip = (page - 1) * limit;
  const whereClause: any = { 
    isActive: true,
    tenantId: tenantId // Add tenant filtering
  };

  // Build where clause
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameEnglish: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) whereClause.status = status;
  if (segment) whereClause.segment = segment;
  if (city) whereClause.city = { contains: city, mode: 'insensitive' };

  if (birthdayMonth) {
    whereClause.birthday = {
      not: null
    };
    // Note: This is a simplified approach. In production, use SQL EXTRACT function
  }

  if (createdFrom || createdTo) {
    whereClause.createdAt = {};
    if (createdFrom) whereClause.createdAt.gte = createdFrom;
    if (createdTo) whereClause.createdAt.lte = createdTo;
  }

  // Loyalty tier filter
  if (tierLevel) {
    whereClause.loyalty = {
      tierLevel: tierLevel,
      tenantId: tenantId // Add tenant filtering to loyalty
    };
  }

  try {
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          loyalty: true,
          _count: {
            select: {
              visits: true,
              feedback: true
            }
          }
        },
        orderBy: [
          { loyalty: { lastVisitDate: 'desc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.customer.count({ where: whereClause })
    ]);

    return {
      customers,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new AppError('خطا در دریافت لیست مشتریان', 500);
  }
}

/**
 * Get customer summary using database view
 */
export async function getCustomerSummaries(filter: CustomerFilter = {}, tenantId: string): Promise<CustomerSummary[]> {
  try {
    // Use the customer_summary view created in CRM functions
    const result = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.phone,
        c."phoneNormalized" as "phoneNormalized",
        c.name,
        c.email,
        c.status,
        c.segment,
        COALESCE(cl."totalVisits", 0) as "totalVisits",
        COALESCE(cl."currentPoints", 0) as "currentPoints",
        COALESCE(cl."tierLevel", 'BRONZE') as "tierLevel",
        COALESCE(cl."lifetimeSpent", 0) as "lifetimeSpent",
        cl."lastVisitDate" as "lastVisitDate",
        CASE 
          WHEN cl."lastVisitDate" IS NOT NULL 
          THEN EXTRACT(DAY FROM NOW() - cl."lastVisitDate")::INTEGER
          ELSE NULL
        END as "daysSinceLastVisit",
        CASE 
          WHEN cl."lastVisitDate" >= CURRENT_DATE - INTERVAL '30 days' THEN true
          ELSE false
        END as "visitedRecently"
      FROM customers c
      LEFT JOIN customer_loyalty cl ON c.id = cl."customerId"
      WHERE c."isActive" = true
      AND c."tenantId" = ${tenantId}
      AND (cl."tenantId" = ${tenantId} OR cl."tenantId" IS NULL)
      ORDER BY cl."lastVisitDate" DESC NULLS LAST, c."createdAt" DESC
      LIMIT ${filter.limit || 100}
      OFFSET ${((filter.page || 1) - 1) * (filter.limit || 100)}
    `;

    return result as CustomerSummary[];
  } catch (error) {
    console.error('Error fetching customer summaries:', error);
    throw new AppError('خطا در دریافت خلاصه مشتریان', 500);
  }
}

/**
 * Update customer segment based on behavior
 */
export async function updateCustomerSegment(customerId: string, tenantId: string): Promise<void> {
  try {
    // Use SQL function to calculate segment
    await prisma.$executeRaw`
      UPDATE customers 
      SET segment = (
        SELECT get_customer_segment(
          cl."lifetimeSpent"::DECIMAL,
          cl."totalVisits"::INTEGER,
          cl."currentYearSpent"::DECIMAL,
          cl."lastVisitDate"::DATE
        )
      )
      FROM customer_loyalty cl
      WHERE customers.id = ${customerId}
      AND customers."tenantId" = ${tenantId}
      AND cl."customerId" = ${customerId}
      AND cl."tenantId" = ${tenantId}
    `;
  } catch (error) {
    console.error('Error updating customer segment:', error);
    // Don't throw error - this is background operation
  }
}

/**
 * Get customers with upcoming birthdays
 */
export async function getUpcomingBirthdays(days: number = 7, tenantId: string): Promise<any[]> {
  try {
    const customers = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.email,
        c.birthday,
        EXTRACT(DOY FROM c.birthday) as birthday_day,
        EXTRACT(DOY FROM CURRENT_DATE) as current_day,
        COALESCE(cl."currentPoints", 0) as current_points,
        COALESCE(cl."tierLevel", 'BRONZE') as tier_level
      FROM customers c
      LEFT JOIN customer_loyalty cl ON c.id = cl."customerId"
      WHERE c."isActive" = true 
      AND c."tenantId" = ${tenantId}
      AND (cl."tenantId" = ${tenantId} OR cl."tenantId" IS NULL)
      AND c.birthday IS NOT NULL
      AND (
        EXTRACT(DOY FROM c.birthday) BETWEEN 
        EXTRACT(DOY FROM CURRENT_DATE) AND 
        EXTRACT(DOY FROM CURRENT_DATE + INTERVAL '${days} days')
      )
      ORDER BY EXTRACT(DOY FROM c.birthday)
    `;

    return customers as any[];
  } catch (error) {
    console.error('Error fetching upcoming birthdays:', error);
    throw new AppError('خطا در دریافت تولدهای نزدیک', 500);
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStatistics(tenantId: string): Promise<any> {
  try {
    const [
      totalCustomers,
      activeCustomers,
      newThisMonth,
      bySegment,
      byTier,
      recentlyActive
    ] = await Promise.all([
      prisma.customer.count({ 
        where: { 
          isActive: true,
          tenantId: tenantId // Add tenant filtering
        } 
      }),
      prisma.customer.count({ 
        where: { 
          isActive: true, 
          status: 'ACTIVE',
          tenantId: tenantId // Add tenant filtering
        } 
      }),
      prisma.customer.count({
        where: {
          isActive: true,
          tenantId: tenantId, // Add tenant filtering
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.customer.groupBy({
        by: ['segment'],
        where: { 
          isActive: true,
          tenantId: tenantId // Add tenant filtering
        },
        _count: true
      }),
      prisma.customerLoyalty.groupBy({
        by: ['tierLevel'],
        where: {
          tenantId: tenantId // Add tenant filtering
        },
        _count: true
      }),
      prisma.customer.count({
        where: {
          isActive: true,
          tenantId: tenantId, // Add tenant filtering
          loyalty: {
            lastVisitDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            tenantId: tenantId // Add tenant filtering to loyalty
          }
        }
      })
    ]);

    return {
      totalCustomers,
      activeCustomers,
      newThisMonth,
      recentlyActive,
      segmentDistribution: bySegment.reduce((acc: any, item: any) => {
        acc[item.segment] = item._count;
        return acc;
      }, {}),
      tierDistribution: byTier.reduce((acc: any, item: any) => {
        acc[item.tierLevel] = item._count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    throw new AppError('خطا در دریافت آمار مشتریان', 500);
  }
} 
