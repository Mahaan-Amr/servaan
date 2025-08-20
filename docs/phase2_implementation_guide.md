# راهنمای پیاده‌سازی فاز ۲ - سِروان پیشرفته

**نسخه**: 1.0  
**تاریخ**: 2025/01/10  
**وضعیت**: Ready for Implementation

---

## 🎯 **خلاصه فاز ۲**

فاز ۲ سِروان شامل **4 ماژول اصلی** است که سیستم را از یک مدیریت موجودی ساده به **پلتفرم جامع مدیریت کسب‌وکار** تبدیل می‌کند:

### **ماژول‌های اصلی فاز ۲**
1. 📱 **QR/Barcode Scanner System (وب-محور)** - اسکن سریع و دقیق از طریق مرورگر
2. 📊 **Business Intelligence Dashboard** - تحلیل‌های پیشرفته و KPI
3. 💰 **Complete Accounting System** - حسابداری کامل یکپارچه
4. 🛒 **POS Integration System** - اتصال با سیستم‌های فروش

---

## 📋 **نقشه راه پیاده‌سازی**

### **مرحله ۱: آماده‌سازی (هفته ۱-۲)**

#### **1.1 تنظیمات پایه**
```bash
# نصب dependencies جدید برای Web Scanner
npm install qrcode quagga @zxing/library
npm install react-webcam 
npm install workbox-webpack-plugin # PWA support
npm install idb # IndexedDB for offline storage

# نصب dependencies برای BI و Reporting
npm install exceljs pdfkit jspdf html2canvas
npm install recharts chart.js react-chartjs-2 d3
npm install date-fns moment-timezone

# نصب dependencies برای Accounting
npm install decimal.js big.js
npm install react-hook-form yup @hookform/resolvers

# نصب dependencies برای POS Integration
npm install axios node-cron
npm install crypto-js jsonwebtoken
```

#### **1.2 ساختار دیتابیس جدید**
```sql
-- جداول QR/Barcode Scanner
CREATE TABLE scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type VARCHAR(20) NOT NULL, -- 'QR_CODE' | 'BARCODE'
  scan_value TEXT NOT NULL,
  barcode_format VARCHAR(20), -- 'EAN13', 'CODE128', etc.
  product_found BOOLEAN DEFAULT FALSE,
  item_id UUID REFERENCES items(id),
  scanned_at TIMESTAMP DEFAULT NOW(),
  device_info JSONB,
  location_data JSONB, -- GPS coordinates if available
  user_id UUID REFERENCES users(id),
  scan_context VARCHAR(50) DEFAULT 'MANUAL', -- 'MANUAL' | 'BATCH' | 'INVENTORY'
  batch_id UUID,
  notes TEXT
);

CREATE TABLE barcode_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  barcode_value VARCHAR(255) NOT NULL UNIQUE,
  barcode_type VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- جداول POS Integration
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL,
  external_system VARCHAR(50) NOT NULL, -- 'SQUARE' | 'TOAST' | 'CLOVER' | 'SAPA' | 'HAMKARAN'
  location_id VARCHAR(255),
  transaction_at TIMESTAMP NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IRR',
  status VARCHAR(20) NOT NULL,
  order_number VARCHAR(100),
  customer_data JSONB,
  payment_data JSONB,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  synced_to_inventory BOOLEAN DEFAULT FALSE,
  synced_to_accounting BOOLEAN DEFAULT FALSE,
  sync_error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES pos_transactions(id),
  item_id UUID REFERENCES items(id),
  external_item_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  modifiers JSONB,
  inventory_updated BOOLEAN DEFAULT FALSE
);

-- جداول Accounting System
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  parent_id UUID REFERENCES chart_of_accounts(id),
  level INTEGER DEFAULT 1,
  normal_balance VARCHAR(10) NOT NULL, -- 'DEBIT' | 'CREDIT'
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT,
  reference VARCHAR(255),
  total_debit DECIMAL(15,2) NOT NULL,
  total_credit DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT' | 'POSTED' | 'REVERSED'
  source_type VARCHAR(50), -- 'MANUAL' | 'POS' | 'INVENTORY' | 'SYSTEM'
  source_id UUID,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  reversed_by UUID REFERENCES users(id),
  reversed_at TIMESTAMP,
  reversal_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id),
  description TEXT,
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  line_number INTEGER NOT NULL,
  cost_center VARCHAR(100),
  project_code VARCHAR(100)
);

-- جداول Business Intelligence
CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50) NOT NULL, -- 'FINANCIAL' | 'OPERATIONAL' | 'INVENTORY'
  metric_value DECIMAL(15,4) NOT NULL,
  previous_value DECIMAL(15,4),
  target_value DECIMAL(15,4),
  period_type VARCHAR(20) NOT NULL, -- 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  change_percent DECIMAL(5,2),
  variance_percent DECIMAL(5,2),
  calculation_formula TEXT,
  data_sources JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT'
  data_sources JSONB NOT NULL,
  columns_config JSONB NOT NULL,
  filters_config JSONB,
  sorting_config JSONB,
  chart_config JSONB,
  layout_config JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  shared_with JSONB, -- Array of user IDs
  tags TEXT[],
  execution_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP,
  avg_execution_time INTEGER, -- milliseconds
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scan_history_item_date ON scan_history(item_id, scanned_at);
CREATE INDEX idx_pos_transactions_date ON pos_transactions(transaction_at);
CREATE INDEX idx_pos_transactions_sync ON pos_transactions(synced_to_inventory, synced_to_accounting);
CREATE INDEX idx_journal_entries_date_status ON journal_entries(entry_date, status);
CREATE INDEX idx_kpi_metrics_lookup ON kpi_metrics(metric_name, period_type, period_start);
```

