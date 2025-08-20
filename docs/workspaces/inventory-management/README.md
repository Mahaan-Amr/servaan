# مدیریت موجودی (Inventory Management Workspace)

## نمای کلی (Overview)

فضای کاری مدیریت موجودی یکی از حیاتی‌ترین بخش‌های سیستم سِروان است که امکان مدیریت کامل موجودی کالاها، تراکنش‌های انبار، تأمین‌کنندگان و نظارت بر وضعیت موجودی را فراهم می‌کند.

## ساختار فنی (Technical Architecture)

### 📊 **دیتابیس (Database Layer)**

#### مدل‌های اصلی:
1. **Item** - کالاها
   - شناسه یکتا (UUID)
   - نام، دسته‌بندی، واحد اندازه‌گیری
   - حداقل موجودی (minStock)
   - بارکد اختیاری
   - تصویر اختیاری
   - وضعیت فعال/غیرفعال

2. **InventoryEntry** - تراکنش‌های موجودی
   - نوع تراکنش (IN/OUT)
   - مقدار، قیمت واحد
   - شماره دسته (batch)
   - تاریخ انقضا
   - یادداشت توضیحی

3. **Supplier** - تأمین‌کنندگان
   - اطلاعات تماس کامل
   - وضعیت فعال/غیرفعال
   - یادداشت‌ها

4. **ItemSupplier** - رابطه کالا-تأمین‌کننده
   - تأمین‌کننده ترجیحی
   - قیمت از هر تأمین‌کننده

#### شاخص‌های دیتابیس:
- `[itemId, type]` برای محاسبات سریع موجودی
- `[createdAt]` برای فیلتر زمانی
- `[category]` برای گروه‌بندی کالاها
- `[barcode]` برای جستجوی سریع اسکنر

### 🔧 **بک‌اند (Backend Layer)**

