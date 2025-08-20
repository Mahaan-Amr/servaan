# طراحی سیستم Business Intelligence - سِروان

**نسخه**: 1.0  
**تاریخ**: 2025/01/10  
**وضعیت**: Design Phase - Ready for Implementation

---

## 🎯 **اهداف سیستم BI**

### **هدف اصلی**
توسعه یک **سیستم هوش تجاری پیشرفته** که داده‌های عملیاتی سِروان را به بینش‌های قابل اجرا تبدیل کند و تصمیم‌گیری مدیریتی را بهبود بخشد.

### **اهداف فرعی**
- 📊 **داشبورد KPI های کلیدی** با نمایش real-time
- 📈 **تحلیل روندها** و پیش‌بینی عملکرد آینده
- 🎯 **تحلیل سودآوری** دقیق و چندبعدی
- 📋 **گزارش‌ساز قابل تنظیم** برای نیازهای مختلف
- 📤 **خروجی چندفرمته** (Excel, PDF, CSV)
- 🔍 **تحلیل‌های پیشرفته** (ABC, Pareto, Cohort)
- 🚨 **هشدارهای هوشمند** و نظارت خودکار

---

## 🏗️ **Architecture سیستم BI**

### **ساختار کلی**
```
┌─────────────────────────────────────────────────────────┐
│                 Servaan BI System                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Data Sources   │  │  ETL Pipeline   │               │
│  │  (POS, Inv,     │  │  (Extract,      │               │
│  │   Accounting)   │  │   Transform,    │               │
│  └─────────────────┘  │   Load)         │               │
│           │            └─────────────────┘               │
│           │                     │                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Data Warehouse                         ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ││
│  │  │Fact Tables  │ │Dimension    │ │Aggregated   │   ││
│  │  │(Sales,      │ │Tables       │ │Views        │   ││
│  │  │ Inventory)  │ │(Time, Item) │ │             │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
│           │                     │                       │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Analytics      │  │  Visualization  │               │
│  │  Engine         │  │  Layer          │               │
│  └─────────────────┘  └─────────────────┘               │
│           │                     │                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │                 BI Dashboard                        ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ││
│  │  │Executive    │ │Operational  │ │Financial    │   ││
│  │  │Dashboard    │ │Dashboard    │ │Dashboard    │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **KPI Dashboard Design**

### **Executive Dashboard (داشبورد مدیریتی)**

```typescript
interface ExecutiveDashboard {
  period: DateRange;
  kpis: {
    // KPI های مالی
    totalRevenue: KPIMetric;
    netProfit: KPIMetric;
    profitMargin: KPIMetric;
    cashFlow: KPIMetric;
    
    // KPI های عملیاتی
    customerCount: KPIMetric;
    averageOrderValue: KPIMetric;
    inventoryTurnover: KPIMetric;
    stockoutRate: KPIMetric;
    
    // KPI های رشد
    revenueGrowth: KPIMetric;
    customerGrowth: KPIMetric;
    marketShare: KPIMetric;
  };
  charts: {
    revenueChart: TimeSeriesChart;
    profitabilityChart: PieChart;
    topProductsChart: BarChart;
    customerSegmentChart: DonutChart;
  };
  alerts: Alert[];
}

interface KPIMetric {
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  target?: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  unit: string;
  description: string;
}
```

### **KPI های کلیدی**

#### **1. KPI های مالی**

```typescript
class FinancialKPIs {
  // درآمد کل
  async getTotalRevenue(period: DateRange): Promise<KPIMetric> {
    const currentRevenue = await this.calculateRevenue(period);
    const previousPeriod = this.getPreviousPeriod(period);
    const previousRevenue = await this.calculateRevenue(previousPeriod);
    
    return {
      value: currentRevenue,
      previousValue: previousRevenue,
      change: currentRevenue - previousRevenue,
      changePercent: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
      trend: currentRevenue > previousRevenue ? 'UP' : 'DOWN',
      unit: 'تومان',
      description: 'مجموع درآمد از فروش',
      status: this.determineStatus(currentRevenue, previousRevenue)
    };
  }
  
  // سود خالص
  async getNetProfit(period: DateRange): Promise<KPIMetric> {
    const revenue = await this.calculateRevenue(period);
    const costs = await this.calculateTotalCosts(period);
    const netProfit = revenue - costs;
    
    const previousPeriod = this.getPreviousPeriod(period);
    const previousProfit = await this.getNetProfit(previousPeriod);
    
    return {
      value: netProfit,
      previousValue: previousProfit.value,
      change: netProfit - previousProfit.value,
      changePercent: ((netProfit - previousProfit.value) / previousProfit.value) * 100,
      trend: netProfit > previousProfit.value ? 'UP' : 'DOWN',
      unit: 'تومان',
      description: 'سود خالص پس از کسر تمام هزینه‌ها'
    };
  }
  