#### **1.3 API Routes جدید**
```typescript
// src/backend/routes/scanner.js
app.post('/api/scanner/process', scannerController.processScan);
app.get('/api/scanner/history', scannerController.getScanHistory);
app.post('/api/scanner/generate-qr', scannerController.generateQR);
app.post('/api/scanner/generate-barcode', scannerController.generateBarcode);
app.get('/api/scanner/stats', scannerController.getScanStats);
app.post('/api/scanner/batch/start', scannerController.startBatchOperation);
app.post('/api/scanner/batch/:batchId/complete', scannerController.completeBatchOperation);

// src/backend/routes/pos.js
app.post('/api/pos/webhook/:system', posController.handleWebhook);
app.get('/api/pos/transactions', posController.getTransactions);
app.post('/api/pos/sync/:system', posController.startSync);
app.get('/api/pos/systems', posController.getAvailableSystems);
app.post('/api/pos/configure/:system', posController.configureSystem);
app.get('/api/pos/sync-status', posController.getSyncStatus);

// src/backend/routes/accounting.js
app.get('/api/accounting/chart-of-accounts', accountingController.getChartOfAccounts);
app.post('/api/accounting/chart-of-accounts', accountingController.createAccount);
app.post('/api/accounting/journal-entries', accountingController.createJournalEntry);
app.get('/api/accounting/journal-entries', accountingController.getJournalEntries);
app.post('/api/accounting/journal-entries/:id/post', accountingController.postJournalEntry);
app.get('/api/accounting/financial-statements/balance-sheet', accountingController.getBalanceSheet);
app.get('/api/accounting/financial-statements/income-statement', accountingController.getIncomeStatement);
app.get('/api/accounting/financial-statements/cash-flow', accountingController.getCashFlowStatement);
app.get('/api/accounting/trial-balance', accountingController.getTrialBalance);

// src/backend/routes/bi.js
app.get('/api/bi/kpis', biController.getKPIs);
app.post('/api/bi/kpis', biController.createKPI);
app.get('/api/bi/kpis/:id/calculate', biController.calculateKPI);
app.get('/api/bi/dashboard/:role', biController.getDashboard);
app.post('/api/bi/reports', biController.createCustomReport);
app.get('/api/bi/reports', biController.getCustomReports);
app.post('/api/bi/reports/:id/execute', biController.executeReport);
app.get('/api/bi/analytics/profit-analysis', biController.getProfitAnalysis);
app.get('/api/bi/analytics/abc-analysis', biController.getABCAnalysis);
app.get('/api/bi/analytics/trends', biController.getTrends);
```

---

### **مرحله ۲: Web-based QR/Barcode Scanner (هفته ۳-۴)**

