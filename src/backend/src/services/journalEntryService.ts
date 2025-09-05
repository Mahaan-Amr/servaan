import { PrismaClient, JournalStatus, SourceType } from '../../../shared/generated/client';

const prisma = new PrismaClient();

export interface JournalEntryData {
  entryDate: Date;
  description: string;
  reference?: string;
  sourceType?: SourceType;
  sourceId?: string;
  lines: JournalEntryLineData[];
  tenantId: string;
}

export interface JournalEntryLineData {
  accountId: string;
  description?: string | null;
  debitAmount: number;
  creditAmount: number;
  costCenterId?: string | null;
  projectCode?: string | null;
}

export interface JournalEntryFilter {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  status?: JournalStatus;
  sourceType?: SourceType;
  costCenterId?: string;
  search?: string;
}

/**
 * Journal Entry Service
 * سرویس اسناد حسابداری
 */
export class JournalEntryService {

  /**
   * Create journal entry with validation
   * ایجاد سند حسابداری با اعتبارسنجی
   */
  static async createJournalEntry(data: JournalEntryData, createdBy: string, tenantId: string) {
    // Validate double-entry bookkeeping
    this.validateDoubleEntry(data.lines);

    // Generate entry number
    const entryNumber = await this.generateEntryNumber();

    // Calculate totals
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);

