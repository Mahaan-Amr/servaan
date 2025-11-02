# ویژگی‌های مدیریت موجودی
# Inventory Management Features

## نمای کلی ویژگی‌ها (Features Overview)

سیستم مدیریت موجودی شامل ۸ ویژگی اصلی است که امکان مدیریت کامل فرآیندهای انبارداری را فراهم می‌کند.

## 1. داشبورد موجودی (Inventory Dashboard) 📊

### عملکرد:
داشبورد مرکزی که نمای کلی از وضعیت موجودی را ارائه می‌دهد.

### ویژگی‌های کلیدی:

#### آمارهای Real-time:
```typescript
interface DashboardStats {
  totalItems: number;           // کل کالاها
  lowStockCount: number;        // کالاهای کم موجود
  recentTransactions: number;   // تراکنش‌های اخیر
  totalInventoryValue: number;  // ارزش کل موجودی (ریال)
}
```

#### کارت‌های آماری:
- **کل کالاها**: تعداد کل اقلام فعال در سیستم
- **کالاهای کم موجود**: تعداد کالاهای زیر حد آستانه
- **تراکنش‌های اخیر**: تعداد تراکنش‌های ۳۰ روز گذشته
- **ارزش موجودی**: ارزش کل موجودی بر اساس قیمت تمام شده

#### عملیات سریع:
```typescript
const quickActions = [
  {
    title: 'ثبت ورود کالا',
    href: '/inventory/add-in',
    color: 'green'
  },
  {
    title: 'ثبت خروج کالا', 
    href: '/inventory/add-out',
    color: 'red'
  },
  {
    title: 'افزودن کالای جدید',
    href: '/items/add',
    color: 'blue'
  },
  {
    title: 'اسکن بارکد',
    href: '/scanner',
    color: 'purple'
  }
];
```

#### فعالیت‌های اخیر:
- نمایش ۵ تراکنش اخیر
- اطلاعات کاربر انجام‌دهنده
- زمان انجام (time ago format)
- نوع و مقدار تراکنش

## 2. مدیریت کالاها (Items Management) 📦

### عملکرد:
مدیریت کامل اطلاعات کالاها و محصولات.

### ویژگی‌های CRUD:

#### ایجاد کالا (Create):
```typescript
interface CreateItem {
  name: string;           // نام کالا
  category: string;       // دسته‌بندی
  unit: string;           // واحد اندازه‌گیری
  minStock?: number;      // حداقل موجودی
  description?: string;   // توضیحات
  barcode?: string;       // بارکد
  image?: string;         // تصویر
}
```

#### مشاهده و جستجو (Read):
- **لیست کامل کالاها** با pagination
- **فیلتر بر اساس دسته‌بندی**
- **جستجو در نام کالا**
- **نمایش وضعیت موجودی** برای هر کالا

#### ویرایش (Update):
- ویرایش اطلاعات پایه کالا
- بروزرسانی حداقل موجودی
- تغییر دسته‌بندی
- بروزرسانی بارکد

#### حذف (Delete):
- حذف منطقی کالا (soft delete)
- تغییر وضعیت به غیرفعال
- حفظ تاریخچه تراکنش‌ها

### نمایش وضعیت موجودی:
```typescript
const getStockStatus = (current: number, minStock: number) => {
  if (current <= 0) return { status: 'out', color: 'red', text: 'ناموجود' };
  if (current <= minStock) return { status: 'low', color: 'yellow', text: 'کم موجود' };
  return { status: 'good', color: 'green', text: 'موجود' };
};
```

### آماربندی تفکیکی:
- تعداد کالاهای موجود
- تعداد کالاهای کم موجود  
- تعداد کالاهای ناموجود
- کل کالاهای فعال

## 3. تراکنش‌های موجودی (Inventory Transactions) 🔄

### عملکرد:
ثبت و مدیریت کلیه ورود و خروج کالاها.

### انواع تراکنش:

#### ورود کالا (IN Transaction):
```typescript
interface InTransaction {
  itemId: string;
  quantity: number;        // مقدار ورودی (مثبت)
  unitPrice: number;       // قیمت خرید واحد
  batchNumber?: string;    // شماره دسته
  expiryDate?: Date;       // تاریخ انقضا
  note?: string;          // یادداشت
}
```

**اعتبارسنجی ورودی:**
- مقدار باید مثبت باشد
- قیمت واحد الزامی است
- تاریخ انقضا باید در آینده باشد

#### خروج کالا (OUT Transaction):
```typescript
interface OutTransaction {
  itemId: string;
  quantity: number;        // مقدار خروجی (مثبت)
  unitPrice?: number;      // قیمت فروش (اختیاری)
  note?: string;          // دلیل خروج
}
```

**بررسی موجودی:**
```typescript
const validateOutTransaction = async (itemId: string, quantity: number) => {
  const currentStock = await calculateCurrentStock(itemId);
  if (currentStock < quantity) {
    throw new Error(`موجودی کافی نیست. موجودی فعلی: ${currentStock}`);
  }
};
```

