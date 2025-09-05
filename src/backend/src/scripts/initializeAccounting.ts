import { PrismaClient } from '../../../shared/generated/client';
import ChartOfAccountsService from '../services/chartOfAccountsService';

const prisma = new PrismaClient();

/**
 * Initialize Iranian Accounting System
 * راه‌اندازی سیستم حسابداری ایرانی
 */
async function initializeAccountingSystem(tenantId: string) {
  try {
    console.log('🚀 شروع راه‌اندازی سیستم حسابداری ایرانی...');
    console.log('🚀 Starting Iranian Accounting System initialization...');

    // Initialize Iranian Chart of Accounts
    console.log('📊 راه‌اندازی دفتر حساب‌های ایرانی...');
    await ChartOfAccountsService.initializeIranianChartOfAccounts(tenantId);
    console.log('✅ دفتر حساب‌های ایرانی با موفقیت راه‌اندازی شد');

    // Get account hierarchy to verify
    console.log('🔍 بررسی ساختار حساب‌ها...');
    const hierarchy = await ChartOfAccountsService.getAccountHierarchy(tenantId);
    console.log(`✅ ${hierarchy.length} حساب اصلی ایجاد شد`);

    // Display account summary
    console.log('\n📋 خلاصه حساب‌های ایجاد شده:');
    console.log('='.repeat(50));
    
    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    for (const accountType of accountTypes) {
      const accounts = await ChartOfAccountsService.getAccountsByType(tenantId, accountType as any);
      const typeName = getAccountTypeName(accountType);
      console.log(`${typeName}: ${accounts.length} حساب`);
    }

    console.log('\n🎉 سیستم حسابداری ایرانی با موفقیت راه‌اندازی شد!');
    console.log('🎉 Iranian Accounting System initialized successfully!');

  } catch (error) {
    console.error('❌ خطا در راه‌اندازی سیستم حسابداری:', error);
    console.error('❌ Error initializing accounting system:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getAccountTypeName(accountType: string): string {
  const typeNames: { [key: string]: string } = {
    'ASSET': 'دارایی‌ها',
    'LIABILITY': 'بدهی‌ها', 
    'EQUITY': 'حقوق صاحبان سهام',
    'REVENUE': 'درآمدها',
    'EXPENSE': 'هزینه‌ها'
  };
  return typeNames[accountType] || accountType;
}

// Run the initialization
if (require.main === module) {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('❌ Tenant ID is required. Usage: npm run init:accounting <tenantId>');
    console.error('❌ Example: npm run init:accounting "tenant-123"');
    process.exit(1);
  }
  initializeAccountingSystem(tenantId);
}

export default initializeAccountingSystem; 