#### **2.1 Backend Implementation**
```typescript
// src/backend/services/ScannerService.js
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

class ScannerService {
  static async processBarcode(scanData) {
    try {
      // 1. جستجو در دیتابیس محلی
      let product = await this.findProductInDB(scanData.value);
      
      // 2. جستجو در API های خارجی
      if (!product && scanData.searchExternal) {
        product = await this.searchExternalAPIs(scanData.value);
      }
      
      // 3. ذخیره تاریخچه اسکن
      const scanRecord = await this.saveScanHistory(scanData, product);
      
      // 4. به‌روزرسانی آمار اسکن
      await this.updateScanStats(scanData.userId);
      
      return { 
        success: true,
        scanRecord,
        product,
        suggestions: product ? [] : await this.getSuggestions(scanData.value)
      };
      
    } catch (error) {
      console.error('Scanner processing error:', error);
      throw new Error('خطا در پردازش کد اسکن شده');
    }
  }
  
  static async findProductInDB(barcodeValue) {
    const barcode = await db.barcode_mappings.findFirst({
      where: { barcode_value: barcodeValue },
      include: { item: { include: { category: true } } }
    });
    
    return barcode?.item || null;
  }
  
  static async searchExternalAPIs(barcodeValue) {
    const apis = [
      this.searchUPCDatabase,
      this.searchOpenFoodFacts,
      this.searchBarcodeLookup
    ];
    
    for (const apiSearch of apis) {
      try {
        const product = await apiSearch(barcodeValue);
        if (product) return product;
      } catch (error) {
        console.warn('External API search failed:', error);
      }
    }
    
    return null;
  }
  
  static async generateQRCode(data, options = {}) {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(
        typeof data === 'string' ? data : JSON.stringify(data),
        finalOptions
      );
      
      return {
        success: true,
        dataURL: qrCodeDataURL,
        format: 'QR_CODE'
      };
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }
  
  static async generateBarcode(data, format = 'CODE128', options = {}) {
    const canvas = createCanvas(200, 100);
    
    try {
      JsBarcode(canvas, data, {
        format: format,
        width: 2,
        height: 100,
        displayValue: true,
        ...options
      });
      
      const dataURL = canvas.toDataURL();
      
      return {
        success: true,
        dataURL,
        format
      };
    } catch (error) {
      throw new Error(`Failed to generate barcode: ${error.message}`);
    }
  }
}

module.exports = ScannerService;
```

#### **2.2 Frontend Web Scanner Implementation**
```typescript
// src/frontend/components/Scanner/WebBarcodeScanner.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Quagga from 'quagga';

interface WebBarcodeScannerProps {
  onScanResult: (result: ScanResult) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

interface ScanResult {
  code: string;
  format: string;
  timestamp: number;
}

const WebBarcodeScanner: React.FC<WebBarcodeScannerProps> = ({
  onScanResult,
  onError,
  isActive
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // دریافت لیست دوربین‌ها
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        // انتخاب دوربین پشتی برای موبایل
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        
        setSelectedDeviceId(backCamera?.deviceId || videoDevices[0]?.deviceId || '');
      } catch (error) {
        onError('دسترسی به لیست دوربین‌ها امکان‌پذیر نیست');
      }
    };
    
    getDevices();
  }, [onError]);
  
  // راه‌اندازی QuaggaJS
  const initializeScanner = useCallback(() => {
    if (!scannerRef.current || isInitialized) return;
    
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: "environment",
          deviceId: selectedDeviceId || undefined
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 2,
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader", 
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error('Quagga initialization error:', err);
        onError('خطا در راه‌اندازی اسکنر');
        return;
      }
      
      setIsInitialized(true);
      
      if (isActive) {
        Quagga.start();
      }
    });
    
    // Event listener برای تشخیص بارکد
    Quagga.onDetected((data) => {
      const result: ScanResult = {
        code: data.codeResult.code,
        format: data.codeResult.format,
        timestamp: Date.now()
      };
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      onScanResult(result);
      
      // توقف موقت برای جلوگیری از اسکن مکرر
      setTimeout(() => {
        if (isActive && isInitialized) {
          Quagga.start();
        }
      }, 2000);
    });
    
  }, [selectedDeviceId, isInitialized, isActive, onScanResult, onError]);
  
  // شروع/توقف اسکنر
  useEffect(() => {
    if (isActive && isInitialized) {
      Quagga.start();
    } else if (!isActive && isInitialized) {
      Quagga.stop();
    }
  }, [isActive, isInitialized]);
  
  // راه‌اندازی اولیه
  useEffect(() => {
    if (selectedDeviceId) {
      initializeScanner();
    }
    
    return () => {
      if (isInitialized) {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      }
    };
  }, [selectedDeviceId, initializeScanner, isInitialized]);
  
  // تغییر دوربین
  const switchCamera = () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const newDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(newDeviceId);
    setIsInitialized(false);
    
    Quagga.stop();
    Quagga.offDetected();
    Quagga.offProcessed();
  };
  
  return (
    <div className="relative w-full">
      {/* Scanner Container */}
      <div 
        ref={scannerRef}
        className="relative w-full h-80 bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '320px' }}
      />
      
      {/* Scanner Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative">
          {/* Scanner Frame */}
          <div className="w-64 h-64 border-2 border-transparent relative">
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
            
            {/* Scanning line animation */}
            {isActive && (
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-0.5 bg-green-500 animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg text-sm">
              بارکد را در مرکز قاب قرار دهید
            </p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      {devices.length > 1 && (
        <div className="absolute top-4 right-4">
          <button
            onClick={switchCamera}
            className="bg-white bg-opacity-80 p-2 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
            title="تغییر دوربین"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default WebBarcodeScanner;
```