### ویژگی‌های پیشرفته:

#### محاسبات خودکار:
- به‌روزرسانی موجودی فعلی
- محاسبه قیمت تمام شده میانگین وزنی
- ارزش‌گذاری موجودی

#### اعلان‌های هوشمند:
```typescript
const sendInventoryNotification = async (transaction: InventoryEntry) => {
  const newStock = await calculateCurrentStock(transaction.itemId);
  const item = await getItem(transaction.itemId);
  
  if (newStock <= item.minStock) {
    await notificationService.send({
      type: 'LOW_STOCK_ALERT',
      itemId: transaction.itemId,
      currentStock: newStock,
      threshold: item.minStock
    });
  }
};
```

### تاریخچه و گزارش‌گیری:
- مشاهده کامل تاریخچه تراکنش‌ها
- فیلتر بر اساس بازه زمانی
- فیلتر بر اساس نوع تراکنش
- فیلتر بر اساس کالای خاص

## 4. سیستم هشدار (Alert System) 🚨

### عملکرد:
شناسایی و اعلان کالاهای کم موجود.

### منطق تشخیص:
```typescript
const detectLowStock = async () => {
  const items = await prisma.item.findMany({ where: { isActive: true } });
  const lowStockItems = [];
  
  for (const item of items) {
    const currentStock = await calculateCurrentStock(item.id);
    const threshold = item.minStock || 10; // پیش‌فرض: ۱۰ واحد
    
    if (currentStock <= threshold) {
      lowStockItems.push({
        itemId: item.id,
        itemName: item.name,
        currentStock,
        threshold,
        severity: currentStock === 0 ? 'critical' : 'warning'
      });
    }
  }
  
  return lowStockItems;
};
```

### نمایش هشدارها:
- **کامپوننت LowStockAlerts** در داشبورد
- رنگ‌بندی بر اساس شدت:
  - قرمز: ناموجود (currentStock = 0)
  - نارنجی: بحرانی (currentStock < minStock/2)
  - زرد: کم موجود (currentStock <= minStock)

### اعلان‌های Real-time:
- نمایش alert در زمان ثبت تراکنش
- اعلان browser notification
- ایمیل/SMS برای مدیران (در صورت فعال بودن)

## 5. گزارش‌گیری (Reporting) 📈

### گزارش حرکت موجودی:

#### پارامترهای فیلتر:
```typescript
interface ReportFilter {
  startDate?: Date;    // از تاریخ
  endDate?: Date;      // تا تاریخ
  itemId?: string;     // کالای خاص
  type?: 'IN' | 'OUT'; // نوع تراکنش
}
```

#### خروجی گزارش:
```typescript
interface InventoryReport {
  entries: InventoryEntry[];           // لیست تراکنش‌ها
  summary: {
    totalEntries: number;              // کل تراکنش‌ها
    totalIn: number;                   // کل ورودی
    totalOut: number;                  // کل خروجی
    netChange: number;                 // خالص تغییرات
    itemSummary: Record<string, {      // خلاصه به تفکیک کالا
      name: string;
      totalIn: number;
      totalOut: number;
      net: number;
    }>;
  };
}
```

### گزارش ارزش‌گذاری موجودی:
```typescript
interface ValuationReport {
  totalValue: number;                  // کل ارزش موجودی
  items: Array<{
    itemId: string;
    itemName: string;
    currentStock: number;
    averageCost: number;               // قیمت تمام شده میانگین
    totalValue: number;                // ارزش کل (stock × avgCost)
  }>;
  generatedAt: Date;
}
```

## 6. اسکنر بارکد (Barcode Scanner) 📱

### عملکرد:
اسکن و شناسایی کالاها از طریق بارکد.

### پشتیبانی از فرمت‌ها:
```typescript
enum BarcodeFormat {
  EAN_13 = 'EAN_13',
  EAN_8 = 'EAN_8', 
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  CODE_128 = 'CODE_128',
  CODE_39 = 'CODE_39',
  ITF = 'ITF',
  QR_CODE = 'QR_CODE'
}
```

### فرآیند اسکن:
1. **شناسایی بارکد** توسط دوربین
2. **جستجو در دیتابیس محلی** برای یافتن کالا
3. **جستجو در API خارجی** در صورت عدم وجود
4. **ذخیره تاریخچه اسکن**
5. **نمایش نتیجه** به کاربر

### تاریخچه اسکن:
```typescript
interface ScanHistory {
  id: string;
  userId: string;
  code: string;                // بارکد اسکن شده
  format: BarcodeFormat;       // فرمت بارکد
  scanMode: 'BARCODE' | 'QR';  // نوع اسکن
  itemFound: boolean;          // آیا کالا پیدا شد؟
  itemId?: string;             // شناسه کالا (در صورت وجود)
  metadata?: any;              // اطلاعات اضافی
  createdAt: Date;
}
```

