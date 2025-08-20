# راهنمای نصب و راه‌اندازی سِروان

این راهنما مراحل نصب و راه‌اندازی پروژه سِروان را شرح می‌دهد. **پروژه 100% آماده برای استفاده در محیط تولید است.**

## 🎯 **وضعیت پروژه**

**✅ آماده برای تولید** - تمام سیستم‌ها تست شده و کاملاً کارآمد هستند:
- **✅ Backend API** - کاملاً تست شده (51/51 تست موفق)
- **✅ Database** - PostgreSQL با داده‌های seed شده
- **✅ Frontend** - Next.js 14 با **Workspace Architecture** کامل
- **✅ Authentication** - JWT با کنترل نقش‌های کاربری پیشرفته
- **✅ Real-time Notifications** - WebSocket با Socket.IO
- **✅ Scanner System** - بارکد/QR اسکنر با WebRTC
- **✅ Business Intelligence** - داشبورد تحلیلی پیشرفته
- **✅ Iranian Accounting** - سیستم حسابداری ایرانی کامل
- **✅ Workspace Architecture** - 5 فضای کاری اختصاصی با محیط‌های مجزا
- **✅ Testing** - زیرساخت تست کامل

## پیش‌نیازها

قبل از نصب و راه‌اندازی پروژه، اطمینان حاصل کنید که موارد زیر روی سیستم شما نصب شده باشند:

- [Node.js](https://nodejs.org/) نسخه 18 یا بالاتر
- [npm](https://www.npmjs.com/) نسخه 8 یا بالاتر
- [Docker](https://www.docker.com/) و [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

## مراحل نصب

### ۱. کلون کردن مخزن

ابتدا مخزن پروژه را کلون کنید:

```bash
git clone https://github.com/your-username/servaan.git
cd servaan
```

### ۲. نصب وابستگی‌ها

وابستگی‌های اصلی پروژه را نصب کنید:

```bash
npm install
cd src/backend && npm install
cd ../frontend && npm install
cd ../..
```

یا می‌توانید از دستور زیر استفاده کنید که تمام وابستگی‌ها را به صورت اتوماتیک نصب می‌کند:

```bash
npm run setup
```

**🔔 وابستگی‌های Real-time:**
پروژه شامل وابستگی‌های زیر برای سیستم اعلان‌های real-time است:
- `socket.io` - WebSocket server
- `socket.io-client` - WebSocket client

### ۳. تنظیم فایل‌های محیطی

#### فایل `.env` اصلی پروژه:

```env
# Database Configuration (Updated Credentials)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=servaan
DB_USER=postgres
DB_PASSWORD=hiddenitch1739

# Backend Configuration
BACKEND_PORT=3001
API_URL=http://localhost:3001/api

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# JWT Configuration
JWT_SECRET=servaan-super-secret-key-for-production
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=development

# Prisma Database URL (Updated Password)
DATABASE_URL=postgresql://postgres:hiddenitch1739@localhost:5432/servaan
```

#### فایل `.env.test` برای تست (در `src/backend/`):

```env
NODE_ENV=test
DATABASE_URL="postgresql://postgres:hiddenitch1739@localhost:5432/servaan_test"
TEST_DATABASE_URL="postgresql://postgres:hiddenitch1739@localhost:5432/servaan_test"
JWT_SECRET="test-jwt-secret-key-for-testing"
JWT_EXPIRES_IN="1h"
DEBUG_TESTS=true
```

#### فایل `.env.local` برای فرانت‌اند (در `src/frontend/`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### ۴. راه‌اندازی دیتابیس

با استفاده از Docker Compose، دیتابیس PostgreSQL و پنل مدیریت pgAdmin را راه‌اندازی کنید:

```bash
npm run docker:up
```

### ۵. ایجاد مدل‌های Prisma و مهاجرت‌ها

فایل `.env` را به پوشه `src/prisma` کپی کنید:

```bash
cp .env src/prisma/.env
```

سپس مدل‌های Prisma را تولید کرده و مهاجرت‌ها را اجرا کنید:

```bash
cd src/prisma
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

**🔔 جداول جدید:**
مهاجرت شامل جداول زیر برای ویژگی‌های جدید است:
- `Notification` - سیستم اعلان‌های real-time
- `ScanHistory` - تاریخچه اسکن بارکد/QR
- `ExternalBarcodeData` - کش داده‌های بارکد خارجی

### ۶. **تولید داده‌های تست (Seed Database)**

پایگاه داده را با داده‌های کامل تست پر کنید:

```bash
cd src/prisma
node seed.js
cd ../..
```

**✅ پس از seed، داده‌های زیر آماده استفاده خواهند بود:**
- **5 کاربر تست** با نقش‌های مختلف
- **5 تأمین‌کننده** با اطلاعات کامل
- **11 کالای متنوع** در دسته‌بندی‌های مختلف
- **20 تراکنش انبار** با سابقه واقعی
- **نمونه اعلان‌ها** برای تست سیستم real-time

### ۷. اجرای پروژه در محیط توسعه

پروژه را در محیط توسعه اجرا کنید:

```bash
npm run dev
```

این دستور هم فرانت‌اند و هم بک‌اند را به صورت همزمان اجرا می‌کند.

**🔔 پس از اجرا، سیستم‌های زیر فعال خواهند شد:**
- **WebSocket server** روی پورت 3001
- **اعلان‌های فوری** برای تغییرات موجودی
- **نوتیفیکیشن بل** در نوار بالا
- **Browser notifications** (با اجازه کاربر)
- **Scanner system** با دسترسی به دوربین
- **Business Intelligence** داشبورد تحلیلی

## 🚀 **اجرای تست‌ها (اختیاری)**

برای اطمینان از صحت نصب، می‌توانید تست‌های اتوماتیک را اجرا کنید:

```bash
cd src/backend

# تست اتصال دیتابیس
npm run test:db

# اجرای تمام تست‌ها (51/51 تست موفق)
npm run test:unit

# اجرای تست با خروجی دیباگ
DEBUG_TESTS=true npm run test:unit
```

**🔔 تست سیستم اعلان‌ها:**
```bash
# تست اعلان‌های real-time
cd src/backend
node test-notifications.js
```

## دسترسی به پروژه

پس از اجرای موفقیت‌آمیز پروژه، می‌توانید به بخش‌های مختلف آن از طریق آدرس‌های زیر دسترسی داشته باشید:

- **فرانت‌اند**: http://localhost:3000
- **API بک‌اند**: http://localhost:3001/api
- **WebSocket Server**: ws://localhost:3001 (اتوماتیک)
- **پنل مدیریت دیتابیس (pgAdmin)**: http://localhost:5050
  - Email: admin@servaan.local
  - Password: admin

## 🔔 **ویژگی‌های Real-time**

پس از ورود به سیستم، ویژگی‌های زیر فعال خواهند شد:

### **اعلان‌های فوری:**
- **تغییرات موجودی** - هنگام ثبت تراکنش‌های ورود/خروج
- **کمبود موجودی** - هشدار برای کالاهای کمیاب
- **فعالیت‌های کاربران** - ایجاد کالا، تأمین‌کننده، کاربر جدید

### **نوتیفیکیشن بل:**
- **شمارش real-time** اعلان‌های خوانده نشده
- **دسته‌بندی بر اساس اولویت** (فوری، بالا، متوسط، کم)
- **فرمت زمان فارسی** برای اعلان‌ها
- **امکان علامت‌گذاری** به عنوان خوانده شده

### **وضعیت اتصال:**
- **نشانگر اتصال** در نوتیفیکیشن بل
- **اتصال مجدد خودکار** در صورت قطع شدن
- **اعلان وضعیت** متصل/قطع شده

## 📱 **سیستم اسکنر**

پس از ورود، سیستم اسکنر بارکد/QR در دسترس خواهد بود:

### **ویژگی‌های اسکنر:**
- **دسترسی به دوربین** - WebRTC برای استفاده از دوربین مرورگر
- **تشخیص چندفرمته** - EAN-13، EAN-8، UPC-A، Code 128، QR Code
- **تشخیص هوشمند** - جستجوی خودکار کالا در دیتابیس
- **API خارجی** - جستجو در Open Food Facts برای کالاهای جدید
- **ایجاد خودکار** - ایجاد کالای جدید از بارکد
- **تاریخچه اسکن** - ثبت تمام اسکن‌ها با جزئیات

### **دسترسی به اسکنر:**
- **صفحه اسکنر**: http://localhost:3000/scanner
- **اجازه دوربین** - مرورگر درخواست اجازه دسترسی خواهد کرد

## 📊 **داشبورد هوش تجاری**

سیستم تحلیل پیشرفته با ویژگی‌های زیر:

### **KPI های کلیدی:**
- **درآمد کل** - با مقایسه دوره‌ای
- **سود خالص** - تحلیل تغییرات
- **حاشیه سود** - با هدف‌گذاری
- **گردش موجودی** - بار در سال
- **میانگین ارزش سفارش** - تحلیل تراکنش‌ها
- **نرخ کمبود موجودی** - آمار کالاهای ناموجود

### **تحلیل‌های پیشرفته:**
- **تحلیل ABC** - دسته‌بندی محصولات بر اساس قانون پارتو
- **تحلیل سودآوری** - سودآوری محصولات و دسته‌بندی‌ها
- **تحلیل روندها** - روندها و پیش‌بینی‌ها

### **نمودارهای تعاملی:**
- **روند درآمد** - نمودار خطی روزانه
- **محصولات برتر** - نمودار ستونی پرفروش‌ترین‌ها
- **توزیع دسته‌بندی** - نمودار دایره‌ای فروش

### **دسترسی به BI:**
- **داشبورد اصلی**: http://localhost:3000/business-intelligence
- **تحلیل ABC**: http://localhost:3000/business-intelligence/abc-analysis
- **تحلیل سودآوری**: http://localhost:3000/business-intelligence/profit-analysis
- **تحلیل روندها**: http://localhost:3000/business-intelligence/trend-analysis

## 👥 **حساب‌های کاربری آماده**

برای تست سیستم، حساب‌های زیر آماده شده‌اند:

```
👑 مدیر سیستم (Admin):
   Email: admin@servaan.com
   Password: admin123
   دسترسی: کامل به تمام بخش‌ها

👔 مدیر (Manager):
   Email: manager@servaan.com
   Password: manager123
   دسترسی: مدیریت موجودی، گزارش‌ها، BI

👤 کارمند (Staff):
   Email: staff@servaan.com
   Password: staff123
   دسترسی: ثبت موجودی، مشاهده گزارش‌ها

🏪 مدیر انبار:
   Email: warehouse@servaan.com
   Password: manager123
   دسترسی: مدیریت کامل موجودی

💼 کارمند فروش:
   Email: sales@servaan.com
   Password: staff123
   دسترسی: اسکنر، ثبت فروش
```

## 🔧 **تنظیمات پیشرفته**

### **تنظیمات WebSocket:**
```env
# در فایل .env
FRONTEND_URL=http://localhost:3000  # برای CORS
WEBSOCKET_PORT=3001                 # پورت WebSocket (همان backend)
```

### **تنظیمات اسکنر:**
```env
# در فایل .env.local فرانت‌اند
NEXT_PUBLIC_SCANNER_ENABLED=true
NEXT_PUBLIC_EXTERNAL_API_ENABLED=true
```

### **تنظیمات BI:**
```env
# در فایل .env
BI_CACHE_DURATION=300000           # 5 دقیقه کش
BI_AUTO_REFRESH=true               # رفرش خودکار
```

## 🚨 **عیب‌یابی**

### **مشکلات رایج:**

#### **WebSocket اتصال برقرار نمی‌شود:**
```bash
# بررسی پورت backend
netstat -an | grep 3001

# بررسی لاگ‌های backend
npm run dev:backend
```

#### **اسکنر کار نمی‌کند:**
- اجازه دسترسی به دوربین را بررسی کنید
- از HTTPS استفاده کنید (برای production)
- مرورگر Chrome یا Firefox استفاده کنید

#### **اعلان‌ها نمایش داده نمی‌شوند:**
```bash
# تست اتصال WebSocket
cd src/backend
node test-notifications.js
```

#### **BI داده نمایش نمی‌دهد:**
```bash
# بررسی داده‌های seed
cd src/prisma
node seed.js
```

### **لاگ‌های مفید:**
```bash
# لاگ‌های WebSocket
DEBUG=socket.io* npm run dev:backend

# لاگ‌های اسکنر
DEBUG=scanner* npm run dev:backend

# لاگ‌های BI
DEBUG=bi* npm run dev:backend
```

## 📚 **مستندات بیشتر**

برای اطلاعات بیشتر، مستندات زیر را مطالعه کنید:

- **معماری سیستم**: `docs/architecture.md`
- **راهنمای توسعه**: `docs/technical_specifications.md`
- **وضعیت پروژه**: `docs/status.md`
- **لیست وظایف**: `docs/todos.md`

## 🎉 **تبریک!**

سیستم سِروان با موفقیت نصب شد. تمام ویژگی‌های زیر آماده استفاده هستند:

✅ **مدیریت موجودی** - ثبت و پیگیری کالاها  
✅ **اعلان‌های real-time** - اطلاع‌رسانی فوری  
✅ **اسکنر بارکد/QR** - ثبت سریع با دوربین  
✅ **هوش تجاری** - تحلیل‌های پیشرفته  
✅ **گزارش‌گیری** - خروجی چندفرمته  
✅ **مدیریت کاربران** - کنترل دسترسی  
✅ **رابط فارسی** - پشتیبانی کامل RTL  

**🚀 سیستم آماده استفاده در محیط تولید است!** 