import { PrismaClient, AccountType, BalanceType } from '../../shared/generated/client';

const prisma = new PrismaClient();

export interface ChartOfAccountData {
  accountCode: string;
  accountName: string;
  accountNameEn?: string;
  accountType: AccountType;
  parentAccountId?: string;
  normalBalance: BalanceType;
  description?: string;
  tenantId: string;
}

export interface AccountHierarchy {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  level: number;
  children?: AccountHierarchy[];
  balance?: number;
}

/**
 * Chart of Accounts Service
 * مدیریت دفتر حساب‌های ایرانی
 */
export class ChartOfAccountsService {
  
  /**
   * Initialize Iranian Chart of Accounts
   * راه‌اندازی دفتر حساب‌های استاندارد ایرانی
   */
  static async initializeIranianChartOfAccounts(tenantId: string): Promise<void> {
    const iranianAccounts = this.getStandardIranianAccounts(tenantId);
    
    for (const accountData of iranianAccounts) {
      await this.createAccount(accountData);
    }
  }

  /**
   * Create a new account
   * ایجاد حساب جدید
   */
  static async createAccount(data: ChartOfAccountData) {
    // Calculate level based on parent
    let level = 1;
    if (data.parentAccountId) {
      const parent = await prisma.chartOfAccount.findUnique({
        where: { 
          id: data.parentAccountId,
          tenantId: data.tenantId
        }
      });
      if (parent) {
        level = parent.level + 1;
      }
    }

    return await prisma.chartOfAccount.create({
      data: {
        ...data,
        level,
        isSystemAccount: true // Mark as system account during initialization
      }
    });
  }