### Integration با External APIs:
```typescript
const fetchExternalBarcodeData = async (barcode: string) => {
  try {
    // OpenFoodFacts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1) {
      return {
        barcode,
        productName: data.product.product_name,
        brand: data.product.brands,
        category: data.product.categories,
        imageUrl: data.product.image_url
      };
    }
  } catch (error) {
    console.error('External API error:', error);
  }
  
  return null;
};
```

## 7. مدیریت تأمین‌کنندگان (Suppliers Management) 🏢

### عملکرد:
مدیریت اطلاعات تأمین‌کنندگان و ارتباط آنها با کالاها.

### اطلاعات تأمین‌کننده:
```typescript
interface Supplier {
  id: string;
  name: string;              // نام شرکت
  contactName?: string;      // نام شخص تماس
  email?: string;            // ایمیل
  phoneNumber?: string;      // شماره تلفن
  address?: string;          // آدرس
  notes?: string;            // یادداشت‌ها
  isActive: boolean;         // وضعیت فعال/غیرفعال
}
```

### ارتباط با کالاها (Many-to-Many):
```typescript
interface ItemSupplier {
  itemId: string;
  supplierId: string;
  preferredSupplier: boolean; // تأمین‌کننده ترجیحی
  unitPrice?: number;         // قیمت از این تأمین‌کننده
}
```

### ویژگی‌های کلیدی:
- تعریف تأمین‌کننده ترجیحی برای هر کالا
- ثبت قیمت از تأمین‌کنندگان مختلف
- مقایسه قیمت‌ها
- تاریخچه خریدها از هر تأمین‌کننده

## 8. محاسبات مالی (Financial Calculations) 💰

### قیمت تمام شده میانگین وزنی:
```typescript
const calculateWeightedAverageCost = async (itemId: string) => {
  const entries = await prisma.inventoryEntry.findMany({
    where: { itemId, type: 'IN', unitPrice: { not: null } },
    select: { quantity: true, unitPrice: true }
  });
  
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalValue = entries.reduce((sum, entry) => 
    sum + (entry.quantity * entry.unitPrice), 0
  );
  
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
};
```

### ارزش‌گذاری موجودی:
```typescript
const calculateInventoryValuation = async () => {
  const items = await getActiveItems();
  let totalValue = 0;
  const itemValues = [];
  
  for (const item of items) {
    const currentStock = await calculateCurrentStock(item.id);
    const averageCost = await calculateWeightedAverageCost(item.id);
    const itemValue = currentStock * averageCost;
    
    totalValue += itemValue;
    itemValues.push({
      itemId: item.id,
      itemName: item.name,
      currentStock,
      averageCost,
      totalValue: itemValue
    });
  }
  
  return { totalValue, items: itemValues };
};
```

### محاسبه سود فروش:
```typescript
const calculateProfitMargin = (
  sellingPrice: number, 
  averageCost: number
) => {
  const profit = sellingPrice - averageCost;
  const margin = (profit / sellingPrice) * 100;
  return { profit, margin };
};
```

## اعتبارسنجی و کنترل کیفیت (Validation & Quality Control)

### اعتبارسنجی ورودی:
```typescript
const validateInventoryEntry = (entry: CreateInventoryEntry) => {
  const errors = [];
  
  // بررسی مقدار
  if (entry.quantity <= 0) {
    errors.push('مقدار باید مثبت باشد');
  }
  
  // بررسی قیمت برای ورودی
  if (entry.type === 'IN' && (!entry.unitPrice || entry.unitPrice <= 0)) {
    errors.push('قیمت واحد برای ورودی الزامی است');
  }
  
  // بررسی تاریخ انقضا
  if (entry.expiryDate && new Date(entry.expiryDate) <= new Date()) {
    errors.push('تاریخ انقضا باید در آینده باشد');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### کنترل دسترسی:
```typescript
const checkPermissions = (user: User, action: string) => {
  const permissions = {
    'VIEW_INVENTORY': ['ADMIN', 'MANAGER', 'STAFF', 'WAREHOUSE'],
    'CREATE_TRANSACTION': ['ADMIN', 'MANAGER', 'STAFF', 'WAREHOUSE'],
    'EDIT_TRANSACTION': ['ADMIN', 'MANAGER'],
    'DELETE_TRANSACTION': ['ADMIN', 'MANAGER'],
    'MANAGE_ITEMS': ['ADMIN', 'MANAGER'],
    'MANAGE_SUPPLIERS': ['ADMIN', 'MANAGER']
  };
  
  return permissions[action]?.includes(user.role) || false;
};
```

---

## 🔄 Alignment with Current Implementation (2025-10-20)
- Implemented: low-stock alerts, WAC, menu availability sync, order stock validation, recipe cost sync
- Planned: `/api/inventory/current`, `/api/inventory/report`, `/api/inventory/valuation`, scanner REST endpoints; use `/api/analytics/summary` for valuation meanwhile
- See `../../common_invariants.md` for currency/date/stock rules 