  // حاشیه سود
  async getProfitMargin(period: DateRange): Promise<KPIMetric> {
    const revenue = await this.calculateRevenue(period);
    const netProfit = await this.getNetProfit(period);
    const margin = (netProfit.value / revenue) * 100;
    
    return {
      value: margin,
      unit: 'درصد',
      description: 'درصد سود نسبت به فروش',
      target: 15, // هدف 15% حاشیه سود
      status: margin >= 15 ? 'GOOD' : margin >= 10 ? 'WARNING' : 'CRITICAL'
    };
  }
  
  // گردش موجودی
  async getInventoryTurnover(period: DateRange): Promise<KPIMetric> {
    const cogs = await this.getCostOfGoodsSold(period);
    const avgInventory = await this.getAverageInventoryValue(period);
    const turnover = cogs / avgInventory;
    
    return {
      value: turnover,
      unit: 'بار در سال',
      description: 'تعداد دفعات گردش موجودی در سال',
      target: 12, // هدف 12 بار در سال (ماهانه)
      status: turnover >= 12 ? 'GOOD' : turnover >= 8 ? 'WARNING' : 'CRITICAL'
    };
  }
}
```

#### **2. KPI های عملیاتی**

```typescript
class OperationalKPIs {
  // میانگین ارزش سفارش
  async getAverageOrderValue(period: DateRange): Promise<KPIMetric> {
    const transactions = await this.getPOSTransactions(period);
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const orderCount = transactions.length;
    const aov = totalRevenue / orderCount;
    
    return {
      value: aov,
      unit: 'تومان',
      description: 'میانگین مبلغ هر سفارش',
      target: 50000, // هدف 50 هزار تومان
      status: aov >= 50000 ? 'GOOD' : aov >= 35000 ? 'WARNING' : 'CRITICAL'
    };
  }
  
  // نرخ کمبود موجودی
  async getStockoutRate(period: DateRange): Promise<KPIMetric> {
    const totalItems = await this.getTotalActiveItems();
    const stockoutEvents = await this.getStockoutEvents(period);
    const stockoutRate = (stockoutEvents.length / totalItems) * 100;
    
    return {
      value: stockoutRate,
      unit: 'درصد',
      description: 'درصد کالاهایی که موجودی آنها به اتمام رسیده',
      target: 5, // حداکثر 5% قابل قبول
      status: stockoutRate <= 5 ? 'GOOD' : stockoutRate <= 10 ? 'WARNING' : 'CRITICAL'
    };
  }
  
  // تعداد مشتریان منحصر به فرد
  async getUniqueCustomers(period: DateRange): Promise<KPIMetric> {
    const transactions = await this.getPOSTransactions(period);
    const uniqueCustomers = new Set(
      transactions
        .filter(t => t.customerId)
        .map(t => t.customerId)
    ).size;
    
    return {
      value: uniqueCustomers,
      unit: 'نفر',
      description: 'تعداد مشتریان منحصر به فرد'
    };
  }
  
  // نرخ بازگشت مشتری
  async getCustomerRetentionRate(period: DateRange): Promise<KPIMetric> {
    const previousPeriod = this.getPreviousPeriod(period);
    const currentCustomers = await this.getUniqueCustomers(period);
    const previousCustomers = await this.getUniqueCustomers(previousPeriod);
    const returningCustomers = await this.getReturningCustomers(period, previousPeriod);
    
    const retentionRate = (returningCustomers / previousCustomers.value) * 100;
    
    return {
      value: retentionRate,
      unit: 'درصد',
      description: 'درصد مشتریانی که در دوره جاری نیز خرید کرده‌اند',
      target: 60, // هدف 60% بازگشت
      status: retentionRate >= 60 ? 'GOOD' : retentionRate >= 40 ? 'WARNING' : 'CRITICAL'
    };
  }
}
```

#### **3. KPI های محصول**

```typescript
class ProductKPIs {
  // پرفروش‌ترین محصولات
  async getTopSellingProducts(
    period: DateRange, 
    limit: number = 10
  ): Promise<ProductPerformance[]> {
    const salesData = await this.getProductSalesData(period);
    
    return salesData
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((product, index) => ({
        rank: index + 1,
        itemId: product.itemId,
        itemName: product.itemName,
        category: product.category,
        totalSales: product.totalSales,
        quantitySold: product.quantitySold,
        profit: product.profit,
        profitMargin: (product.profit / product.totalSales) * 100,
        salesGrowth: product.salesGrowth
      }));
  }
  