#### API Routes (`src/backend/src/routes/inventoryRoutes.ts`):

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/api/inventory` | دریافت لیست تراکنش‌ها (صفحه‌بندی شده) |
| GET | `/api/inventory/current` | وضعیت فعلی موجودی همه کالاها |
| GET | `/api/inventory/low-stock` | کالاهای کم موجود |
| GET | `/api/inventory/report` | گزارش حرکت موجودی |
| GET | `/api/inventory/:id` | جزئیات یک تراکنش |
| POST | `/api/inventory` | ثبت تراکنش جدید |
| PUT | `/api/inventory/:id` | ویرایش تراکنش |
| DELETE | `/api/inventory/:id` | حذف تراکنش |
| PATCH | `/api/inventory/:itemId/barcode` | بروزرسانی بارکد |
| GET | `/api/inventory/today/count` | تعداد تراکنش‌های امروز |

#### Business Logic (`src/backend/src/services/inventoryService.ts`):

**توابع محاسباتی:**
- `calculateCurrentStock()` - محاسبه موجودی فعلی
- `calculateWeightedAverageCost()` - قیمت تمام شده متوسط وزنی
- `calculateInventoryValuation()` - ارزش‌گذاری موجودی

**توابع اعتبارسنجی:**
- `validateStockEntry()` - اعتبارسنجی ورودی‌ها
- `checkStockAvailability()` - بررسی موجودی کافی
- `canDeleteInventoryEntry()` - مجوز حذف

**توابع تحلیلی:**
- `isLowStock()` - شناسایی کالاهای کم موجود
- `getStockMovements()` - تاریخچه حرکات موجودی

### 🎨 **فرانت‌اند (Frontend Layer)**

#### ساختار صفحات:
```
src/frontend/app/workspaces/inventory-management/
├── page.tsx                 # داشبورد اصلی
├── layout.tsx              # نویگیشن و Layout
├── items/
│   ├── page.tsx            # مدیریت کالاها
│   ├── add/page.tsx        # افزودن کالا جدید
│   └── [id]/page.tsx       # جزئیات/ویرایش کالا
├── inventory/
│   ├── page.tsx            # تراکنش‌های موجودی
│   └── reports/page.tsx    # گزارش‌های موجودی
├── suppliers/page.tsx       # مدیریت تأمین‌کنندگان
└── scanner/page.tsx        # اسکنر بارکد
```

#### کامپوننت‌های کلیدی:
- `LowStockAlerts` - هشدارهای موجودی کم
- داشبورد آماری با 4 کارت اصلی
- جداول داده با صفحه‌بندی و فیلتر
- فرم‌های تراکنش با اعتبارسنجی

## ویژگی‌ها (Features)

### ✅ **ویژگی‌های پیاده‌شده:**

#### 1. **داشبورد موجودی**
- **آمارهای کلیدی:**
  - کل کالاها
  - کالاهای کم موجود  
  - تراکنش‌های اخیر
  - ارزش کل موجودی
- **عملیات سریع:**
  - ثبت ورود کالا
  - ثبت خروج کالا
  - افزودن کالا جدید
  - اسکن بارکد
- **فعالیت‌های اخیر:** نمایش ۵ تراکنش اخیر
- **هشدارهای موجودی کم:** نمایش کالاهای زیر حد آستانه

#### 2. **مدیریت کالاها**
- **CRUD کامل کالاها**
- **اطلاعات کامل هر کالا:**
  - نام، دسته‌بندی، واحد
  - حداقل موجودی
  - بارکد
  - تصویر
- **نمایش وضعیت موجودی:**
  - موجود (سبز)
  - کم موجود (زرد)
  - ناموجود (قرمز)
- **آماربندی تفکیکی**

#### 3. **تراکنش‌های موجودی**
- **ثبت ورود (IN):**
  - مقدار، قیمت واحد
  - شماره دسته
  - تاریخ انقضا
  - یادداشت
- **ثبت خروج (OUT):**
  - بررسی موجودی کافی
  - ثبت قیمت فروش
  - محاسبه خودکار موجودی
- **تاریخچه کامل تراکنش‌ها**
- **فیلترهای پیشرفته:**
  - بازه زمانی
  - نوع تراکنش
  - کالای خاص

#### 4. **سیستم هشدار**
- **اعلان‌های real-time** در زمان تغییر موجودی
- **شناسایی خودکار** کالاهای کم موجود
- **نمایش هشدارها** در داشبورد

#### 5. **گزارش‌گیری**
- **گزارش حرکت موجودی** با فیلترهای زمانی
- **خلاصه تراکنش‌ها** به تفکیک کالا
- **محاسبات خودکار:**
  - کل ورودی/خروجی
  - خالص تغییرات

#### 6. **اسکنر بارکد**
- **پشتیبانی از انواع بارکد**
- **جستجوی سریع** کالاها
- **ثبت تاریخچه اسکن**
- **integration با دیتابیس خارجی** (OpenFoodFacts)

#### 7. **مدیریت تأمین‌کنندگان**
- **CRUD کامل تأمین‌کنندگان**
- **ارتباط با کالاها** (Many-to-Many)
- **تأمین‌کننده ترجیحی** برای هر کالا
- **قیمت‌گذاری** از هر تأمین‌کننده

#### 8. **محاسبات مالی**
- **ارزش‌گذاری موجودی** به روش میانگین وزنی
- **محاسبه قیمت تمام شده**
- **پیگیری قیمت‌های خرید/فروش**

## معماری امنیت (Security Architecture)

### 🔐 **سطوح دسترسی:**
- **ADMIN:** دسترسی کامل
- **MANAGER:** مدیریت + ویرایش/حذف تراکنش‌ها
- **STAFF:** مشاهده + ثبت تراکنش جدید
- **WAREHOUSE:** متخصص انبار

### 🛡️ **اعتبارسنجی:**
- **Zod Schema Validation** در backend
- **JWT Authentication** برای همه API ها
- **Role-based Authorization** برای عملیات حساس

## یکپارچگی سیستم (System Integration)

### 🔗 **ارتباط با سایر ماژول‌ها:**
- **Business Intelligence:** آمار و تحلیل موجودی
- **Accounting:** ثبت تراکنش‌های مالی
- **CRM:** پیگیری فروش به مشتریان
- **Notification System:** اعلان‌های موجودی

### 📊 **داده‌های مشترک:**
- تراکنش‌های فروش برای BI
- محاسبه قیمت تمام شده
- هشدارهای موجودی کم

## نکات فنی مهم (Technical Notes)

### ⚡ **بهینه‌سازی:**
- **Compound Indexes** برای query های سریع
- **Pagination** برای dataset های بزرگ
- **Real-time Calculations** با کش مناسب

### 🔄 **مدیریت State:**
- **React Hooks** برای state management
- **Context API** برای workspace state
- **Optimistic Updates** برای UX بهتر

### 📱 **Responsive Design:**
- **Mobile-first** approach
- **Touch-friendly** interface برای اسکنر
- **Dark Mode** support

## وضعیت فعلی پروژه (Current Status)

### ✅ **تکمیل شده:**
- [x] Database Schema کامل
- [x] Backend API های اصلی
- [x] Frontend Components پایه
- [x] Authentication & Authorization
- [x] Basic CRUD Operations
- [x] Dashboard با آمار real-time
- [x] Low Stock Detection
- [x] Transaction History
- [x] Barcode Scanner Integration

### 🚧 **در حال توسعه:**
- [ ] Advanced Reporting
- [ ] Batch Operations
- [ ] Export/Import Features
- [ ] Advanced Filters
- [ ] Mobile App Integration

### 📈 **آینده (Future Plans):**
- [ ] AI-powered Stock Prediction
- [ ] Advanced Analytics
- [ ] Multi-warehouse Support
- [ ] Integration with External APIs
- [ ] Advanced Barcode Features

---

> **نکته:** این workspace به طور کامل عملیاتی است و آماده استفاده در محیط production می‌باشد. 