import { PrismaClient, AccountType, StatementType } from '../../../shared/generated/client';

const prisma = new PrismaClient();

export interface BalanceSheetData {
  assets: {
    currentAssets: AccountBalance[];
    fixedAssets: AccountBalance[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: AccountBalance[];
    longTermLiabilities: AccountBalance[];
    totalLiabilities: number;
  };
  equity: {
    equityAccounts: AccountBalance[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface IncomeStatementData {
  revenue: {
    revenueAccounts: AccountBalance[];
    totalRevenue: number;
  };
  expenses: {
    costOfGoodsSold: AccountBalance[];
    operatingExpenses: AccountBalance[];
    totalExpenses: number;
  };
  grossProfit: number;
  netIncome: number;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameEn?: string | null;
  balance: number;
  percentage?: number;
}

export interface CashFlowData {
  operatingActivities: {
    netIncome: number;
    adjustments: AccountBalance[];
    netCashFromOperating: number;
  };
  investingActivities: {
    activities: AccountBalance[];
    netCashFromInvesting: number;
  };
  financingActivities: {
    activities: AccountBalance[];
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

/**
 * Financial Statements Service
 * سرویس صورت‌های مالی
 */
export class FinancialStatementsService {

  /**
   * Generate Balance Sheet (ترازنامه)
   */
  static async generateBalanceSheet(tenantId: string, asOfDate: Date = new Date()): Promise<BalanceSheetData> {
    // Get all asset accounts
    const assetAccounts = await this.getAccountBalances(tenantId, 'ASSET', asOfDate);
    
    // Get all liability accounts
    const liabilityAccounts = await this.getAccountBalances(tenantId, 'LIABILITY', asOfDate);
    
    // Get all equity accounts
    const equityAccounts = await this.getAccountBalances(tenantId, 'EQUITY', asOfDate);

    // Separate current and fixed assets
    const currentAssets = assetAccounts.filter(acc => 
      acc.accountCode.startsWith('11') // Current assets (1100 series)
    );
    const fixedAssets = assetAccounts.filter(acc => 
      acc.accountCode.startsWith('12') // Fixed assets (1200 series)
    );

    // Separate current and long-term liabilities
    const currentLiabilities = liabilityAccounts.filter(acc => 
      acc.accountCode.startsWith('21') // Current liabilities (2100 series)
    );
    const longTermLiabilities = liabilityAccounts.filter(acc => 
      acc.accountCode.startsWith('22') // Long-term liabilities (2200 series)
    );

    const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const balanceSheet: BalanceSheetData = {
      assets: {
        currentAssets: this.addPercentages(currentAssets, totalAssets),
        fixedAssets: this.addPercentages(fixedAssets, totalAssets),
        totalAssets
      },
      liabilities: {
        currentLiabilities: this.addPercentages(currentLiabilities, totalAssets),
        longTermLiabilities: this.addPercentages(longTermLiabilities, totalAssets),
        totalLiabilities
      },
      equity: {
        equityAccounts: this.addPercentages(equityAccounts, totalAssets),
        totalEquity
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };

    // Cache the statement
    await this.cacheFinancialStatement(tenantId, 'BALANCE_SHEET', asOfDate, balanceSheet);

    return balanceSheet;
  }

  /**
   * Generate Income Statement (صورت سود و زیان)
   */
  static async generateIncomeStatement(
    tenantId: string,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<IncomeStatementData> {
    // Get revenue accounts
    const revenueAccounts = await this.getAccountBalancesPeriod(tenantId, 'REVENUE', startDate, endDate);
    
    // Get expense accounts
    const expenseAccounts = await this.getAccountBalancesPeriod(tenantId, 'EXPENSE', startDate, endDate);

    // Separate cost of goods sold from operating expenses
    const costOfGoodsSold = expenseAccounts.filter(acc => 
      acc.accountCode.startsWith('51') // COGS (5100 series)
    );
    const operatingExpenses = expenseAccounts.filter(acc => 
      acc.accountCode.startsWith('52') // Operating expenses (5200 series)
    );

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalCOGS = costOfGoodsSold.reduce((sum, acc) => sum + acc.balance, 0);
    const totalOperatingExpenses = operatingExpenses.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = totalCOGS + totalOperatingExpenses;
    
    const grossProfit = totalRevenue - totalCOGS;
    const netIncome = totalRevenue - totalExpenses;

    const incomeStatement: IncomeStatementData = {
      revenue: {
        revenueAccounts: this.addPercentages(revenueAccounts, totalRevenue),
        totalRevenue
      },
      expenses: {
        costOfGoodsSold: this.addPercentages(costOfGoodsSold, totalRevenue),
        operatingExpenses: this.addPercentages(operatingExpenses, totalRevenue),
        totalExpenses
      },
      grossProfit,
      netIncome
    };

    // Cache the statement
    await this.cacheFinancialStatement(tenantId, 'INCOME_STATEMENT', endDate, incomeStatement, startDate);

    return incomeStatement;
  }

  /**
   * Generate Cash Flow Statement (صورت جریان وجه نقد)
   */
  static async generateCashFlowStatement(
    tenantId: string,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<CashFlowData> {
    // Get net income from income statement
    const incomeStatement = await this.generateIncomeStatement(tenantId, startDate, endDate);
    const netIncome = incomeStatement.netIncome;

    // Get cash accounts (صندوق و بانک)
    const cashAccounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { accountCode: '1101' }, // صندوق
          { accountCode: '1102' }  // بانک
        ],
        isActive: true
      }
    });

    const beginningCash = await this.getCashBalance(tenantId, cashAccounts, startDate);
    const endingCash = await this.getCashBalance(tenantId, cashAccounts, endDate);

    // For simplicity, we'll calculate operating cash flow as net income
    // In a full implementation, you would add back non-cash expenses like depreciation
    const operatingAdjustments: AccountBalance[] = [];
    
    // Add depreciation back (non-cash expense)
    const depreciationAccount = await prisma.chartOfAccount.findFirst({
      where: { accountCode: '5206' } // استهلاک
    });
    
    if (depreciationAccount) {
      const depreciationBalance = await this.getAccountBalancePeriod(
        tenantId,
        depreciationAccount.id, 
        startDate, 
        endDate
      );
      if (depreciationBalance > 0) {
        operatingAdjustments.push({
          accountId: depreciationAccount.id,
          accountCode: depreciationAccount.accountCode,
          accountName: depreciationAccount.accountName,
          accountNameEn: depreciationAccount.accountNameEn,
          balance: depreciationBalance
        });
      }
    }

    const totalAdjustments = operatingAdjustments.reduce((sum, adj) => sum + adj.balance, 0);
    const netCashFromOperating = netIncome + totalAdjustments;

    // For investing and financing activities, we'll use placeholder data
    // In a full implementation, you would analyze specific account movements
    const investingActivities: AccountBalance[] = [];
    const financingActivities: AccountBalance[] = [];

    const netCashFromInvesting = investingActivities.reduce((sum, act) => sum + act.balance, 0);
    const netCashFromFinancing = financingActivities.reduce((sum, act) => sum + act.balance, 0);

    const netCashFlow = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;

    const cashFlowStatement: CashFlowData = {
      operatingActivities: {
        netIncome,
        adjustments: operatingAdjustments,
        netCashFromOperating
      },
      investingActivities: {
        activities: investingActivities,
        netCashFromInvesting
      },
      financingActivities: {
        activities: financingActivities,
        netCashFromFinancing
      },
      netCashFlow,
      beginningCash,
      endingCash
    };

    // Cache the statement
    await this.cacheFinancialStatement(tenantId, 'CASH_FLOW', endDate, cashFlowStatement, startDate);

    return cashFlowStatement;
  }

  /**
   * Get financial ratios (نسبت‌های مالی)
   */
  static async getFinancialRatios(tenantId: string, asOfDate: Date = new Date()) {
    const balanceSheet = await this.generateBalanceSheet(tenantId, asOfDate);
    
    // Calculate year-to-date for income statement
    const yearStart = new Date(asOfDate.getFullYear(), 0, 1);
    const incomeStatement = await this.generateIncomeStatement(tenantId, yearStart, asOfDate);

    // Liquidity Ratios (نسبت‌های نقدینگی)
    const currentAssets = balanceSheet.assets.currentAssets.reduce((sum, acc) => sum + acc.balance, 0);
    const currentLiabilities = balanceSheet.liabilities.currentLiabilities.reduce((sum, acc) => sum + acc.balance, 0);
    
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    
    // Quick Ratio (نسبت آنی)
    const inventory = balanceSheet.assets.currentAssets.find(acc => acc.accountCode === '1104')?.balance || 0;
    const quickAssets = currentAssets - inventory;
    const quickRatio = currentLiabilities > 0 ? quickAssets / currentLiabilities : 0;

    // Cash Ratio (نسبت نقدی)
    const cashAndEquivalents = balanceSheet.assets.currentAssets
      .filter(acc => acc.accountCode === '1101' || acc.accountCode === '1102')
      .reduce((sum, acc) => sum + acc.balance, 0);
    const cashRatio = currentLiabilities > 0 ? cashAndEquivalents / currentLiabilities : 0;

    // Profitability Ratios (نسبت‌های سودآوری)
    const grossProfitMargin = incomeStatement.revenue.totalRevenue > 0 
      ? (incomeStatement.grossProfit / incomeStatement.revenue.totalRevenue) * 100 
      : 0;
    
    const netProfitMargin = incomeStatement.revenue.totalRevenue > 0 
      ? (incomeStatement.netIncome / incomeStatement.revenue.totalRevenue) * 100 
      : 0;

    // Return on Assets (بازده دارایی‌ها)
    const returnOnAssets = balanceSheet.assets.totalAssets > 0 
      ? (incomeStatement.netIncome / balanceSheet.assets.totalAssets) * 100 
      : 0;

    // Return on Equity (بازده حقوق صاحبان سهام)
    const returnOnEquity = balanceSheet.equity.totalEquity > 0 
      ? (incomeStatement.netIncome / balanceSheet.equity.totalEquity) * 100 
      : 0;

    // Leverage Ratios (نسبت‌های اهرمی)
    const debtToAssets = balanceSheet.assets.totalAssets > 0 
      ? (balanceSheet.liabilities.totalLiabilities / balanceSheet.assets.totalAssets) * 100 
      : 0;

    const debtToEquity = balanceSheet.equity.totalEquity > 0 
      ? (balanceSheet.liabilities.totalLiabilities / balanceSheet.equity.totalEquity) * 100 
      : 0;

    const equityRatio = balanceSheet.assets.totalAssets > 0 
      ? (balanceSheet.equity.totalEquity / balanceSheet.assets.totalAssets) * 100 
      : 0;

    // Activity Ratios (نسبت‌های فعالیت)
    const assetTurnover = balanceSheet.assets.totalAssets > 0 
      ? incomeStatement.revenue.totalRevenue / balanceSheet.assets.totalAssets 
      : 0;

    // Inventory Turnover (گردش موجودی)
    const inventoryTurnover = inventory > 0 
      ? incomeStatement.expenses.costOfGoodsSold.reduce((sum, acc) => sum + acc.balance, 0) / inventory 
      : 0;

    // Receivables Turnover (گردش مطالبات)
    const receivables = balanceSheet.assets.currentAssets.find(acc => acc.accountCode === '1103')?.balance || 0;
    const receivablesTurnover = receivables > 0 
      ? incomeStatement.revenue.totalRevenue / receivables 
      : 0;

    return {
      liquidityRatios: {
        currentRatio: Number(currentRatio.toFixed(2)),
        quickRatio: Number(quickRatio.toFixed(2)),
        cashRatio: Number(cashRatio.toFixed(2))
      },
      profitabilityRatios: {
        grossProfitMargin: Number(grossProfitMargin.toFixed(2)),
        netProfitMargin: Number(netProfitMargin.toFixed(2)),
        returnOnAssets: Number(returnOnAssets.toFixed(2)),
        returnOnEquity: Number(returnOnEquity.toFixed(2))
      },
      leverageRatios: {
        debtToAssets: Number(debtToAssets.toFixed(2)),
        debtToEquity: Number(debtToEquity.toFixed(2)),
        equityRatio: Number(equityRatio.toFixed(2))
      },
      activityRatios: {
        assetTurnover: Number(assetTurnover.toFixed(2)),
        inventoryTurnover: Number(inventoryTurnover.toFixed(2)),
        receivablesTurnover: Number(receivablesTurnover.toFixed(2))
      }
    };
  }

  /**
   * Get comparative financial statements (صورت‌های مالی تطبیقی)
   */
  static async getComparativeStatements(
    tenantId: string,
    currentPeriodEnd: Date,
    previousPeriodEnd: Date
  ) {
    const [currentBS, previousBS] = await Promise.all([
      this.generateBalanceSheet(tenantId, currentPeriodEnd),
      this.generateBalanceSheet(tenantId, previousPeriodEnd)
    ]);

    // Calculate year-to-date periods
    const currentYearStart = new Date(currentPeriodEnd.getFullYear(), 0, 1);
    const previousYearStart = new Date(previousPeriodEnd.getFullYear(), 0, 1);

    const [currentIS, previousIS] = await Promise.all([
      this.generateIncomeStatement(tenantId, currentYearStart, currentPeriodEnd),
      this.generateIncomeStatement(tenantId, previousYearStart, previousPeriodEnd)
    ]);

    return {
      balanceSheet: {
        current: currentBS,
        previous: previousBS,
        changes: this.calculateChanges(currentBS, previousBS)
      },
      incomeStatement: {
        current: currentIS,
        previous: previousIS,
        changes: this.calculateIncomeChanges(currentIS, previousIS)
      }
    };
  }

  /**
   * Get account balances for a specific account type
   */
  private static async getAccountBalances(
    tenantId: string,
    accountType: AccountType,
    asOfDate: Date
  ): Promise<AccountBalance[]> {
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        accountType,
        isActive: true,
        tenantId
      },
      orderBy: { accountCode: 'asc' }
    });

    const balances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await this.getAccountBalance(tenantId, account.id, asOfDate);
        return {
          accountId: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountNameEn: account.accountNameEn,
          balance: Math.abs(balance) // Use absolute value for presentation
        };
      })
    );