  // محصولات کم‌فروش
  async getSlowMovingProducts(period: DateRange): Promise<ProductPerformance[]> {
    const salesData = await this.getProductSalesData(period);
    const threshold = await this.calculateSlowMovingThreshold(period);
    
    return salesData
      .filter(product => product.quantitySold < threshold)
      .sort((a, b) => a.quantitySold - b.quantitySold);
  }
  
  // تحلیل ABC محصولات
  async getProductABCAnalysis(period: DateRange): Promise<ABCAnalysis> {
    const products = await this.getAllProductsWithSales(period);
    const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);
    
    // مرتب‌سازی بر اساس فروش
    const sorted = products.sort((a, b) => b.totalSales - a.totalSales);
    
    let cumulativeSales = 0;
    const classified = sorted.map(product => {
      cumulativeSales += product.totalSales;
      const cumulativePercent = (cumulativeSales / totalSales) * 100;
      
      let category: 'A' | 'B' | 'C';
      if (cumulativePercent <= 80) {
        category = 'A'; // 80% فروش
      } else if (cumulativePercent <= 95) {
        category = 'B'; // 15% فروش
      } else {
        category = 'C'; // 5% فروش
      }
      
      return { ...product, abcCategory: category, cumulativePercent };
    });
    
    return {
      period,
      products: classified,
      summary: {
        categoryA: classified.filter(p => p.abcCategory === 'A'),
        categoryB: classified.filter(p => p.abcCategory === 'B'),
        categoryC: classified.filter(p => p.abcCategory === 'C')
      }
    };
  }
}
```

---

## 📈 **Advanced Analytics**

### **1. Cohort Analysis (تحلیل کوهورت)**

```typescript
class CohortAnalysis {
  async generateCustomerCohorts(
    startDate: Date,
    endDate: Date,
    cohortType: 'MONTHLY' | 'WEEKLY' = 'MONTHLY'
  ): Promise<CohortAnalysisResult> {
    
    const customers = await this.getCustomersWithFirstPurchase(startDate, endDate);
    const cohorts: CohortData[] = [];
    
    for (const customer of customers) {
      const cohortPeriod = this.getCohortPeriod(customer.firstPurchaseDate, cohortType);
      const subsequentPurchases = await this.getCustomerPurchases(
        customer.id, 
        customer.firstPurchaseDate, 
        endDate
      );
      
      // محاسبه retention برای هر دوره
      const retentionData = this.calculateRetentionPeriods(
        customer.firstPurchaseDate,
        subsequentPurchases,
        cohortType
      );
      
      cohorts.push({
        customerId: customer.id,
        cohortPeriod,
        firstPurchaseDate: customer.firstPurchaseDate,
        retentionPeriods: retentionData
      });
    }
    
    // تجمیع داده‌ها بر اساس کوهورت
    const aggregatedCohorts = this.aggregateCohortData(cohorts);
    
    return {
      cohortType,
      period: { startDate, endDate },
      cohorts: aggregatedCohorts,
      insights: this.generateCohortInsights(aggregatedCohorts)
    };
  }
  