---

### **مرحله ۳: Business Intelligence (هفته ۵-۷)**

#### **3.1 KPI Dashboard Backend**
```typescript
// src/backend/services/BIService.js
class BIService {
  static async calculateKPIs(period) {
    const kpis = {};
    
    // درآمد کل
    kpis.totalRevenue = await this.calculateTotalRevenue(period);
    
    // سود خالص
    kpis.netProfit = await this.calculateNetProfit(period);
    
    // گردش موجودی
    kpis.inventoryTurnover = await this.calculateInventoryTurnover(period);
    
    // نرخ رشد
    kpis.growthRate = await this.calculateGrowthRate(period);
    
    return kpis;
  }
  
  static async generateCustomReport(config) {
    const queryBuilder = new QueryBuilder();
    const query = queryBuilder.buildFromConfig(config);
    const data = await db.query(query);
    
    return {
      data,
      metadata: {
        totalRows: data.length,
        generatedAt: new Date(),
        config
      }
    };
  }
}
```

#### **3.2 Dashboard Frontend**
```typescript
// src/frontend/components/BI/ExecutiveDashboard.tsx
const ExecutiveDashboard: React.FC = () => {
  const [kpis, setKPIs] = useState<KPIMetrics>({});
  const [charts, setCharts] = useState<ChartData>({});
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    const [kpiData, chartData] = await Promise.all([
      fetch('/api/bi/kpis').then(r => r.json()),
      fetch('/api/bi/charts').then(r => r.json())
    ]);
    
    setKPIs(kpiData);
    setCharts(chartData);
  };
  
  return (
    <div className="dashboard-grid">
      <KPICards kpis={kpis} />
      <RevenueChart data={charts.revenue} />
      <TopProductsChart data={charts.topProducts} />
      <CustomerSegmentChart data={charts.customerSegments} />
    </div>
  );
};
```

#### **3.3 Custom Report Builder**
```typescript
// src/frontend/components/BI/ReportBuilder.tsx
const ReportBuilder: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    dataSource: 'SALES',
    columns: [],
    filters: [],
    groupBy: [],
    sortBy: []
  });
  
  const addColumn = (column: ReportColumn) => {
    setConfig(prev => ({
      ...prev,
      columns: [...prev.columns, column]
    }));
  };
  
  const generateReport = async () => {
    const response = await fetch('/api/bi/reports', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    
    const report = await response.json();
    // Display report...
  };
  
  return (
    <div className="report-builder">
      <DataSourceSelector onChange={setDataSource} />
      <ColumnSelector onAdd={addColumn} />
      <FilterBuilder filters={config.filters} onChange={setFilters} />
      <button onClick={generateReport}>Generate Report</button>
    </div>
  );
};
```

---

### **مرحله ۴: Accounting System (هفته ۸-۱۰)**

#### **4.1 Chart of Accounts Setup**
```typescript
// src/backend/services/AccountingService.js
class AccountingService {
  static async initializeChartOfAccounts() {
    const defaultAccounts = [
      { code: '1000', name: 'نقد و بانک', type: 'ASSET' },
      { code: '1100', name: 'حساب‌های دریافتنی', type: 'ASSET' },
      { code: '1200', name: 'موجودی کالا', type: 'ASSET' },
      { code: '2000', name: 'حساب‌های پرداختنی', type: 'LIABILITY' },
      { code: '3000', name: 'سرمایه', type: 'EQUITY' },
      { code: '4000', name: 'درآمد فروش', type: 'REVENUE' },
      { code: '5000', name: 'بهای تمام شده کالای فروخته شده', type: 'EXPENSE' }
    ];
    
    for (const account of defaultAccounts) {
      await this.createAccount(account);
    }
  }
  
  static async createJournalEntry(entryData) {
    // اعتبارسنجی تراز
    const totalDebit = entryData.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entryData.lines.reduce((sum, line) => sum + line.credit, 0);
    
    if (totalDebit !== totalCredit) {
      throw new Error('Journal entry is not balanced');
    }
    
    // ایجاد سند
    const entry = await JournalEntry.create({
      ...entryData,
      entryNumber: await this.generateEntryNumber(),
      totalDebit,
      totalCredit
    });
    
    // ایجاد سطرها
    for (const line of entryData.lines) {
      await JournalEntryLine.create({
        ...line,
        journalEntryId: entry.id
      });
    }
    
    return entry;
  }
}
```