    return balances.filter(balance => balance.balance > 0);
  }

  /**
   * Get account balances for a period (for income statement)
   */
  private static async getAccountBalancesPeriod(
    tenantId: string,
    accountType: AccountType,
    startDate: Date,
    endDate: Date
  ): Promise<AccountBalance[]> {
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        accountType,
        isActive: true,
        tenantId
      },
      orderBy: { accountCode: 'asc' }
    });

    const balances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await this.getAccountBalancePeriod(tenantId, account.id, startDate, endDate);
        return {
          accountId: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountNameEn: account.accountNameEn,
          balance: Math.abs(balance)
        };
      })
    );

    return balances.filter(balance => balance.balance > 0);
  }

  /**
   * Get account balance as of a specific date
   */
  private static async getAccountBalance(tenantId: string, accountId: string, asOfDate: Date): Promise<number> {
    const result = await prisma.journalEntryLine.aggregate({
      where: {
        accountId,
        journalEntry: {
          status: 'POSTED',
          entryDate: {
            lte: asOfDate
          },
          tenantId
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    const totalDebits = Number(result._sum.debitAmount || 0);
    const totalCredits = Number(result._sum.creditAmount || 0);

    // Get account to determine normal balance
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) return 0;

    // Calculate balance based on normal balance type
    if (account.normalBalance === 'DEBIT') {
      return totalDebits - totalCredits;
    } else {
      return totalCredits - totalDebits;
    }
  }

  /**
   * Get account balance for a specific period
   */
  private static async getAccountBalancePeriod(
    tenantId: string,
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.journalEntryLine.aggregate({
      where: {
        accountId,
        journalEntry: {
          status: 'POSTED',
          entryDate: {
            gte: startDate,
            lte: endDate
          },
          tenantId
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    const totalDebits = Number(result._sum.debitAmount || 0);
    const totalCredits = Number(result._sum.creditAmount || 0);

    // For income statement accounts, we want the activity during the period
    return totalDebits + totalCredits;
  }

  /**
   * Get cash balance for specific accounts
   */
  private static async getCashBalance(tenantId: string, cashAccounts: any[], asOfDate: Date): Promise<number> {
    let totalCash = 0;
    
    for (const account of cashAccounts) {
      const balance = await this.getAccountBalance(tenantId, account.id, asOfDate);
      totalCash += balance;
    }
    
    return totalCash;
  }

  /**
   * Add percentage calculations to account balances
   */
  private static addPercentages(
    accounts: AccountBalance[],
    total: number
  ): AccountBalance[] {
    return accounts.map(account => ({
      ...account,
      percentage: total > 0 ? Number(((account.balance / total) * 100).toFixed(2)) : 0
    }));
  }

  /**
   * Cache financial statement data
   */
  private static async cacheFinancialStatement(
    tenantId: string,
    statementType: StatementType,
    endDate: Date,
    data: any,
    startDate?: Date
  ) {
    const fiscalYear = endDate.getFullYear();
    const period = startDate ? 
      `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}` :
      endDate.toISOString().split('T')[0];

    try {
      await prisma.financialStatement.upsert({
        where: {
          statementType_fiscalYear_period: {
            statementType,
            fiscalYear,
            period
          },
          tenantId
        },
        update: {
          data,
          generatedAt: new Date()
        },
        create: {
          tenantId,
          statementType,
          fiscalYear,
          period,
          startDate: startDate || endDate,
          endDate,
          data,
          generatedBy: 'system' // In real implementation, use actual user ID
        }
      });
    } catch (error) {
      console.error('Error caching financial statement:', error);
    }
  }

  /**
   * Calculate changes between balance sheets
   */
  private static calculateChanges(current: BalanceSheetData, previous: BalanceSheetData) {
    return {
      totalAssetsChange: current.assets.totalAssets - previous.assets.totalAssets,
      totalLiabilitiesChange: current.liabilities.totalLiabilities - previous.liabilities.totalLiabilities,
      totalEquityChange: current.equity.totalEquity - previous.equity.totalEquity
    };
  }

  /**
   * Calculate changes between income statements
   */
  private static calculateIncomeChanges(current: IncomeStatementData, previous: IncomeStatementData) {
    return {
      revenueChange: current.revenue.totalRevenue - previous.revenue.totalRevenue,
      expenseChange: current.expenses.totalExpenses - previous.expenses.totalExpenses,
      netIncomeChange: current.netIncome - previous.netIncome
    };
  }
}

export default FinancialStatementsService; 