  private generateCohortInsights(cohorts: AggregatedCohortData[]): CohortInsight[] {
    const insights: CohortInsight[] = [];
    
    // بهترین کوهورت از نظر retention
    const bestCohort = cohorts.reduce((best, current) => 
      current.month3Retention > best.month3Retention ? current : best
    );
    
    insights.push({
      type: 'BEST_COHORT',
      message: `کوهورت ${bestCohort.cohortPeriod} بهترین نرخ بازگشت را دارد: ${bestCohort.month3Retention.toFixed(1)}%`,
      actionable: true,
      recommendation: 'تحلیل ویژگی‌های این کوهورت و تکرار شرایط مشابه'
    });
    
    // روند کلی retention
    const avgRetention = cohorts.reduce((sum, c) => sum + c.month1Retention, 0) / cohorts.length;
    if (avgRetention < 30) {
      insights.push({
        type: 'LOW_RETENTION',
        message: `نرخ بازگشت ماه اول پایین است: ${avgRetention.toFixed(1)}%`,
        actionable: true,
        recommendation: 'بررسی تجربه مشتری و برنامه‌های وفاداری'
      });
    }
    
    return insights;
  }
}
```

### **2. Predictive Analytics (تحلیل پیش‌بینی)**

```typescript
class PredictiveAnalytics {
  // پیش‌بینی فروش
  async forecastSales(
    forecastPeriod: number, // تعداد ماه آینده
    method: 'LINEAR_REGRESSION' | 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' = 'LINEAR_REGRESSION'
  ): Promise<SalesForecast> {
    
    const historicalData = await this.getHistoricalSalesData(24); // 24 ماه گذشته
    
    let forecast: ForecastPoint[];
    
    switch (method) {
      case 'LINEAR_REGRESSION':
        forecast = this.linearRegressionForecast(historicalData, forecastPeriod);
        break;
      case 'MOVING_AVERAGE':
        forecast = this.movingAverageForecast(historicalData, forecastPeriod);
        break;
      case 'EXPONENTIAL_SMOOTHING':
        forecast = this.exponentialSmoothingForecast(historicalData, forecastPeriod);
        break;
    }
    
    return {
      method,
      forecastPeriod,
      historicalData,
      forecast,
      confidence: this.calculateConfidenceInterval(forecast),
      accuracy: await this.calculateForecastAccuracy(method)
    };
  }
  
  // پیش‌بینی تقاضا برای محصولات
  async forecastDemand(
    itemId: string,
    forecastDays: number = 30
  ): Promise<DemandForecast> {
    
    const salesHistory = await this.getItemSalesHistory(itemId, 90); // 90 روز گذشته
    const seasonality = await this.detectSeasonality(salesHistory);
    const trend = this.calculateTrend(salesHistory);
    
    const forecast = this.generateDemandForecast(
      salesHistory,
      seasonality,
      trend,
      forecastDays
    );
    
    return {
      itemId,
      forecastDays,
      dailyForecast: forecast,
      totalForecast: forecast.reduce((sum, day) => sum + day.quantity, 0),
      confidence: this.calculateDemandConfidence(forecast),
      recommendedOrderQuantity: this.calculateOptimalOrderQuantity(forecast)
    };
  }
  
  // تشخیص الگوهای فروش
  async detectSalesPatterns(period: DateRange): Promise<SalesPattern[]> {
    const salesData = await this.getDetailedSalesData(period);
    const patterns: SalesPattern[] = [];
    
    // الگوی روزهای هفته
    const weekdayPattern = this.analyzeWeekdayPattern(salesData);
    patterns.push({
      type: 'WEEKDAY',
      description: 'الگوی فروش در روزهای هفته',
      data: weekdayPattern,
      insight: this.generateWeekdayInsight(weekdayPattern)
    });
    
    // الگوی ساعات روز
    const hourlyPattern = this.analyzeHourlyPattern(salesData);
    patterns.push({
      type: 'HOURLY',
      description: 'الگوی فروش در ساعات مختلف روز',
      data: hourlyPattern,
      insight: this.generateHourlyInsight(hourlyPattern)
    });
    
    // الگوی فصلی
    const seasonalPattern = this.analyzeSeasonalPattern(salesData);
    patterns.push({
      type: 'SEASONAL',
      description: 'الگوی فصلی فروش',
      data: seasonalPattern,
      insight: this.generateSeasonalInsight(seasonalPattern)
    });
    
    return patterns;
  }
}
```

### **3. Customer Analytics (تحلیل مشتری)**

```typescript
class CustomerAnalytics {
  // تقسیم‌بندی مشتریان (RFM Analysis)
  async performRFMAnalysis(period: DateRange): Promise<RFMAnalysis> {
    const customers = await this.getCustomersWithTransactions(period);
    const rfmData: RFMCustomer[] = [];
    
    for (const customer of customers) {
      const transactions = await this.getCustomerTransactions(customer.id, period);
      
      // Recency: روزهای گذشته از آخرین خرید
      const lastPurchase = Math.max(...transactions.map(t => t.date.getTime()));
      const recency = Math.floor((Date.now() - lastPurchase) / (1000 * 60 * 60 * 24));
      
      // Frequency: تعداد خریدها
      const frequency = transactions.length;
      
      // Monetary: مجموع مبلغ خریدها
      const monetary = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
      
      rfmData.push({
        customerId: customer.id,
        recency,
        frequency,
        monetary,
        recencyScore: this.calculateRecencyScore(recency),
        frequencyScore: this.calculateFrequencyScore(frequency),
        monetaryScore: this.calculateMonetaryScore(monetary),
        rfmScore: '', // محاسبه بعداً
        segment: '' // محاسبه بعداً
      });
    }
    
    // محاسبه امتیازات و تقسیم‌بندی
    const segmentedCustomers = this.segmentCustomers(rfmData);
    
    return {
      period,
      totalCustomers: customers.length,
      segments: this.groupBySegment(segmentedCustomers),
      insights: this.generateRFMInsights(segmentedCustomers)
    };
  }
  
