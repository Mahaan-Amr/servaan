const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testReport = {
  name: 'گزارش تست موجودی',
  description: 'گزارش تستی برای بررسی عملکرد سیستم گزارش‌سازی',
  reportType: 'TABULAR',
  dataSources: ['items', 'inventory_entries'],
  columnsConfig: [
    {
      id: 'item_name',
      name: 'item.name',
      type: 'text',
      table: 'items',
      label: 'نام کالا'
    },
    {
      id: 'item_category',
      name: 'item.category',
      type: 'text',
      table: 'items',
      label: 'دسته‌بندی'
    },
    {
      id: 'current_stock',
      name: 'current_stock',
      type: 'number',
      table: 'calculated',
      label: 'موجودی فعلی'
    }
  ],
  filtersConfig: [
    {
      id: 'filter1',
      field: 'item_category',
      operator: 'equals',
      value: 'نوشیدنی',
      label: 'فیلتر دسته‌بندی'
    }
  ],
  sortingConfig: [
    {
      field: 'item_name',
      direction: 'asc'
    }
  ],
  chartConfig: {},
  layoutConfig: {},
  isPublic: false,
  tags: ['تست', 'موجودی']
};

async function testCustomReports() {
  try {
    console.log('🧪 شروع تست سیستم گزارش‌سازی سفارشی...\n');

    // First, we need to authenticate
    console.log('1️⃣ احراز هویت...');
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@servaan.com',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ احراز هویت موفق\n');

    // Test 1: Get available fields
    console.log('2️⃣ دریافت فیلدهای موجود...');
    const fieldsResponse = await axios.get(`${BASE_URL}/bi/reports/fields/available`, { headers });
    console.log(`✅ ${fieldsResponse.data.data.length} فیلد موجود دریافت شد\n`);

    // Test 2: Create a custom report
    console.log('3️⃣ ایجاد گزارش سفارشی...');
    const createResponse = await axios.post(`${BASE_URL}/bi/reports`, testReport, { headers });
    const reportId = createResponse.data.data.id;
    console.log(`✅ گزارش با ID ${reportId} ایجاد شد\n`);

    // Test 3: Get reports list
    console.log('4️⃣ دریافت لیست گزارش‌ها...');
    const listResponse = await axios.get(`${BASE_URL}/bi/reports?page=1&limit=10`, { headers });
    console.log(`✅ ${listResponse.data.data.reports.length} گزارش دریافت شد\n`);

    // Test 4: Get report by ID
    console.log('5️⃣ دریافت گزارش بر اساس ID...');
    const getResponse = await axios.get(`${BASE_URL}/bi/reports/${reportId}`, { headers });
    console.log(`✅ گزارش "${getResponse.data.data.name}" دریافت شد\n`);

    // Test 5: Execute report
    console.log('6️⃣ اجرای گزارش...');
    const executeResponse = await axios.post(`${BASE_URL}/bi/reports/${reportId}/execute`, {
      parameters: {},
      exportFormat: 'VIEW'
    }, { headers });
    console.log(`✅ گزارش اجرا شد - ${executeResponse.data.data.resultCount} رکورد\n`);

    // Test 6: Get execution history
    console.log('7️⃣ دریافت تاریخچه اجرا...');
    const historyResponse = await axios.get(`${BASE_URL}/bi/reports/${reportId}/executions`, { headers });
    console.log(`✅ ${historyResponse.data.data.executions.length} اجرا در تاریخچه\n`);

    // Test 7: Update report
    console.log('8️⃣ بروزرسانی گزارش...');
    const updateResponse = await axios.put(`${BASE_URL}/bi/reports/${reportId}`, {
      name: 'گزارش تست موجودی - بروزرسانی شده',
      description: 'گزارش بروزرسانی شده'
    }, { headers });
    console.log(`✅ گزارش بروزرسانی شد\n`);

    // Test 8: Get popular reports
    console.log('9️⃣ دریافت گزارش‌های محبوب...');
    const popularResponse = await axios.get(`${BASE_URL}/bi/reports/popular/list?limit=5`, { headers });
    console.log(`✅ ${popularResponse.data.data.length} گزارش محبوب دریافت شد\n`);

    // Test 9: Search reports
    console.log('🔟 جستجوی گزارش‌ها...');
    const searchResponse = await axios.post(`${BASE_URL}/bi/reports/search/advanced`, {
      searchTerm: 'تست',
      filters: {
        reportType: 'TABULAR'
      }
    }, { headers });
    console.log(`✅ ${searchResponse.data.data.length} گزارش در نتایج جستجو\n`);

    // Test 10: Delete report
    console.log('🗑️ حذف گزارش تست...');
    await axios.delete(`${BASE_URL}/bi/reports/${reportId}`, { headers });
    console.log(`✅ گزارش حذف شد\n`);

    console.log('🎉 تمام تست‌ها با موفقیت انجام شدند!');
    console.log('\n📊 خلاصه نتایج:');
    console.log('✅ ایجاد گزارش سفارشی');
    console.log('✅ دریافت لیست گزارش‌ها');
    console.log('✅ دریافت گزارش بر اساس ID');
    console.log('✅ اجرای گزارش و تولید نتایج');
    console.log('✅ دریافت تاریخچه اجرا');
    console.log('✅ بروزرسانی گزارش');
    console.log('✅ دریافت گزارش‌های محبوب');
    console.log('✅ جستجوی پیشرفته');
    console.log('✅ حذف گزارش');
    console.log('\n🚀 سیستم گزارش‌سازی سفارشی آماده استفاده است!');

  } catch (error) {
    console.error('❌ خطا در تست:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 راهنمایی: ابتدا یک کاربر ادمین در سیستم ایجاد کنید');
    } else if (error.response?.status === 500) {
      console.log('\n💡 راهنمایی: مطمئن شوید که سرور backend و دیتابیس در حال اجرا هستند');
    }
  }
}

// Run the test
testCustomReports(); 