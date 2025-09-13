import { Request, Response } from 'express';
import ChartOfAccountsService from '../services/chartOfAccountsService';
import JournalEntryService from '../services/journalEntryService';
import FinancialStatementsService from '../services/financialStatementsService';
import { AccountType, JournalStatus, SourceType } from '../../../shared/generated/client';
import { prisma } from '../services/dbService';

/**
 * Accounting Controller
 * کنترلر سیستم حسابداری
 */
export class AccountingController {

  // ==========================================
  // CHART OF ACCOUNTS ENDPOINTS
  // ==========================================

  /**
   * Initialize Iranian Chart of Accounts
   * راه‌اندازی دفتر حساب‌های ایرانی
   */
  static async initializeChartOfAccounts(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      await ChartOfAccountsService.initializeIranianChartOfAccounts(req.tenant.id);
      
      res.status(200).json({
        success: true,
        message: 'دفتر حساب‌های ایرانی با موفقیت راه‌اندازی شد',
        messageEn: 'Iranian Chart of Accounts initialized successfully'
      });
    } catch (error: any) {
      console.error('Error initializing chart of accounts:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در راه‌اندازی دفتر حساب‌ها',
        messageEn: 'Error initializing chart of accounts',
        error: error.message
      });
    }
  }

  /**
   * Get account hierarchy
   * دریافت ساختار درختی حساب‌ها
   */
  static async getAccountHierarchy(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const { accountType } = req.query;
      
      const hierarchy = await ChartOfAccountsService.getAccountHierarchy(
        req.tenant.id,
        accountType as AccountType
      );
      
      res.status(200).json({
        success: true,
        data: hierarchy
      });
    } catch (error: any) {
      console.error('Error getting account hierarchy:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت ساختار حساب‌ها',
        messageEn: 'Error getting account hierarchy',
        error: error.message
      });
    }
  }

  /**
   * Create new account
   * ایجاد حساب جدید
   */
  static async createAccount(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const accountData = {
        ...req.body,
        tenantId: req.tenant.id
      };
      
      const account = await ChartOfAccountsService.createAccount(accountData);
      
      res.status(201).json({
        success: true,
        message: 'حساب جدید با موفقیت ایجاد شد',
        messageEn: 'Account created successfully',
        data: account
      });
    } catch (error: any) {
      console.error('Error creating account:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد حساب',
        messageEn: 'Error creating account',
        error: error.message
      });
    }
  }

  /**
   * Search accounts
   * جستجوی حساب‌ها
   */
  static async searchAccounts(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const { query, accountType } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'پارامتر جستجو الزامی است',
          messageEn: 'Search query is required'
        });
      }
      
      const accounts = await ChartOfAccountsService.searchAccounts(
        req.tenant.id,
        query as string,
        accountType as AccountType
      );
      
      res.status(200).json({
        success: true,
        data: accounts
      });
    } catch (error: any) {
      console.error('Error searching accounts:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در جستجوی حساب‌ها',
        messageEn: 'Error searching accounts',
        error: error.message
      });
    }
  }

  /**
   * Get account balance
   * دریافت مانده حساب
   */
  static async getAccountBalance(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const { accountId } = req.params;
      const { asOfDate } = req.query;
      
      const balance = await ChartOfAccountsService.getAccountBalance(
        req.tenant.id,
        accountId,
        asOfDate ? new Date(asOfDate as string) : undefined
      );
      
      res.status(200).json({
        success: true,
        data: { balance }
      });
    } catch (error: any) {
      console.error('Error getting account balance:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت مانده حساب',
        messageEn: 'Error getting account balance',
        error: error.message
      });
    }
  }

  /**
   * Get single account by ID
   * دریافت حساب با شناسه
   */
  static async getAccountById(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const { id } = req.params;
      
      const account = await ChartOfAccountsService.getAccountById(req.tenant.id, id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'حساب یافت نشد',
          messageEn: 'Account not found'
        });
      }
      
      // Get account balance
      const balance = await ChartOfAccountsService.getAccountBalance(req.tenant.id, id);
      
      res.status(200).json({
        success: true,
        data: {
          ...account,
          balance
        }
      });
    } catch (error: any) {
      console.error('Error getting account:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت حساب',
        messageEn: 'Error getting account',
        error: error.message
      });
    }
  }

  /**
   * Update account
   * بروزرسانی حساب
   */
  static async updateAccount(req: Request, res: Response) {
    try {
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if account exists
      const existingAccount = await ChartOfAccountsService.getAccountById(req.tenant.id, id);
      if (!existingAccount) {
        return res.status(400).json({
          success: false,
          message: 'حساب یافت نشد',
          messageEn: 'Account not found'
        });
      }
      
      // Update the account
      const updatedAccount = await ChartOfAccountsService.updateAccount(req.tenant.id, id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'حساب با موفقیت بروزرسانی شد',
        messageEn: 'Account updated successfully',
        data: updatedAccount
      });
    } catch (error: any) {
      console.error('Error updating account:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی حساب',
        messageEn: 'Error updating account',
        error: error.message
      });
    }
  }

  // ==========================================
  // JOURNAL ENTRIES ENDPOINTS
  // ==========================================

  /**
   * Create journal entry
   * ایجاد سند حسابداری
   */
  static async createJournalEntry(req: Request, res: Response) {
    try {
      const journalData = req.body;
      const userId = req.user?.id;
      
      console.log('Received journal entry data:', JSON.stringify(journalData, null, 2));
      console.log('User ID:', userId);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }
      
      // Convert entryDate string to Date object
      const processedJournalData = {
        ...journalData,
        entryDate: new Date(journalData.entryDate)
      };
      
      console.log('Processed journal entry data:', JSON.stringify(processedJournalData, null, 2));
      console.log('Entry date converted:', processedJournalData.entryDate);
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const journalEntry = await JournalEntryService.createJournalEntry(
        processedJournalData,
        userId,
        req.tenant.id
      );
      
      console.log('Journal entry created successfully:', journalEntry.id);
      
      res.status(201).json({
        success: true,
        message: 'سند حسابداری با موفقیت ایجاد شد',
        messageEn: 'Journal entry created successfully',
        data: journalEntry
      });
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد سند حسابداری',
        messageEn: 'Error creating journal entry',
        error: error.message
      });
    }
  }

  /**
   * Get journal entries
   * دریافت اسناد حسابداری
   */
  static async getJournalEntries(req: Request, res: Response) {
    try {
      const {
        startDate,
        endDate,
        accountId,
        status,
        sourceType,
        costCenterId,
        search,
        page = 1,
        limit = 50
      } = req.query;
      
      const filter: any = {};
      if (startDate) filter.startDate = new Date(startDate as string);
      if (endDate) filter.endDate = new Date(endDate as string);
      if (accountId) filter.accountId = accountId as string;
      if (status) filter.status = status as JournalStatus;
      if (sourceType) filter.sourceType = sourceType as SourceType;
      if (costCenterId) filter.costCenterId = costCenterId as string;
      if (search) filter.search = search as string;
      
      const result = await JournalEntryService.getJournalEntries(
        filter,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error getting journal entries:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت اسناد حسابداری',
        messageEn: 'Error getting journal entries',
        error: error.message
      });
    }
  }

  /**
   * Get journal entry by ID
   * دریافت سند حسابداری با شناسه
   */
  static async getJournalEntryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const journalEntry = await JournalEntryService.getJournalEntryById(id);
      
      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          message: 'سند حسابداری یافت نشد',
          messageEn: 'Journal entry not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: journalEntry
      });
    } catch (error: any) {
      console.error('Error getting journal entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت سند حسابداری',
        messageEn: 'Error getting journal entry',
        error: error.message
      });
    }
  }

  /**
   * Post journal entry
   * تصویب سند حسابداری
   */
  static async postJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }
      
      const journalEntry = await JournalEntryService.postJournalEntry(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'سند حسابداری با موفقیت تصویب شد',
        messageEn: 'Journal entry posted successfully',
        data: journalEntry
      });
    } catch (error: any) {
      console.error('Error posting journal entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تصویب سند حسابداری',
        messageEn: 'Error posting journal entry',
        error: error.message
      });
    }
  }

  /**
   * Reverse journal entry
   * ابطال سند حسابداری
   */
  static async reverseJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reversalReason } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }
      
      if (!reversalReason) {
        return res.status(400).json({
          success: false,
          message: 'دلیل ابطال الزامی است',
          messageEn: 'Reversal reason is required'
        });
      }
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }
      
      const reversalEntry = await JournalEntryService.reverseJournalEntry(
        id,
        userId,
        reversalReason,
        req.tenant.id
      );
      
      res.status(200).json({
        success: true,
        message: 'سند حسابداری با موفقیت ابطال شد',
        messageEn: 'Journal entry reversed successfully',
        data: reversalEntry
      });
    } catch (error: any) {
      console.error('Error reversing journal entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ابطال سند حسابداری',
        messageEn: 'Error reversing journal entry',
        error: error.message
      });
    }
  }

  /**
   * Update journal entry
   * بروزرسانی سند حسابداری
   */
  static async updateJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }

      const updatedEntry = await JournalEntryService.updateJournalEntry(id, updateData);
      res.status(200).json({
        success: true,
        message: 'سند حسابداری با موفقیت بروزرسانی شد',
        messageEn: 'Journal entry updated successfully',
        data: updatedEntry
      });
    } catch (error: any) {
      console.error('Error updating journal entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی سند حسابداری',
        messageEn: 'Error updating journal entry',
        error: error.message
      });
    }
  }

  /**
   * Delete journal entry
   * حذف سند حسابداری
   */
  static async deleteJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }

      await JournalEntryService.deleteJournalEntry(id);
      res.status(200).json({
        success: true,
        message: 'سند حسابداری با موفقیت حذف شد',
        messageEn: 'Journal entry deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting journal entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در حذف سند حسابداری',
        messageEn: 'Error deleting journal entry',
        error: error.message
      });
    }
  }

  /**
   * Get trial balance
   * دریافت ترازآزمایشی
   */
  static async getTrialBalance(req: Request, res: Response) {
    try {
      const { asOfDate } = req.query;
      
      const trialBalance = await JournalEntryService.getTrialBalance(
        asOfDate ? new Date(asOfDate as string) : undefined
      );
      
      res.status(200).json({
        success: true,
        data: trialBalance
      });
    } catch (error: any) {
      console.error('Error getting trial balance:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت ترازآزمایشی',
        messageEn: 'Error getting trial balance',
        error: error.message
      });
    }
  }

  // ==========================================
  // FINANCIAL STATEMENTS ENDPOINTS
  // ==========================================

  /**
   * Generate balance sheet
   * تولید ترازنامه
   */
  static async generateBalanceSheet(req: Request, res: Response) {
    try {
      const { asOfDate } = req.query;
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const balanceSheet = await FinancialStatementsService.generateBalanceSheet(
        req.tenant.id,
        asOfDate ? new Date(asOfDate as string) : new Date()
      );
      
      res.status(200).json({
        success: true,
        data: balanceSheet
      });
    } catch (error: any) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تولید ترازنامه',
        messageEn: 'Error generating balance sheet',
        error: error.message
      });
    }
  }

  /**
   * Generate income statement
   * تولید صورت سود و زیان
   */
  static async generateIncomeStatement(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'تاریخ شروع و پایان الزامی است',
          messageEn: 'Start date and end date are required'
        });
      }
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const incomeStatement = await FinancialStatementsService.generateIncomeStatement(
        req.tenant.id,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.status(200).json({
        success: true,
        data: incomeStatement
      });
    } catch (error: any) {
      console.error('Error generating income statement:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تولید صورت سود و زیان',
        messageEn: 'Error generating income statement',
        error: error.message
      });
    }
  }

  /**
   * Generate cash flow statement
   * تولید صورت جریان وجه نقد
   */
  static async generateCashFlowStatement(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'تاریخ شروع و پایان الزامی است',
          messageEn: 'Start date and end date are required'
        });
      }
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const cashFlowStatement = await FinancialStatementsService.generateCashFlowStatement(
        req.tenant.id,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.status(200).json({
        success: true,
        data: cashFlowStatement
      });
    } catch (error: any) {
      console.error('Error generating cash flow statement:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تولید صورت جریان وجه نقد',
        messageEn: 'Error generating cash flow statement',
        error: error.message
      });
    }
  }

  /**
   * Get financial ratios
   * دریافت نسبت‌های مالی
   */
  static async getFinancialRatios(req: Request, res: Response) {
    try {
      const { asOfDate } = req.query;
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const ratios = await FinancialStatementsService.getFinancialRatios(
        req.tenant.id,
        asOfDate ? new Date(asOfDate as string) : new Date()
      );
      
      res.status(200).json({
        success: true,
        data: ratios
      });
    } catch (error: any) {
      console.error('Error getting financial ratios:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت نسبت‌های مالی',
        messageEn: 'Error getting financial ratios',
        error: error.message
      });
    }
  }

  /**
   * Get comparative statements
   * دریافت صورت‌های مالی تطبیقی
   */
  static async getComparativeStatements(req: Request, res: Response) {
    try {
      const { currentPeriodEnd, previousPeriodEnd } = req.query;
      
      if (!currentPeriodEnd || !previousPeriodEnd) {
        return res.status(400).json({
          success: false,
          message: 'تاریخ دوره جاری و قبلی الزامی است',
          messageEn: 'Current and previous period end dates are required'
        });
      }
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const comparativeStatements = await FinancialStatementsService.getComparativeStatements(
        req.tenant.id,
        new Date(currentPeriodEnd as string),
        new Date(previousPeriodEnd as string)
      );
      
      res.status(200).json({
        success: true,
        data: comparativeStatements
      });
    } catch (error: any) {
      console.error('Error getting comparative statements:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت صورت‌های مالی تطبیقی',
        messageEn: 'Error getting comparative statements',
        error: error.message
      });
    }
  }

  // ==========================================
  // AUTOMATIC JOURNAL ENTRIES
  // ==========================================

  /**
   * Generate sales journal entry
   * تولید سند حسابداری فروش
   */
  static async generateSalesEntry(req: Request, res: Response) {
    try {
      const saleData = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const journalEntry = await JournalEntryService.generateSalesEntry(
        saleData,
        userId,
        req.tenant.id
      );
      
      res.status(201).json({
        success: true,
        message: 'سند حسابداری فروش با موفقیت تولید شد',
        messageEn: 'Sales journal entry generated successfully',
        data: journalEntry
      });
    } catch (error: any) {
      console.error('Error generating sales entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تولید سند حسابداری فروش',
        messageEn: 'Error generating sales journal entry',
        error: error.message
      });
    }
  }

  /**
   * Generate purchase journal entry
   * تولید سند حسابداری خرید
   */
  static async generatePurchaseEntry(req: Request, res: Response) {
    try {
      const purchaseData = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده',
          messageEn: 'User not authenticated'
        });
      }
      
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required',
          messageEn: 'Tenant context required'
        });
      }

      const journalEntry = await JournalEntryService.generatePurchaseEntry(
        purchaseData,
        userId,
        req.tenant.id
      );
      
      res.status(201).json({
        success: true,
        message: 'سند حسابداری خرید با موفقیت تولید شد',
        messageEn: 'Purchase journal entry generated successfully',
        data: journalEntry
      });
    } catch (error: any) {
      console.error('Error generating purchase entry:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تولید سند حسابداری خرید',
        messageEn: 'Error generating purchase entry',
        error: error.message
      });
    }
  }

  /**
   * Get cost centers
   * دریافت مراکز هزینه
   */
  static async getCostCenters(req: Request, res: Response) {
    try {
      const costCenters = await prisma.costCenter.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          nameEn: true,
          description: true,
          budgetAllocated: true
        },
        orderBy: { code: 'asc' }
      });
      
      res.status(200).json({
        success: true,
        data: costCenters
      });
    } catch (error: any) {
      console.error('Error getting cost centers:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت مراکز هزینه',
        messageEn: 'Error getting cost centers',
        error: error.message
      });
    }
  }

  /**
   * Get accounting dashboard summary
   * دریافت خلاصه داشبورد حسابداری
   */
  static async getSummary(req: Request, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      // Total accounts
      const totalAccounts = await prisma.chartOfAccount.count({
        where: { isActive: true }
      });
      // Monthly entries
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyEntries = await prisma.journalEntry.count({
        where: {
          createdByUser: { tenantId },
          entryDate: { gte: monthStart }
        }
      });
      // Current balance (sum of all posted entries)
      const postedEntries = await prisma.journalEntry.findMany({
        where: {
          createdByUser: { tenantId },
          status: 'POSTED'
        },
        include: { lines: true }
      });
      let totalDebit = 0;
      let totalCredit = 0;
      postedEntries.forEach(entry => {
        entry.lines.forEach(line => {
          totalDebit += Number(line.debitAmount) || 0;
          totalCredit += Number(line.creditAmount) || 0;
        });
      });
      const currentBalance = totalDebit - totalCredit;
      // Pending entries (draft)
      const pendingEntries = await prisma.journalEntry.count({
        where: {
          createdByUser: { tenantId },
          status: 'DRAFT'
        }
      });
      // Recent entries (last 5, posted or draft)
      const recentEntries = await prisma.journalEntry.findMany({
        where: {
          createdByUser: { tenantId }
        },
        orderBy: { entryDate: 'desc' },
        take: 5,
        include: {
          lines: {
            include: { account: true }
          }
        }
      });
      res.json({
        success: true,
        data: {
          totalAccounts,
          monthlyEntries,
          currentBalance,
          pendingEntries,
          recentEntries: recentEntries.map(entry => ({
            id: entry.id,
            date: entry.entryDate,
            description: entry.description,
            amount: entry.lines.reduce((sum, l) => sum + Number(l.debitAmount || 0) + Number(l.creditAmount || 0), 0),
            type: entry.lines.some(l => (typeof l.creditAmount === 'object' && 'toNumber' in l.creditAmount ? l.creditAmount.toNumber() : l.creditAmount) > 0) ? 'credit' : 'debit',
            account: entry.lines[0]?.account?.accountName || ''
          }))
        }
      });
    } catch (error) {
      console.error('Error getting accounting summary:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت خلاصه داشبورد حسابداری',
        error: error instanceof Error ? error.message : error
      });
    }
  }
}

export default AccountingController; 