  private segmentCustomers(rfmData: RFMCustomer[]): RFMCustomer[] {
    return rfmData.map(customer => {
      const rfmScore = `${customer.recencyScore}${customer.frequencyScore}${customer.monetaryScore}`;
      customer.rfmScore = rfmScore;
      
      // تعیین segment بر اساس امتیاز RFM
      if (customer.recencyScore >= 4 && customer.frequencyScore >= 4 && customer.monetaryScore >= 4) {
        customer.segment = 'Champions'; // قهرمانان
      } else if (customer.recencyScore >= 3 && customer.frequencyScore >= 3) {
        customer.segment = 'Loyal Customers'; // مشتریان وفادار
      } else if (customer.recencyScore >= 4 && customer.frequencyScore <= 2) {
        customer.segment = 'New Customers'; // مشتریان جدید
      } else if (customer.recencyScore <= 2 && customer.frequencyScore >= 3) {
        customer.segment = 'At Risk'; // در معرض خطر
      } else if (customer.recencyScore <= 2 && customer.frequencyScore <= 2) {
        customer.segment = 'Lost Customers'; // مشتریان از دست رفته
      } else {
        customer.segment = 'Potential Loyalists'; // بالقوه وفادار
      }
      
      return customer;
    });
  }
  
  // تحلیل ارزش طول عمر مشتری (CLV)
  async calculateCustomerLifetimeValue(customerId: string): Promise<CLVAnalysis> {
    const customerHistory = await this.getCustomerCompleteHistory(customerId);
    
    // محاسبه متغیرهای CLV
    const avgOrderValue = customerHistory.totalSpent / customerHistory.orderCount;
    const purchaseFrequency = customerHistory.orderCount / customerHistory.lifespanMonths;
    const grossMargin = await this.getCustomerGrossMargin(customerId);
    
    // CLV = (Average Order Value × Purchase Frequency × Gross Margin) × Lifespan
    const monthlyValue = avgOrderValue * purchaseFrequency * (grossMargin / 100);
    const predictedLifespan = await this.predictCustomerLifespan(customerId);
    const clv = monthlyValue * predictedLifespan;
    
    return {
      customerId,
      currentCLV: clv,
      avgOrderValue,
      purchaseFrequency,
      grossMargin,
      predictedLifespan,
      segment: await this.getCustomerSegment(customerId),
      recommendations: this.generateCLVRecommendations(clv, avgOrderValue, purchaseFrequency)
    };
  }
}
```

---

## 📋 **Custom Report Builder**

### **گزارش‌ساز قابل تنظیم**

```typescript
interface ReportBuilder {
  id: string;
  name: string;
  description?: string;
  type: 'TABULAR' | 'CHART' | 'DASHBOARD';
  dataSource: DataSource;
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: SortOption[];
  columns: ReportColumn[];
  charts?: ChartConfig[];
  schedule?: ReportSchedule;
  exportFormats: ExportFormat[];
}

interface DataSource {
  type: 'SALES' | 'INVENTORY' | 'ACCOUNTING' | 'CUSTOM_QUERY';
  tables: string[];
  joins?: JoinConfig[];
  customQuery?: string;
}

interface ReportFilter {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN' | 'LIKE';
  value: any;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
}

class CustomReportBuilder {
  // ایجاد گزارش جدید
  async createReport(config: ReportBuilder): Promise<Report> {
    // اعتبارسنجی تنظیمات
    this.validateReportConfig(config);
    
    // ساخت کوئری
    const query = await this.buildQuery(config);
    
    // اجرای کوئری و دریافت داده‌ها
    const data = await this.executeQuery(query);
    
    // اعمال فیلترها و مرتب‌سازی
    const processedData = this.processData(data, config);
    
    // تولید گزارش
    const report: Report = {
      id: config.id,
      name: config.name,
      generatedAt: new Date(),
      data: processedData,
      metadata: {
        totalRows: processedData.length,
        columns: config.columns,
        filters: config.filters,
        executionTime: 0 // محاسبه شده
      }
    };
    
    return report;
  }
  
