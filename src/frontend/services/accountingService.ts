import { getToken } from './authService';
import { API_URL } from '../lib/apiUtils';
import { formatCurrency } from '../../shared/utils/currencyUtils';

// ==========================================
// INTERFACES
// ==========================================

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountNameEn?: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentAccountId?: string;
  level: number;
  normalBalance: 'DEBIT' | 'CREDIT';
  isActive: boolean;
  isSystemAccount: boolean;
  description?: string;
  children?: ChartOfAccount[];
  balance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  sourceType?: 'MANUAL' | 'POS' | 'INVENTORY' | 'PAYROLL' | 'SYSTEM' | 'BANK' | 'PURCHASE';
  sourceId?: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: string;
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  reversedBy?: string;
  reversedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  reversedAt?: string;
  reversalReason?: string;
  lines: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  account?: ChartOfAccount;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  lineNumber: number;
  costCenterId?: string;
  costCenter?: {
    id: string;
    code: string;
    name: string;
  };
  projectCode?: string;
  createdAt: string;
}

export interface CreateJournalEntryData {
  entryDate: string;
  description: string;
  reference?: string;
  lines: {
    accountId: string;
    description?: string;
    debitAmount: number;
    creditAmount: number;
    costCenterId?: string;
    projectCode?: string;
  }[];
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameEn?: string;
  balance: number;
  percentage?: number;
}

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

export interface FinancialRatios {
  liquidityRatios: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  profitabilityRatios: {
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  leverageRatios: {
    debtToAssets: number;
    debtToEquity: number;
    equityRatio: number;
  };
  activityRatios: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
  };
}

export interface TrialBalance {
  accounts: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    debitBalance: number;
    creditBalance: number;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  asOfDate: string;
}

export interface ComparativeStatements {
  currentPeriod: {
    balanceSheet: BalanceSheetData;
    incomeStatement: IncomeStatementData;
    endDate: string;
  };
  previousPeriod: {
    balanceSheet: BalanceSheetData;
    incomeStatement: IncomeStatementData;
    endDate: string;
  };
  variance: {
    balanceSheet: Record<string, number>;
    incomeStatement: Record<string, number>;
  };
}

// ==========================================
// ACCOUNTING SERVICE
// ==========================================

