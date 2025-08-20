# سِروان (Servaan)

## سیستم جامع مدیریت کافه و رستوران

سِروان یک وب‌اپلیکیشن جامع مدیریت کافه‌ها و رستوران‌ها است که به کسب‌وکارهای ایرانی امکان مدیریت کامل موجودی، حسابداری، تحلیل‌های تجاری و گزارش‌گیری پیشرفته را ارائه می‌دهد.

## 🎉 وضعیت پروژه

**فاز 1**: ✅ **100% تکمیل شده** - سیستم مدیریت موجودی کامل  
**فاز 2**: ✅ **100% تکمیل شده** - ویژگی‌های پیشرفته شامل حسابداری ایرانی

## قابلیت‌های اصلی

### 📦 **مدیریت موجودی**
- مدیریت کالاها و دسته‌بندی‌ها
- ثبت ورود و خروج کالا
- محاسبه موجودی فعلی real-time
- هشدار موجودی کم

### 💰 **سیستم حسابداری ایرانی کامل**
- دفتر حساب‌های استاندارد ایرانی (45 حساب)
- حسابداری دوطرفه با اعتبارسنجی خودکار
- مدیریت اسناد حسابداری (ایجاد، تصویب، ابطال)
- صورت‌های مالی (ترازنامه، سود و زیان، جریان وجه نقد)
- نسبت‌های مالی و تحلیل‌های پیشرفته
- مراکز هزینه و بودجه‌بندی
- تولید خودکار اسناد از فروش و خرید

### 📱 **QR/Barcode Scanner**
- اسکن بارکد/QR با دوربین مرورگر
- تشخیص هوشمند کالا
- ورود/خروج انبوه با اسکن
- تاریخچه کامل اسکن‌ها

### 📊 **Business Intelligence**
- داشبورد تحلیل‌های تجاری
- KPI های کلیدی عملکرد
- تحلیل ABC، سودآوری، روندها
- نمودارهای تعاملی پیشرفته
- گزارش‌ساز سفارشی کامل

### 🔔 **Real-time Notifications**
- اعلان‌های فوری WebSocket
- اعلان‌های مرورگر
- سیستم اولویت‌بندی
- پشتیبانی کامل فارسی

### 👥 **مدیریت کاربران**
- سطوح دسترسی مختلف (ADMIN، MANAGER، STAFF)
- احراز هویت JWT
- مدیریت پروفایل کاربری

### 🏢 **مدیریت تأمین‌کنندگان**
- مدیریت اطلاعات تأمین‌کنندگان
- ارتباط با کالاها
- قیمت‌گذاری و مقایسه

### 📋 **گزارش‌گیری پیشرفته**
- گزارش‌های آماری و مالی
- خروجی چندفرمته (Excel، PDF، CSV، JSON)
- فیلترهای پیشرفته
- گزارش‌ساز سفارشی با رابط Drag & Drop

## تکنولوژی‌های استفاده شده

### **Frontend**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Real-time**: Socket.IO Client

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript/TypeScript
- **Database ORM**: Prisma
- **Authentication**: JWT
- **Real-time**: Socket.IO Server

### **Database**
- **Primary**: PostgreSQL
- **Deployment**: Docker Container
- **Migration**: Prisma Migrate

### **DevOps**
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest (51/51 tests passing)
- **Code Quality**: ESLint, Prettier

## 📊 آمار پروژه

- **📁 فایل‌ها**: 150+ فایل TypeScript/JavaScript
- **🔌 API Endpoints**: 65+ endpoint آماده
- **🗄️ Database Tables**: 21 جدول کامل
- **💰 Accounting Features**: 25+ endpoint حسابداری، 11 مدل، 45 حساب استاندارد، 5 صفحه Frontend
- **🧪 تست‌ها**: 51/51 موفق (100% Success Rate)
- **⚡ Performance**: <200ms response time
- **🔒 Security**: JWT، Role-based Access، Password Hashing

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js (نسخه 18 یا بالاتر)
- Docker و Docker Compose
- npm یا yarn

### مراحل راه‌اندازی

1. کلون کردن مخزن:
```bash
git clone https://github.com/yourusername/servaan.git
cd servaan
```

2. نصب وابستگی‌ها:
```bash
npm install
```

3. راه‌اندازی دیتابیس با Docker:
```bash
npm run docker:up
```

4. تنظیم فایل‌های محیطی:
```bash
cp .env.example .env
```

5. ایجاد مدل‌های Prisma و مهاجرت‌ها:
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. اجرای پروژه در محیط توسعه:
```bash
npm run dev
```

## ساختار پروژه

```
servaan/
├── src/
│   ├── frontend/       # Next.js application
│   │   ├── app/        # App Router pages
│   │   ├── components/ # React components
│   │   └── services/   # API services
│   ├── backend/        # Express API
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── controllers/# Route controllers
│   ├── prisma/         # Prisma schema and migrations
│   └── shared/         # Shared types and utilities
├── docs/               # Documentation
└── docker-compose.yml  # Docker configuration
```

## 🚀 اولویت‌های توسعه آینده

1. **🛒 POS Integration** (6-8 هفته) - اتصال با سیستم‌های فروش
2. **📱 Mobile App (PWA)** (8 هفته) - اپلیکیشن موبایل
3. **🤖 AI Features** (10 هفته) - پیش‌بینی تقاضا و بهینه‌سازی

## مستندات

برای اطلاعات بیشتر به پوشه [docs](/docs) مراجعه کنید:

- [نمای کلی پروژه](docs/project_overview.md)
- [وضعیت پروژه](docs/status.md)
- [نقشه راه](docs/roadmap.md)
- [سیستم حسابداری](docs/accounting_system_design.md)
- [مشخصات فنی](docs/technical_specifications.md)

## لایسنس

MIT 