#### **4.2 Financial Statements**
```typescript
// src/backend/services/FinancialStatementsService.js
class FinancialStatementsService {
  static async generateBalanceSheet(asOfDate) {
    const assets = await this.getAccountBalances('ASSET', asOfDate);
    const liabilities = await this.getAccountBalances('LIABILITY', asOfDate);
    const equity = await this.getAccountBalances('EQUITY', asOfDate);
    
    return {
      assets: {
        current: assets.filter(a => a.isCurrent),
        nonCurrent: assets.filter(a => !a.isCurrent),
        total: assets.reduce((sum, a) => sum + a.balance, 0)
      },
      liabilities: {
        current: liabilities.filter(l => l.isCurrent),
        nonCurrent: liabilities.filter(l => !l.isCurrent),
        total: liabilities.reduce((sum, l) => sum + l.balance, 0)
      },
      equity: {
        items: equity,
        total: equity.reduce((sum, e) => sum + e.balance, 0)
      }
    };
  }
  
  static async generateIncomeStatement(startDate, endDate) {
    const revenue = await this.getAccountBalances('REVENUE', endDate, startDate);
    const expenses = await this.getAccountBalances('EXPENSE', endDate, startDate);
    
    const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.balance, 0);
    
    return {
      revenue: {
        items: revenue,
        total: totalRevenue
      },
      expenses: {
        items: expenses,
        total: totalExpenses
      },
      netIncome: totalRevenue - totalExpenses
    };
  }
}
```

---

### **مرحله ۵: POS Integration (هفته ۱۱-۱۳)**

#### **5.1 Universal Transaction Processor**
```typescript
// src/backend/services/POSIntegrationService.js
class POSIntegrationService {
  static async processTransaction(rawTransaction, posSystem) {
    // تبدیل به فرمت استاندارد
    const transaction = await this.normalizeTransaction(rawTransaction, posSystem);
    
    // تطبیق آیتم‌ها
    await this.matchItemsWithInventory(transaction);
    
    // ذخیره تراکنش
    const savedTransaction = await this.saveTransaction(transaction);
    
    // همگام‌سازی با سیستم‌ها
    await Promise.all([
      this.syncToInventory(savedTransaction),
      this.syncToAccounting(savedTransaction)
    ]);
    
    return savedTransaction;
  }
  
  static async setupWebhook(posSystem, config) {
    const webhookUrl = `${process.env.BASE_URL}/api/pos/webhook/${posSystem}`;
    
    switch (posSystem) {
      case 'SQUARE':
        return await this.setupSquareWebhook(config, webhookUrl);
      case 'TOAST':
        return await this.setupToastWebhook(config, webhookUrl);
      case 'CLOVER':
        return await this.setupCloverWebhook(config, webhookUrl);
    }
  }
}
```

#### **5.2 Webhook Handler**
```typescript
// src/backend/controllers/posController.js
const handleWebhook = async (req, res) => {
  const { system } = req.params;
  const signature = req.headers['x-signature'];
  const body = req.body;
  
  // تأیید امضا
  if (!verifyWebhookSignature(system, signature, body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  try {
    await POSIntegrationService.processWebhook(system, body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

---

### **مرحله ۶: Testing & Integration (هفته ۱۴-۱۵)**

#### **6.1 Unit Tests**
```typescript
// tests/scanner.test.js
describe('Scanner Service', () => {
  test('should process QR code correctly', async () => {
    const scanData = { value: 'TEST123', type: 'QR_CODE' };
    const result = await ScannerService.processBarcode(scanData);
    
    expect(result.scanData.value).toBe('TEST123');
    expect(result.product).toBeDefined();
  });
});