export class AccountingService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    const response = await fetch(`${API_URL}/accounting${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Extract data from the API response structure
    if (result.success && result.data !== undefined) {
      return result.data;
    }
    
    // For endpoints that don't return data (like initialize)
    if (result.success) {
      return result as T;
    }
    
    return result;
  }

  // ==========================================
  // CHART OF ACCOUNTS
  // ==========================================

  static async initializeChartOfAccounts(): Promise<void> {
    await this.makeRequest('/chart-of-accounts/initialize', {
      method: 'POST',
    });
  }

  static async getAccountHierarchy(accountType?: string): Promise<ChartOfAccount[]> {
    const params = new URLSearchParams();
    if (accountType) params.append('accountType', accountType);
    
    return this.makeRequest(`/chart-of-accounts/hierarchy?${params}`);
  }

  static async createAccount(accountData: {
    accountCode: string;
    accountName: string;
    accountNameEn?: string;
    accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parentAccountId?: string;
    normalBalance: 'DEBIT' | 'CREDIT';
    description?: string;
  }): Promise<ChartOfAccount> {
    return this.makeRequest('/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  static async updateAccount(accountId: string, accountData: {
    accountCode?: string;
    accountName?: string;
    accountNameEn?: string;
    accountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parentAccountId?: string;
    normalBalance?: 'DEBIT' | 'CREDIT';
    description?: string;
  }): Promise<ChartOfAccount> {
    return this.makeRequest(`/chart-of-accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
  }

  static async getAccountById(accountId: string): Promise<ChartOfAccount> {
    return this.makeRequest(`/chart-of-accounts/${accountId}`);
  }

  static async searchAccounts(query: string, accountType?: string): Promise<ChartOfAccount[]> {
    const params = new URLSearchParams({ query });
    if (accountType) params.append('accountType', accountType);
    
    return this.makeRequest(`/chart-of-accounts/search?${params}`);
  }

  static async getAccountBalance(accountId: string, asOfDate?: string): Promise<{ balance: number }> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    
    return this.makeRequest(`/chart-of-accounts/${accountId}/balance?${params}`);
  }

  // ==========================================
  // JOURNAL ENTRIES
  // ==========================================

  static async createJournalEntry(entryData: CreateJournalEntryData): Promise<JournalEntry> {
    return this.makeRequest('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  static async getJournalEntries(params: {
    startDate?: string;
    endDate?: string;
    status?: 'DRAFT' | 'POSTED' | 'REVERSED';
    sourceType?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    entries: JournalEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/journal-entries?${searchParams}`);
  }

  static async getJournalEntryById(id: string): Promise<JournalEntry> {
    return this.makeRequest(`/journal-entries/${id}`);
  }

  static async postJournalEntry(id: string): Promise<JournalEntry> {
    return this.makeRequest(`/journal-entries/${id}/post`, {
      method: 'PUT',
    });
  }

  static async reverseJournalEntry(id: string, reason: string): Promise<JournalEntry> {
    return this.makeRequest(`/journal-entries/${id}/reverse`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  static async updateJournalEntry(id: string, entryData: Partial<CreateJournalEntryData>): Promise<JournalEntry> {
    return this.makeRequest(`/journal-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  static async deleteJournalEntry(id: string): Promise<void> {
    await this.makeRequest(`/journal-entries/${id}`, {
      method: 'DELETE',
    });
  }

  static async getTrialBalance(asOfDate?: string): Promise<TrialBalance> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    
    return this.makeRequest(`/trial-balance?${params}`);
  }

  // ==========================================
  // FINANCIAL STATEMENTS
  // ==========================================

  static async generateBalanceSheet(asOfDate?: string): Promise<BalanceSheetData> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    
    return this.makeRequest(`/financial-statements/balance-sheet?${params}`);
  }

  static async generateIncomeStatement(startDate: string, endDate: string): Promise<IncomeStatementData> {
    const params = new URLSearchParams({ startDate, endDate });
    return this.makeRequest(`/financial-statements/income-statement?${params}`);
  }

  static async generateCashFlowStatement(startDate: string, endDate: string): Promise<CashFlowData> {
    const params = new URLSearchParams({ startDate, endDate });
    return this.makeRequest(`/financial-statements/cash-flow?${params}`);
  }

  static async getFinancialRatios(asOfDate?: string): Promise<FinancialRatios> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    
    return this.makeRequest(`/financial-statements/ratios?${params}`);
  }

  static async getComparativeStatements(
    currentPeriodEnd: string,
    previousPeriodEnd: string
  ): Promise<ComparativeStatements> {
    const params = new URLSearchParams({
      currentPeriodEnd,
      previousPeriodEnd,
    });
    
    return this.makeRequest(`/financial-statements/comparative?${params}`);
  }

  // ==========================================
  // COST CENTERS
  // ==========================================

  static async getCostCenters(): Promise<Array<{
    id: string;
    code: string;
    name: string;
    nameEn?: string;
    description?: string;
    budgetAllocated: number;
  }>> {
    return this.makeRequest('/cost-centers');
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  static formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  static formatNumber(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('fa-IR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }

  static getAccountTypeLabel(accountType: string): string {
    const labels = {
      ASSET: 'دارایی‌ها',
      LIABILITY: 'بدهی‌ها',
      EQUITY: 'حقوق صاحبان سهام',
      REVENUE: 'درآمدها',
      EXPENSE: 'هزینه‌ها',
    };
    return labels[accountType as keyof typeof labels] || accountType;
  }

  static getJournalStatusLabel(status: string): string {
    const labels = {
      DRAFT: 'پیش‌نویس',
      POSTED: 'ثبت شده',
      REVERSED: 'ابطال شده',
    };
    return labels[status as keyof typeof labels] || status;
  }

  static getJournalStatusColor(status: string): string {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      POSTED: 'bg-green-100 text-green-800',
      REVERSED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }
}

export const getAccountingSummary = async () => {
  const token = getToken(); // Use getToken() for consistency
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/accounting/summary`, {
    headers
  });
  return res.json();
}; 