  /**
   * Get account hierarchy
   * دریافت ساختار درختی حساب‌ها
   */
  static async getAccountHierarchy(tenantId: string, accountType?: AccountType): Promise<AccountHierarchy[]> {
    const whereClause = accountType ? { accountType, isActive: true, tenantId } : { isActive: true, tenantId };
    
    const accounts = await prisma.chartOfAccount.findMany({
      where: whereClause,
      orderBy: [
        { accountCode: 'asc' }
      ]
    });

    // Calculate balances in parallel for all accounts
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => ({
        ...account,
        balance: await this.getAccountBalance(tenantId, account.id)
      }))
    );

    return this.buildHierarchy(accountsWithBalances);
  }

  /**
   * Get account by code
   * دریافت حساب با کد
   */
  static async getAccountByCode(tenantId: string, accountCode: string) {
    return await prisma.chartOfAccount.findFirst({
      where: { 
        accountCode,
        tenantId
      }
    });
  }

  /**
   * Get account by ID
   * دریافت حساب با شناسه
   */
  static async getAccountById(tenantId: string, id: string) {
    return await prisma.chartOfAccount.findUnique({
      where: { 
        id,
        tenantId
      },
      include: {
        parentAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            accountType: true
          }
        },
        childAccounts: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            accountType: true,
            level: true
          },
          orderBy: { accountCode: 'asc' }
        }
      }
    });
  }

  /**
   * Get account balance
   * دریافت مانده حساب
   */
  static async getAccountBalance(tenantId: string, accountId: string, asOfDate?: Date): Promise<number> {
    const endDate = asOfDate || new Date();
    
    const result = await prisma.journalEntryLine.aggregate({
      where: {
        accountId,
        tenantId,
        journalEntry: {
          status: 'POSTED',
          entryDate: {
            lte: endDate
          }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    const totalDebits = result._sum.debitAmount || 0;
    const totalCredits = result._sum.creditAmount || 0;

    // Get account to determine normal balance
    const account = await prisma.chartOfAccount.findUnique({
      where: { 
        id: accountId,
        tenantId
      }
    });

    if (!account) return 0;

    // Calculate balance based on normal balance type
    if (account.normalBalance === 'DEBIT') {
      return Number(totalDebits) - Number(totalCredits);
    } else {
      return Number(totalCredits) - Number(totalDebits);
    }
  }

  /**
   * Search accounts
   * جستجوی حساب‌ها
   */
  static async searchAccounts(tenantId: string, query: string, accountType?: AccountType) {
    const whereClause: any = {
      isActive: true,
      tenantId,
      OR: [
        { accountName: { contains: query, mode: 'insensitive' } },
        { accountCode: { contains: query } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (accountType) {
      whereClause.accountType = accountType;
    }

    return await prisma.chartOfAccount.findMany({
      where: whereClause,
      orderBy: { accountCode: 'asc' },
      take: 50
    });
  }

  /**
   * Update account
   * بروزرسانی حساب
   */
  static async updateAccount(tenantId: string, id: string, data: Partial<ChartOfAccountData>) {
    return await prisma.chartOfAccount.update({
      where: { 
        id,
        tenantId
      },
      data
    });
  }

  /**
   * Deactivate account (soft delete)
   * غیرفعال کردن حساب
   */
  static async deactivateAccount(tenantId: string, id: string) {
    // Check if account has transactions
    const hasTransactions = await prisma.journalEntryLine.findFirst({
      where: { 
        accountId: id,
        tenantId
      }
    });

    if (hasTransactions) {
      throw new Error('Cannot deactivate account with existing transactions');
    }

    return await prisma.chartOfAccount.update({
      where: { 
        id,
        tenantId
      },
      data: { isActive: false }
    });
  }

  /**
   * Get accounts by type
   * دریافت حساب‌ها بر اساس نوع
   */
  static async getAccountsByType(tenantId: string, accountType: AccountType) {
    return await prisma.chartOfAccount.findMany({
      where: {
        accountType,
        isActive: true,
        tenantId
      },
      orderBy: { accountCode: 'asc' }
    });
  }

  /**
   * Build hierarchy from flat array
   * ساخت ساختار درختی از آرایه تخت
   */
  private static buildHierarchy(accounts: any[]): AccountHierarchy[] {
    const accountMap = new Map();
    const rootAccounts: AccountHierarchy[] = [];

    // Create map of all accounts
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: []
      });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const accountNode = accountMap.get(account.id);
      
      if (account.parentAccountId) {
        const parent = accountMap.get(account.parentAccountId);
        if (parent) {
          parent.children.push(accountNode);
        }
      } else {
        rootAccounts.push(accountNode);
      }
    });

    // Recursively sum balances for parent accounts
    function sumBalances(node: any): number {
      if (!node.children || node.children.length === 0) {
        return node.balance || 0;
      }
      // Sum children balances
      const childrenSum = node.children.reduce((sum: number, child: any) => sum + sumBalances(child), 0);
      node.balance = childrenSum;
      return childrenSum;
    }
    rootAccounts.forEach(sumBalances);

    return rootAccounts;
  }

  /**
   * Standard Iranian Chart of Accounts
   * دفتر حساب‌های استاندارد ایرانی
   */
  private static getStandardIranianAccounts(tenantId: string): ChartOfAccountData[] {
    return [
      // دارایی‌ها (Assets) - 1000 series
      {
        accountCode: '1000',
        accountName: 'دارایی‌ها',
        accountNameEn: 'Assets',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'کل دارایی‌های شرکت',
        tenantId
      },
      
      // دارایی‌های جاری (Current Assets) - 1100 series
      {
        accountCode: '1100',
        accountName: 'دارایی‌های جاری',
        accountNameEn: 'Current Assets',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'دارایی‌هایی که در کمتر از یک سال به نقد تبدیل می‌شوند',
        tenantId
      },
      {
        accountCode: '1101',
        accountName: 'صندوق',
        accountNameEn: 'Cash',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'وجه نقد موجود در صندوق',
        tenantId
      },
      {
        accountCode: '1102',
        accountName: 'بانک',
        accountNameEn: 'Bank',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'موجودی حساب‌های بانکی',
        tenantId
      },
      {
        accountCode: '1103',
        accountName: 'حساب‌های دریافتنی',
        accountNameEn: 'Accounts Receivable',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'مطالبات از مشتریان',
        tenantId
      },
      {
        accountCode: '1104',
        accountName: 'موجودی کالا',
        accountNameEn: 'Inventory',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'ارزش کالاهای موجود در انبار',
        tenantId
      },
      {
        accountCode: '1105',
        accountName: 'پیش‌پرداخت‌ها',
        accountNameEn: 'Prepaid Expenses',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'هزینه‌های پرداخت شده از پیش',
        tenantId
      },

      // دارایی‌های ثابت (Fixed Assets) - 1200 series
      {
        accountCode: '1200',
        accountName: 'دارایی‌های ثابت',
        accountNameEn: 'Fixed Assets',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'دارایی‌های بلندمدت شرکت',
        tenantId
      },
      {
        accountCode: '1201',
        accountName: 'ساختمان',
        accountNameEn: 'Buildings',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'ساختمان‌ها و املاک',
        tenantId
      },
      {
        accountCode: '1202',
        accountName: 'تجهیزات',
        accountNameEn: 'Equipment',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        description: 'ماشین‌آلات و تجهیزات',
        tenantId
      },
      {
        accountCode: '1203',
        accountName: 'استهلاک انباشته',
        accountNameEn: 'Accumulated Depreciation',
        accountType: 'ASSET',
        normalBalance: 'CREDIT',
        description: 'استهلاک انباشته دارایی‌های ثابت',
        tenantId
      },

      // بدهی‌ها (Liabilities) - 2000 series
      {
        accountCode: '2000',
        accountName: 'بدهی‌ها',
        accountNameEn: 'Liabilities',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        description: 'کل بدهی‌های شرکت',
        tenantId
      },

      // بدهی‌های جاری (Current Liabilities) - 2100 series
      {
        accountCode: '2100',
        accountName: 'بدهی‌های جاری',
        accountNameEn: 'Current Liabilities',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        description: 'بدهی‌هایی که در کمتر از یک سال پرداخت می‌شوند',
        tenantId
      },
      {
        accountCode: '2101',
        accountName: 'حساب‌های پرداختنی',
        accountNameEn: 'Accounts Payable',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        description: 'بدهی به تأمین‌کنندگان',
        tenantId
      },
      {
        accountCode: '2102',
        accountName: 'مالیات پرداختنی',
        accountNameEn: 'Tax Payable',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        description: 'مالیات‌های پرداختنی',
        tenantId
      },
      {
        accountCode: '2103',
        accountName: 'بیمه پرداختنی',
        accountNameEn: 'Insurance Payable',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        description: 'حق بیمه پرداختنی',
        tenantId
      },
      {
        accountCode: '2104',
        accountName: 'حقوق پرداختنی',
        accountNameEn: 'Salaries Payable',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        description: 'حقوق و دستمزد پرداختنی',
        tenantId
      },

      // حقوق صاحبان سهام (Equity) - 3000 series
      {
        accountCode: '3000',
        accountName: 'حقوق صاحبان سهام',
        accountNameEn: 'Equity',
        accountType: 'EQUITY',
        normalBalance: 'CREDIT',
        description: 'حقوق صاحبان سهام',
        tenantId
      },
      {
        accountCode: '3101',
        accountName: 'سرمایه',
        accountNameEn: 'Capital',
        accountType: 'EQUITY',
        normalBalance: 'CREDIT',
        description: 'سرمایه اولیه شرکت',
        tenantId
      },
      {
        accountCode: '3102',
        accountName: 'سود انباشته',
        accountNameEn: 'Retained Earnings',
        accountType: 'EQUITY',
        normalBalance: 'CREDIT',
        description: 'سود انباشته از سال‌های قبل',
        tenantId
      },

      // درآمدها (Revenue) - 4000 series
      {
        accountCode: '4000',
        accountName: 'درآمدها',
        accountNameEn: 'Revenue',
        accountType: 'REVENUE',
        normalBalance: 'CREDIT',
        description: 'کل درآمدهای شرکت',
        tenantId
      },
      {
        accountCode: '4101',
        accountName: 'فروش کالا',
        accountNameEn: 'Sales Revenue',
        accountType: 'REVENUE',
        normalBalance: 'CREDIT',
        description: 'درآمد حاصل از فروش کالا',
        tenantId
      },
      {
        accountCode: '4102',
        accountName: 'درآمدهای متفرقه',
        accountNameEn: 'Other Revenue',
        accountType: 'REVENUE',
        normalBalance: 'CREDIT',
        description: 'سایر درآمدها',
        tenantId
      },

      // هزینه‌ها (Expenses) - 5000 series
      {
        accountCode: '5000',
        accountName: 'هزینه‌ها',
        accountNameEn: 'Expenses',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'کل هزینه‌های شرکت',
        tenantId
      },

      // بهای تمام شده (Cost of Goods Sold) - 5100 series
      {
        accountCode: '5100',
        accountName: 'بهای تمام شده کالای فروخته شده',
        accountNameEn: 'Cost of Goods Sold',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'بهای تمام شده کالاهای فروخته شده',
        tenantId
      },
      {
        accountCode: '5101',
        accountName: 'خرید کالا',
        accountNameEn: 'Purchases',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'خرید کالا برای فروش',
        tenantId
      },
      {
        accountCode: '5102',
        accountName: 'حمل و نقل خرید',
        accountNameEn: 'Freight In',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه حمل و نقل خرید کالا',
        tenantId
      },

      // هزینه‌های عملیاتی (Operating Expenses) - 5200 series
      {
        accountCode: '5200',
        accountName: 'هزینه‌های عملیاتی',
        accountNameEn: 'Operating Expenses',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه‌های عملیاتی شرکت',
        tenantId
      },
      {
        accountCode: '5201',
        accountName: 'حقوق و دستمزد',
        accountNameEn: 'Salaries and Wages',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'حقوق و دستمزد کارکنان',
        tenantId
      },
      {
        accountCode: '5202',
        accountName: 'اجاره',
        accountNameEn: 'Rent Expense',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه اجاره',
        tenantId
      },
      {
        accountCode: '5203',
        accountName: 'برق و گاز',
        accountNameEn: 'Utilities',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه برق، گاز و آب',
        tenantId
      },
      {
        accountCode: '5204',
        accountName: 'تلفن و اینترنت',
        accountNameEn: 'Communication',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه تلفن و اینترنت',
        tenantId
      },
      {
        accountCode: '5205',
        accountName: 'تبلیغات و بازاریابی',
        accountNameEn: 'Marketing',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه تبلیغات و بازاریابی',
        tenantId
      },
      {
        accountCode: '5206',
        accountName: 'استهلاک',
        accountNameEn: 'Depreciation',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه استهلاک دارایی‌های ثابت',
        tenantId
      },
      {
        accountCode: '5207',
        accountName: 'تعمیر و نگهداری',
        accountNameEn: 'Maintenance',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه تعمیر و نگهداری',
        tenantId
      },
      {
        accountCode: '5208',
        accountName: 'لوازم اداری',
        accountNameEn: 'Office Supplies',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        description: 'هزینه لوازم اداری',
        tenantId
      }
    ];
  }
}

export default ChartOfAccountsService; 