  // گزارش‌های از پیش تعریف شده
  async getPrebuiltReports(): Promise<ReportTemplate[]> {
    return [
      {
        id: 'sales-summary',
        name: 'خلاصه فروش',
        description: 'گزارش خلاصه فروش روزانه، هفتگی، ماهانه',
        category: 'SALES',
        config: {
          dataSource: { type: 'SALES', tables: ['pos_transactions', 'pos_transaction_items'] },
          columns: [
            { field: 'date', label: 'تاریخ', type: 'DATE' },
            { field: 'total_amount', label: 'مبلغ کل', type: 'CURRENCY' },
            { field: 'transaction_count', label: 'تعداد تراکنش', type: 'NUMBER' },
            { field: 'avg_order_value', label: 'میانگین سفارش', type: 'CURRENCY' }
          ],
          groupBy: ['date'],
          sortBy: [{ field: 'date', direction: 'DESC' }]
        }
      },
      {
        id: 'inventory-status',
        name: 'وضعیت موجودی',
        description: 'گزارش وضعیت موجودی کالاها',
        category: 'INVENTORY',
        config: {
          dataSource: { type: 'INVENTORY', tables: ['items', 'categories'] },
          columns: [
            { field: 'item_name', label: 'نام کالا', type: 'STRING' },
            { field: 'category_name', label: 'دسته‌بندی', type: 'STRING' },
            { field: 'current_quantity', label: 'موجودی فعلی', type: 'NUMBER' },
            { field: 'min_quantity', label: 'حداقل موجودی', type: 'NUMBER' },
            { field: 'status', label: 'وضعیت', type: 'STRING' }
          ],
          filters: [
            { field: 'is_active', operator: 'EQUALS', value: true, dataType: 'BOOLEAN' }
          ]
        }
      },
      {
        id: 'profit-analysis',
        name: 'تحلیل سودآوری',
        description: 'تحلیل سودآوری محصولات و دسته‌بندی‌ها',
        category: 'FINANCIAL',
        config: {
          dataSource: { 
            type: 'CUSTOM_QUERY',
            customQuery: `
              SELECT 
                i.name as item_name,
                c.name as category_name,
                SUM(pti.quantity) as total_sold,
                SUM(pti.total_price) as total_revenue,
                SUM(pti.quantity * i.cost_price) as total_cost,
                SUM(pti.total_price - (pti.quantity * i.cost_price)) as total_profit,
                ROUND(
                  (SUM(pti.total_price - (pti.quantity * i.cost_price)) / SUM(pti.total_price)) * 100, 
                  2
                ) as profit_margin
              FROM pos_transaction_items pti
              JOIN items i ON pti.item_id = i.id
              JOIN categories c ON i.category_id = c.id
              JOIN pos_transactions pt ON pti.transaction_id = pt.id
              WHERE pt.transaction_at >= ? AND pt.transaction_at <= ?
              GROUP BY i.id, i.name, c.name
              ORDER BY total_profit DESC
            `
          },
          columns: [
            { field: 'item_name', label: 'نام کالا', type: 'STRING' },
            { field: 'category_name', label: 'دسته‌بندی', type: 'STRING' },
            { field: 'total_sold', label: 'تعداد فروخته شده', type: 'NUMBER' },
            { field: 'total_revenue', label: 'درآمد کل', type: 'CURRENCY' },
            { field: 'total_cost', label: 'هزینه کل', type: 'CURRENCY' },
            { field: 'total_profit', label: 'سود کل', type: 'CURRENCY' },
            { field: 'profit_margin', label: 'حاشیه سود (%)', type: 'PERCENTAGE' }
          ]
        }
      }
    ];
  }
  
  // زمان‌بندی گزارش‌ها
  async scheduleReport(
    reportId: string, 
    schedule: ReportSchedule
  ): Promise<ScheduledReport> {
    const scheduledReport: ScheduledReport = {
      id: generateId(),
      reportId,
      schedule,
      isActive: true,
      lastRun: null,
      nextRun: this.calculateNextRun(schedule),
      recipients: schedule.recipients,
      createdAt: new Date()
    };
    
    // ثبت در سیستم زمان‌بندی
    await this.saveScheduledReport(scheduledReport);
    
    // تنظیم cron job
    this.setupCronJob(scheduledReport);
    
    return scheduledReport;
  }
}
```

---

## 📤 **Export System**

### **سیستم خروجی چندفرمته**

```typescript
class ReportExportSystem {
  // خروجی Excel
  async exportToExcel(
    report: Report, 
    options: ExcelExportOptions = {}
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(report.name);
    
    // تنظیم هدرها
    const headers = report.metadata.columns.map(col => col.label);
    worksheet.addRow(headers);
    
    // استایل هدرها
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    
    // اضافه کردن داده‌ها
    report.data.forEach(row => {
      const values = report.metadata.columns.map(col => {
        const value = row[col.field];
        return this.formatCellValue(value, col.type);
      });
      worksheet.addRow(values);
    });
    
    // تنظیم عرض ستون‌ها
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // اضافه کردن چارت (اختیاری)
    if (options.includeCharts && report.charts) {
      await this.addChartsToWorksheet(worksheet, report.charts);
    }
    
    return await workbook.xlsx.writeBuffer();
  }
  
