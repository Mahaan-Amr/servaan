// Simple test for PDF generation
const { generateEnhancedInventoryPDF } = require('./utils/pdfGenerator');

const testData = {
  summary: {
    totalItems: 32,
    lowStockCount: 23,
    recentTransactions: 1294,
    totalInventoryValue: 12932373
  },
  categoryData: [
    { name: 'مواد اولیه', value: 35, color: '#8884d8' },
    { name: 'محصولات نهایی', value: 25, color: '#82ca9d' },
    { name: 'بسته‌بندی', value: 20, color: '#ffc658' },
    { name: 'لوازم جانبی', value: 15, color: '#ff7300' },
    { name: 'سایر', value: 5, color: '#ff0000' }
  ],
  trendData: [
    { date: 'امروز', stock: 150, totalIn: 25, totalOut: 15 },
    { date: 'دیروز', stock: 140, totalIn: 30, totalOut: 20 },
    { date: '۲ روز پیش', stock: 130, totalIn: 20, totalOut: 25 },
    { date: '۳ روز پیش', stock: 135, totalIn: 35, totalOut: 10 },
    { date: '۴ روز پیش', stock: 110, totalIn: 40, totalOut: 35 }
  ],
  monthlyData: [
    { month: 'فروردین', monthKey: '01', in: 120, out: 80, net: 40 },
    { month: 'اردیبهشت', monthKey: '02', in: 150, out: 100, net: 50 },
    { month: 'خرداد', monthKey: '03', in: 130, out: 90, net: 40 },
    { month: 'تیر', monthKey: '04', in: 160, out: 110, net: 50 },
    { month: 'مرداد', monthKey: '05', in: 140, out: 95, net: 45 },
    { month: 'شهریور', monthKey: '06', in: 170, out: 120, net: 50 },
    { month: 'مهر', monthKey: '07', in: 155, out: 105, net: 50 },
    { month: 'آبان', monthKey: '08', in: 180, out: 125, net: 55 }
  ],
  generatedAt: new Date().toISOString(),
  period: '۳۰ روز گذشته'
};

console.log('Testing PDF generation...');
generateEnhancedInventoryPDF(testData);
console.log('PDF generation test completed!'); 