    return await prisma.$transaction(async (tx) => {
      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: data.entryDate,
          description: data.description,
          reference: data.reference,
          totalDebit,
          totalCredit,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          createdBy,
          status: 'DRAFT',
          tenantId
        }
      });

      // Create journal entry lines
      const lines = await Promise.all(
        data.lines.map((line, index) =>
          tx.journalEntryLine.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: line.accountId,
              description: line.description,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              lineNumber: index + 1,
              costCenterId: line.costCenterId,
              projectCode: line.projectCode,
              tenantId
            }
          })
        )
      );

      return {
        ...journalEntry,
        lines
      };
    });
  }

  /**
   * Post journal entry (approve and finalize)
   * تصویب سند حسابداری
   */
  static async postJournalEntry(id: string, approvedBy: string) {
    const journalEntry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true }
    });

    if (!journalEntry) {
      throw new Error('Journal entry not found');
    }

    if (journalEntry.status !== 'DRAFT') {
      throw new Error('Only draft entries can be posted');
    }

    // Re-validate double-entry
    const linesForValidation = journalEntry.lines.map(line => ({
      accountId: line.accountId,
      description: line.description,
      debitAmount: Number(line.debitAmount),
      creditAmount: Number(line.creditAmount),
      costCenterId: line.costCenterId,
      projectCode: line.projectCode
    }));
    this.validateDoubleEntry(linesForValidation);

    return await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        approvedBy,
        approvedAt: new Date()
      }
    });
  }

  /**
   * Reverse journal entry
   * ابطال سند حسابداری
   */
  static async reverseJournalEntry(id: string, reversedBy: string, reversalReason: string, tenantId: string) {
    const originalEntry = await prisma.journalEntry.findUnique({
      where: { 
        id,
        tenantId
      },
      include: { lines: { include: { account: true } } }
    });

    if (!originalEntry) {
      throw new Error('Journal entry not found');
    }

    if (originalEntry.status !== 'POSTED') {
      throw new Error('Only posted entries can be reversed');
    }

    return await prisma.$transaction(async (tx) => {
      // Mark original entry as reversed
      await tx.journalEntry.update({
        where: { 
          id,
          tenantId
        },
        data: {
          status: 'REVERSED',
          reversedBy,
          reversedAt: new Date(),
          reversalReason
        }
      });

      // Create reversal entry
      const reversalEntryNumber = await this.generateEntryNumber();
      const reversalLines = originalEntry.lines.map(line => ({
        accountId: line.accountId,
        description: `ابطال: ${line.description || ''}`,
        debitAmount: Number(line.creditAmount), // Swap debit and credit
        creditAmount: Number(line.debitAmount),
        costCenterId: line.costCenterId,
        projectCode: line.projectCode
      }));

      return await this.createJournalEntry({
        entryDate: new Date(),
        description: `ابطال سند شماره ${originalEntry.entryNumber}: ${reversalReason}`,
        reference: `REV-${originalEntry.entryNumber}`,
        sourceType: 'MANUAL',
        lines: reversalLines,
        tenantId
      }, reversedBy, tenantId);
    });
  }

  /**
   * Get journal entries with filters
   * دریافت اسناد حسابداری با فیلتر
   */
  static async getJournalEntries(
    filter: JournalEntryFilter = {},
    page: number = 1,
    limit: number = 50
  ) {
    const whereClause: any = {};

    if (filter.startDate || filter.endDate) {
      whereClause.entryDate = {};
      if (filter.startDate) whereClause.entryDate.gte = filter.startDate;
      if (filter.endDate) whereClause.entryDate.lte = filter.endDate;
    }

    if (filter.status) {
      whereClause.status = filter.status;
    }

    if (filter.sourceType) {
      whereClause.sourceType = filter.sourceType;
    }

    if (filter.accountId) {
      whereClause.lines = {
        some: {
          accountId: filter.accountId
        }
      };
    }

    if (filter.costCenterId) {
      whereClause.lines = {
        some: {
          costCenterId: filter.costCenterId
        }
      };
    }

    if (filter.search) {
      whereClause.OR = [
        { description: { contains: filter.search, mode: 'insensitive' } },
        { entryNumber: { contains: filter.search } },
        { reference: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: whereClause,
        include: {
          lines: {
            include: {
              account: true,
              costCenter: true
            }
          },
          createdByUser: {
            select: { id: true, name: true, email: true }
          },
          approvedByUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { entryDate: 'desc' },
          { entryNumber: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.journalEntry.count({ where: whereClause })
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get journal entry by ID
   * دریافت سند حسابداری با شناسه
   */
  static async getJournalEntryById(id: string) {
    return await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true,
            costCenter: true
          },
          orderBy: { lineNumber: 'asc' }
        },
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        approvedByUser: {
          select: { id: true, name: true, email: true }
        },
        reversedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Update journal entry (only drafts)
   * بروزرسانی سند حسابداری
   */
  static async updateJournalEntry(id: string, data: Partial<JournalEntryData>) {
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      throw new Error('Journal entry not found');
    }

    if (existingEntry.status !== 'DRAFT') {
      throw new Error('Only draft entries can be updated');
    }

    if (data.lines) {
      this.validateDoubleEntry(data.lines);
    }

    return await prisma.$transaction(async (tx) => {
      // Update journal entry
      const updateData: any = {};
      if (data.entryDate) updateData.entryDate = data.entryDate;
      if (data.description) updateData.description = data.description;
      if (data.reference !== undefined) updateData.reference = data.reference;

      if (data.lines) {
        const totalDebit = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
        const totalCredit = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);
        updateData.totalDebit = totalDebit;
        updateData.totalCredit = totalCredit;

        // Delete existing lines
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: id }
        });

        // Create new lines
        await Promise.all(
          data.lines.map((line, index) =>
            tx.journalEntryLine.create({
              data: {
                journalEntryId: id,
                accountId: line.accountId,
                description: line.description,
                debitAmount: line.debitAmount,
                creditAmount: line.creditAmount,
                lineNumber: index + 1,
                costCenterId: line.costCenterId,
                projectCode: line.projectCode,
                tenantId: existingEntry.tenantId
              }
            })
          )
        );
      }

      return await tx.journalEntry.update({
        where: { id },
        data: updateData
      });
    });
  }

  /**
   * Delete journal entry (only drafts)
   * حذف سند حسابداری
   */
  static async deleteJournalEntry(id: string) {
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      throw new Error('Journal entry not found');
    }

    if (existingEntry.status !== 'DRAFT') {
      throw new Error('Only draft entries can be deleted');
    }

    return await prisma.journalEntry.delete({
      where: { id }
    });
  }

  /**
   * Generate automatic journal entries from POS sales
   * تولید خودکار اسناد حسابداری از فروش
   */
  static async generateSalesEntry(saleData: {
    saleId: string;
    totalAmount: number;
    taxAmount: number;
    costOfGoodsSold: number;
    paymentMethod: 'CASH' | 'CARD' | 'CREDIT';
    customerId?: string;
  }, createdBy: string, tenantId: string) {
    const lines: JournalEntryLineData[] = [];

    // Debit: Cash/Bank/Accounts Receivable
    if (saleData.paymentMethod === 'CASH') {
      const cashAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '1101' } // صندوق
      });
      if (cashAccount) {
        lines.push({
          accountId: cashAccount.id,
          description: 'دریافت نقدی از فروش',
          debitAmount: saleData.totalAmount,
          creditAmount: 0
        });
      }
    } else if (saleData.paymentMethod === 'CARD') {
      const bankAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '1102' } // بانک
      });
      if (bankAccount) {
        lines.push({
          accountId: bankAccount.id,
          description: 'دریافت کارتی از فروش',
          debitAmount: saleData.totalAmount,
          creditAmount: 0
        });
      }
    } else if (saleData.paymentMethod === 'CREDIT') {
      const receivableAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '1103' } // حساب‌های دریافتنی
      });
      if (receivableAccount) {
        lines.push({
          accountId: receivableAccount.id,
          description: 'فروش نسیه',
          debitAmount: saleData.totalAmount,
          creditAmount: 0
        });
      }
    }

    // Credit: Sales Revenue
    const salesAccount = await prisma.chartOfAccount.findFirst({
      where: { accountCode: '4101' } // فروش کالا
    });
    if (salesAccount) {
      lines.push({
        accountId: salesAccount.id,
        description: 'درآمد فروش کالا',
        debitAmount: 0,
        creditAmount: saleData.totalAmount - saleData.taxAmount
      });
    }

    // Credit: Tax Payable (if applicable)
    if (saleData.taxAmount > 0) {
      const taxAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '2102' } // مالیات پرداختنی
      });
      if (taxAccount) {
        lines.push({
          accountId: taxAccount.id,
          description: 'مالیات بر ارزش افزوده',
          debitAmount: 0,
          creditAmount: saleData.taxAmount
        });
      }
    }

    // Cost of Goods Sold entry
    if (saleData.costOfGoodsSold > 0) {
      const cogsAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '5100' } // بهای تمام شده
      });
      const inventoryAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '1104' } // موجودی کالا
      });

      if (cogsAccount && inventoryAccount) {
        lines.push(
          {
            accountId: cogsAccount.id,
            description: 'بهای تمام شده کالای فروخته شده',
            debitAmount: saleData.costOfGoodsSold,
            creditAmount: 0
          },
          {
            accountId: inventoryAccount.id,
            description: 'کاهش موجودی کالا',
            debitAmount: 0,
            creditAmount: saleData.costOfGoodsSold
          }
        );
      }
    }

    return await this.createJournalEntry({
      entryDate: new Date(),
      description: `فروش - شماره فروش: ${saleData.saleId}`,
      reference: `SALE-${saleData.saleId}`,
      sourceType: 'POS',
      sourceId: saleData.saleId,
      lines,
      tenantId
    }, createdBy, tenantId);
  }

  /**
   * Generate automatic journal entries from purchases
   * تولید خودکار اسناد حسابداری از خرید
   */
  static async generatePurchaseEntry(purchaseData: {
    purchaseId: string;
    totalAmount: number;
    taxAmount: number;
    paymentMethod: 'CASH' | 'CARD' | 'CREDIT';
    supplierId?: string;
  }, createdBy: string, tenantId: string) {
    const lines: JournalEntryLineData[] = [];

    // Debit: Purchases
    const purchaseAccount = await prisma.chartOfAccount.findFirst({
      where: { accountCode: '5101' } // خرید کالا
    });
    if (purchaseAccount) {
      lines.push({
        accountId: purchaseAccount.id,
        description: 'خرید کالا',
        debitAmount: purchaseData.totalAmount - purchaseData.taxAmount,
        creditAmount: 0
      });
    }

    // Debit: Tax (if applicable)
    if (purchaseData.taxAmount > 0) {
      const taxAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '2102' } // مالیات پرداختنی
      });
      if (taxAccount) {
        lines.push({
          accountId: taxAccount.id,
          description: 'مالیات بر ارزش افزوده خرید',
          debitAmount: purchaseData.taxAmount,
          creditAmount: 0
        });
      }
    }

    // Credit: Cash/Bank/Accounts Payable
    if (purchaseData.paymentMethod === 'CASH') {
      const cashAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '1101' } // صندوق
      });
      if (cashAccount) {
        lines.push({
          accountId: cashAccount.id,
          description: 'پرداخت نقدی خرید',
          debitAmount: 0,
          creditAmount: purchaseData.totalAmount
        });
      }
    } else if (purchaseData.paymentMethod === 'CARD') {
      const bankAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '1102' } // بانک
      });
      if (bankAccount) {
        lines.push({
          accountId: bankAccount.id,
          description: 'پرداخت کارتی خرید',
          debitAmount: 0,
          creditAmount: purchaseData.totalAmount
        });
      }
    } else if (purchaseData.paymentMethod === 'CREDIT') {
      const payableAccount = await prisma.chartOfAccount.findFirst({
        where: { accountCode: '2101' } // حساب‌های پرداختنی
      });
      if (payableAccount) {
        lines.push({
          accountId: payableAccount.id,
          description: 'خرید نسیه',
          debitAmount: 0,
          creditAmount: purchaseData.totalAmount
        });
      }
    }

    return await this.createJournalEntry({
      entryDate: new Date(),
      description: `خرید - شماره خرید: ${purchaseData.purchaseId}`,
      reference: `PURCHASE-${purchaseData.purchaseId}`,
      sourceType: 'PURCHASE',
      sourceId: purchaseData.purchaseId,
      lines,
      tenantId
    }, createdBy, tenantId);
  }

  /**
   * Validate double-entry bookkeeping
   * اعتبارسنجی حسابداری دوطرفه
   */
  private static validateDoubleEntry(lines: JournalEntryLineData[]) {
    if (lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }

    const totalDebits = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredits = lines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Debits (${totalDebits}) must equal Credits (${totalCredits})`);
    }

    // Validate that each line has either debit or credit (not both)
    for (const line of lines) {
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new Error('Each line must have either debit or credit amount, not both');
      }
      if (line.debitAmount === 0 && line.creditAmount === 0) {
        throw new Error('Each line must have either debit or credit amount');
      }
    }
  }

  /**
   * Generate unique entry number
   * تولید شماره یکتای سند
   */
  private static async generateEntryNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearShamsi = currentYear - 621; // Convert to Shamsi year

    const lastEntry = await prisma.journalEntry.findFirst({
      where: {
        entryNumber: {
          startsWith: `${yearShamsi}-`
        }
      },
      orderBy: {
        entryNumber: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastEntry) {
      const lastNumber = parseInt(lastEntry.entryNumber.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    return `${yearShamsi}-${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Get trial balance
   * دریافت ترازآزمایشی
   */
  static async getTrialBalance(asOfDate?: Date) {
    const endDate = asOfDate || new Date();

    const accounts = await prisma.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { accountCode: 'asc' }
    });

    const trialBalanceAccounts = await Promise.all(
      accounts.map(async (account) => {
        const result = await prisma.journalEntryLine.aggregate({
          where: {
            accountId: account.id,
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

        const totalDebits = Number(result._sum.debitAmount || 0);
        const totalCredits = Number(result._sum.creditAmount || 0);

        // Calculate balance based on normal balance type
        let debitBalance = 0;
        let creditBalance = 0;

        if (account.normalBalance === 'DEBIT') {
          const balance = totalDebits - totalCredits;
          if (balance > 0) {
            debitBalance = balance;
          } else {
            creditBalance = Math.abs(balance);
          }
        } else {
          const balance = totalCredits - totalDebits;
          if (balance > 0) {
            creditBalance = balance;
          } else {
            debitBalance = Math.abs(balance);
          }
        }

        return {
          accountId: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          debitBalance,
          creditBalance
        };
      })
    );

    // Filter out accounts with zero balances
    const accountsWithBalances = trialBalanceAccounts.filter(
      account => account.debitBalance > 0 || account.creditBalance > 0
    );

    const totalDebits = accountsWithBalances.reduce((sum, account) => sum + account.debitBalance, 0);
    const totalCredits = accountsWithBalances.reduce((sum, account) => sum + account.creditBalance, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      accounts: accountsWithBalances,
      totalDebits,
      totalCredits,
      isBalanced,
      asOfDate: endDate.toISOString()
    };
  }
}

export default JournalEntryService; 