  // خروجی PDF
  async exportToPDF(
    report: Report, 
    options: PDFExportOptions = {}
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    
    doc.on('data', buffers.push.bind(buffers));
    
    // هدر گزارش
    doc.fontSize(16).font('Helvetica-Bold').text(report.name, { align: 'center' });
    doc.fontSize(10).text(`تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, { align: 'left' });
    doc.moveDown();
    
    // جدول داده‌ها
    const table = {
      headers: report.metadata.columns.map(col => col.label),
      rows: report.data.map(row => 
        report.metadata.columns.map(col => 
          this.formatCellValue(row[col.field], col.type)
        )
      )
    };
    
    await this.drawTable(doc, table);
    
    // اضافه کردن چارت‌ها
    if (options.includeCharts && report.charts) {
      doc.addPage();
      await this.addChartsToPDF(doc, report.charts);
    }
    
    doc.end();
    
    return new Promise(resolve => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
  
  // خروجی CSV
  async exportToCSV(report: Report): Promise<string> {
    const headers = report.metadata.columns.map(col => col.label);
    const rows = report.data.map(row => 
      report.metadata.columns.map(col => {
        const value = row[col.field];
        return this.escapeCsvValue(this.formatCellValue(value, col.type));
      })
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // اضافه کردن BOM برای پشتیبانی از UTF-8 در Excel
    return '\ufeff' + csvContent;
  }
  
  // خروجی JSON
  async exportToJSON(report: Report): Promise<string> {
    const exportData = {
      reportName: report.name,
      generatedAt: report.generatedAt,
      metadata: report.metadata,
      data: report.data
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  private formatCellValue(value: any, type: string): string {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'CURRENCY':
        return new Intl.NumberFormat('fa-IR', {
          style: 'currency',
          currency: 'IRR'
        }).format(value);
      case 'PERCENTAGE':
        return `${value}%`;
      case 'DATE':
        return new Date(value).toLocaleDateString('fa-IR');
      case 'NUMBER':
        return new Intl.NumberFormat('fa-IR').format(value);
      default:
        return String(value);
    }
  }
}
```

---

## 🚨 **Alert System**

### **سیستم هشدارهای هوشمند**

```typescript
class IntelligentAlertSystem {
  // تعریف قوانین هشدار
  async defineAlertRules(): Promise<AlertRule[]> {
    return [
      {
        id: 'low-stock-alert',
        name: 'هشدار کمبود موجودی',
        description: 'هشدار زمانی که موجودی کالا به حداقل برسد',
        condition: {
          metric: 'current_quantity',
          operator: 'LESS_THAN_OR_EQUAL',
          threshold: 'min_quantity',
          entity: 'ITEM'
        },
        severity: 'WARNING',
        frequency: 'REAL_TIME',
        recipients: ['inventory@servaan.com', 'manager@servaan.com']
      },
      {
        id: 'high-profit-opportunity',
        name: 'فرصت سود بالا',
        description: 'هشدار زمانی که محصولی سود بالایی دارد',
        condition: {
          metric: 'profit_margin',
          operator: 'GREATER_THAN',
          threshold: 50, // بیش از 50% سود
          entity: 'ITEM'
        },
        severity: 'INFO',
        frequency: 'DAILY',
        recipients: ['sales@servaan.com']
      },
      {
        id: 'sales-drop-alert',
        name: 'هشدار کاهش فروش',
        description: 'هشدار زمانی که فروش روزانه کاهش یابد',
        condition: {
          metric: 'daily_sales',
          operator: 'LESS_THAN',
          threshold: 'previous_week_average * 0.8', // 20% کاهش
          entity: 'SALES'
        },
        severity: 'CRITICAL',
        frequency: 'DAILY',
        recipients: ['manager@servaan.com', 'sales@servaan.com']
      },
      {
        id: 'customer-churn-risk',
        name: 'خطر از دست دادن مشتری',
        description: 'هشدار برای مشتریانی که مدتی خرید نکرده‌اند',
        condition: {
          metric: 'days_since_last_purchase',
          operator: 'GREATER_THAN',
          threshold: 30, // 30 روز عدم خرید
          entity: 'CUSTOMER'
        },
        severity: 'WARNING',
        frequency: 'WEEKLY',
        recipients: ['crm@servaan.com']
      }
    ];
  }
  
  // بررسی و ارسال هشدارها
  async checkAndSendAlerts(): Promise<AlertExecution[]> {
    const rules = await this.getActiveAlertRules();
    const executions: AlertExecution[] = [];
    
    for (const rule of rules) {
      try {
        const triggeredAlerts = await this.evaluateRule(rule);
        
        if (triggeredAlerts.length > 0) {
          const execution = await this.sendAlert(rule, triggeredAlerts);
          executions.push(execution);
        }
      } catch (error) {
        console.error(`خطا در بررسی قانون ${rule.id}:`, error);
      }
    }
    
    return executions;
  }
  
  private async evaluateRule(rule: AlertRule): Promise<AlertTrigger[]> {
    const triggers: AlertTrigger[] = [];
    
    switch (rule.condition.entity) {
      case 'ITEM':
        const items = await this.getAllActiveItems();
        for (const item of items) {
          if (await this.evaluateItemCondition(item, rule.condition)) {
            triggers.push({
              entityType: 'ITEM',
              entityId: item.id,
              entityName: item.name,
              currentValue: await this.getMetricValue(item, rule.condition.metric),
              threshold: rule.condition.threshold
            });
          }
        }
        break;
        
      case 'SALES':
        if (await this.evaluateSalesCondition(rule.condition)) {
          triggers.push({
            entityType: 'SALES',
            entityId: 'daily_sales',
            entityName: 'فروش روزانه',
            currentValue: await this.getDailySales(),
            threshold: rule.condition.threshold
          });
        }
        break;
        
      case 'CUSTOMER':
        const customers = await this.getActiveCustomers();
        for (const customer of customers) {
          if (await this.evaluateCustomerCondition(customer, rule.condition)) {
            triggers.push({
              entityType: 'CUSTOMER',
              entityId: customer.id,
              entityName: customer.name || customer.phone,
              currentValue: await this.getCustomerMetricValue(customer, rule.condition.metric),
              threshold: rule.condition.threshold
            });
          }
        }
        break;
    }
    
    return triggers;
  }
  
  private async sendAlert(
    rule: AlertRule, 
    triggers: AlertTrigger[]
  ): Promise<AlertExecution> {
    const alertMessage = this.generateAlertMessage(rule, triggers);
    
    // ارسال ایمیل
    await this.sendEmailAlert(rule.recipients, alertMessage);
    
    // ارسال نوتیفیکیشن در سیستم
    await this.sendSystemNotification(rule, triggers);
    
    // ثبت در لاگ
    const execution: AlertExecution = {
      id: generateId(),
      ruleId: rule.id,
      executedAt: new Date(),
      triggersCount: triggers.length,
      recipients: rule.recipients,
      status: 'SENT',
      message: alertMessage
    };
    
    await this.logAlertExecution(execution);
    
    return execution;
  }
  
  private generateAlertMessage(rule: AlertRule, triggers: AlertTrigger[]): string {
    let message = `🚨 ${rule.name}\n\n`;
    message += `${rule.description}\n\n`;
    
    if (triggers.length === 1) {
      const trigger = triggers[0];
      message += `موجودیت: ${trigger.entityName}\n`;
      message += `مقدار فعلی: ${trigger.currentValue}\n`;
      message += `آستانه: ${trigger.threshold}\n`;
    } else {
      message += `تعداد موارد: ${triggers.length}\n\n`;
      triggers.slice(0, 5).forEach(trigger => {
        message += `• ${trigger.entityName}: ${trigger.currentValue}\n`;
      });
      
      if (triggers.length > 5) {
        message += `... و ${triggers.length - 5} مورد دیگر\n`;
      }
    }
    
    message += `\nزمان: ${new Date().toLocaleString('fa-IR')}`;
    
    return message;
  }
}
```

**🎯 سیستم Business Intelligence کامل آماده برای پیاده‌سازی است! تمام ویژگی‌های KPI، تحلیل‌های پیشرفته، گزارش‌ساز و هشدارهای هوشمند طراحی شده است.** 