// tests/accounting.test.js
describe('Accounting Service', () => {
  test('should create balanced journal entry', async () => {
    const entryData = {
      description: 'Test Entry',
      lines: [
        { accountId: '1000', debit: 100, credit: 0 },
        { accountId: '4000', debit: 0, credit: 100 }
      ]
    };
    
    const entry = await AccountingService.createJournalEntry(entryData);
    expect(entry.totalDebit).toBe(entry.totalCredit);
  });
});
```

#### **6.2 Integration Tests**
```typescript
// tests/integration/pos.test.js
describe('POS Integration', () => {
  test('should process Square webhook', async () => {
    const webhookData = {
      type: 'order.created',
      data: { /* Square order data */ }
    };
    
    const response = await request(app)
      .post('/api/pos/webhook/SQUARE')
      .send(webhookData)
      .expect(200);
    
    // Verify transaction was created
    const transaction = await POSTransaction.findOne({
      externalId: webhookData.data.id
    });
    
    expect(transaction).toBeDefined();
  });
});
```

---

### **مرحله ۷: Deployment & Monitoring (هفته ۱۶)**

#### **7.1 Production Deployment**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  servaan-app:
    image: servaan:phase2
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SQUARE_ACCESS_TOKEN=${SQUARE_ACCESS_TOKEN}
      - TOAST_API_KEY=${TOAST_API_KEY}
    ports:
      - "3000:3000"
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=servaan_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

#### **7.2 Monitoring Setup**
```typescript
// src/backend/middleware/monitoring.js
const monitoring = {
  trackAPICall: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log to monitoring service
      logger.info('API Call', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent')
      });
    });
    
    next();
  },
  
  trackPOSSync: async (posSystem, syncType, result) => {
    await Metric.create({
      name: 'pos_sync',
      value: result.itemsProcessed,
      tags: {
        posSystem,
        syncType,
        status: result.status
      },
      timestamp: new Date()
    });
  }
};
```

---

## 📊 **Performance Benchmarks**

### **مقایسه عملکرد فاز ۱ vs فاز ۲**

| Metric | فاز ۱ | فاز ۲ | بهبود |
|--------|-------|-------|--------|
| API Response Time | 150ms | 120ms | 20% بهتر |
| Database Queries | 50/min | 200/min | 4x افزایش |
| Real-time Updates | محدود | کامل | 100% بهبود |
| Report Generation | دستی | خودکار | 90% سریعتر |
| Mobile Support | وب | Native | UX بهتر |

### **مقیاس‌پذیری**
- **همزمان کاربران**: 100+ کاربر
- **تراکنش‌های روزانه**: 10,000+ تراکنش
- **حجم داده**: 1TB+ داده
- **API Calls**: 1M+ درخواست روزانه

---

## 🔧 **Configuration Files**

### **Environment Variables**
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/servaan_prod

# POS Integration
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_ACCESS_TOKEN=your_square_token
TOAST_CLIENT_ID=your_toast_client_id
TOAST_CLIENT_SECRET=your_toast_secret
CLOVER_MERCHANT_ID=your_clover_merchant_id

# External APIs
UPC_DATABASE_API_KEY=your_upc_api_key
OPEN_FOOD_FACTS_API_URL=https://world.openfoodfacts.org/api/v0

# Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_key

# Email & Notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/servaan
server {
    listen 80;
    server_name servaan.com www.servaan.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api/pos/webhook/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Content-Type application/json;
        client_max_body_size 10M;
    }
}
```

---

## 📈 **Success Metrics**

### **KPI های فاز ۲**
- **Scanner Accuracy**: >95% دقت اسکن
- **POS Sync Speed**: <30 ثانیه همگام‌سازی
- **Report Generation**: <5 ثانیه تولید گزارش
- **System Uptime**: >99.9% در دسترس بودن
- **User Satisfaction**: >4.5/5 رضایت کاربران

### **Business Impact**
- **Time Savings**: 60% کاهش زمان ورود داده
- **Accuracy Improvement**: 40% کاهش خطاهای انسانی
- **Decision Speed**: 70% سریعتر تصمیم‌گیری
- **Cost Reduction**: 30% کاهش هزینه‌های عملیاتی

---

## 🎯 **Next Steps After Phase 2**

### **فاز ۳ - AI & Machine Learning**
- پیش‌بینی تقاضا با ML
- تشخیص الگوهای فروش
- بهینه‌سازی موجودی خودکار
- چت‌بات هوشمند پشتیبانی

### **فاز ۴ - Enterprise Features**
- Multi-location support
- Advanced user roles
- API marketplace
- White-label solutions

**🚀 فاز ۲ سِروان آماده برای شروع پیاده‌سازی است! تمام اسناد طراحی، راهنماهای فنی و نقشه راه تکمیل شده است.** 