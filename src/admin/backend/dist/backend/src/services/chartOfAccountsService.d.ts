import { AccountType, BalanceType } from '../../../shared/generated/client';
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
export declare class ChartOfAccountsService {
    /**
     * Initialize Iranian Chart of Accounts
     * راه‌اندازی دفتر حساب‌های استاندارد ایرانی
     */
    static initializeIranianChartOfAccounts(tenantId: string): Promise<void>;
    /**
     * Create a new account
     * ایجاد حساب جدید
     */
    static createAccount(data: ChartOfAccountData): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    }>;
    /**
     * Get account hierarchy
     * دریافت ساختار درختی حساب‌ها
     */
    static getAccountHierarchy(tenantId: string, accountType?: AccountType): Promise<AccountHierarchy[]>;
    /**
     * Get account by code
     * دریافت حساب با کد
     */
    static getAccountByCode(tenantId: string, accountCode: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    } | null>;
    /**
     * Get account by ID
     * دریافت حساب با شناسه
     */
    static getAccountById(tenantId: string, id: string): Promise<({
        parentAccount: {
            id: string;
            accountCode: string;
            accountName: string;
            accountType: import("../../../shared/generated/client").$Enums.AccountType;
        } | null;
        childAccounts: {
            id: string;
            accountCode: string;
            accountName: string;
            accountType: import("../../../shared/generated/client").$Enums.AccountType;
            level: number;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    }) | null>;
    /**
     * Get account balance
     * دریافت مانده حساب
     */
    static getAccountBalance(tenantId: string, accountId: string, asOfDate?: Date): Promise<number>;
    /**
     * Search accounts
     * جستجوی حساب‌ها
     */
    static searchAccounts(tenantId: string, query: string, accountType?: AccountType): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    }[]>;
    /**
     * Update account
     * بروزرسانی حساب
     */
    static updateAccount(tenantId: string, id: string, data: Partial<ChartOfAccountData>): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    }>;
    /**
     * Deactivate account (soft delete)
     * غیرفعال کردن حساب
     */
    static deactivateAccount(tenantId: string, id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    }>;
    /**
     * Get accounts by type
     * دریافت حساب‌ها بر اساس نوع
     */
    static getAccountsByType(tenantId: string, accountType: AccountType): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        accountCode: string;
        accountName: string;
        accountNameEn: string | null;
        accountType: import("../../../shared/generated/client").$Enums.AccountType;
        level: number;
        normalBalance: import("../../../shared/generated/client").$Enums.BalanceType;
        isSystemAccount: boolean;
        parentAccountId: string | null;
    }[]>;
    /**
     * Validate presence of required baseline accounts for integrations
     * گزارش حساب‌های ضروری که در هر مستاجر باید وجود داشته باشد
     */
    static validateRequiredAccounts(tenantId: string): Promise<{
        requiredCodes: string[];
        missing: {
            code: string;
            description: string;
        }[];
        present: string[];
    }>;
    /**
     * Build hierarchy from flat array
     * ساخت ساختار درختی از آرایه تخت
     */
    private static buildHierarchy;
    /**
     * Standard Iranian Chart of Accounts
     * دفتر حساب‌های استاندارد ایرانی
     */
    private static getStandardIranianAccounts;
}
export default ChartOfAccountsService;
//# sourceMappingURL=chartOfAccountsService.d.ts.map