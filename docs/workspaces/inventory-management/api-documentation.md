# مستندات API مدیریت موجودی
# Inventory Management API Documentation

## نمای کلی API (API Overview)

سیستم مدیریت موجودی دارای مجموعه کاملی از API endpoint ها است که امکان مدیریت کامل موجودی، کالاها، تراکنش‌ها و تأمین‌کنندگان را فراهم می‌کند.

**Base URL:** `http://localhost:3001/api`

**Authentication:** Bearer Token (JWT)

**Content-Type:** `application/json`

## Authentication & Authorization

### Headers مورد نیاز:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

### سطوح دسترسی:
- **ADMIN**: دسترسی کامل
- **MANAGER**: مدیریت + ویرایش/حذف 
- **STAFF**: مشاهده + ثبت تراکنش
- **WAREHOUSE**: متخصص انبار

## 1. Inventory Transactions API

### 1.1 دریافت لیست تراکنش‌ها

```http
GET /api/inventory
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | شماره صفحه |
| limit | number | 50 | تعداد آیتم در صفحه |
| sortBy | string | createdAt | فیلد مرتب‌سازی |
| sortOrder | string | desc | نحوه مرتب‌سازی (asc/desc) |

**Response:**
```json
[
  {
    "id": "uuid",
    "itemId": "uuid",
    "item": {
      "id": "uuid",
      "name": "شیر پر چرب",
      "category": "لبنیات",
      "unit": "لیتر"
    },
    "quantity": 10,
    "type": "IN",
    "note": "خرید از تأمین‌کننده اصلی",
    "unitPrice": 45000,
    "batchNumber": "B-2025001",
    "expiryDate": "2025-07-15T00:00:00.000Z",
    "userId": "uuid",
    "user": {
      "id": "uuid",
      "name": "احمد رضایی",
      "email": "ahmad@servaan.local",
      "role": "STAFF"
    },
    "createdAt": "2025-06-10T10:30:00.000Z",
    "updatedAt": "2025-06-10T10:30:00.000Z"
  }
]
```

**Authorization:** `ADMIN`, `MANAGER`, `STAFF`, `WAREHOUSE`

---

### 1.2 وضعیت فعلی موجودی

```http
GET /api/inventory/current
```

**Response:**
```json
[
  {
    "itemId": "uuid",
    "itemName": "شیر پر چرب",
    "category": "لبنیات", 
    "unit": "لیتر",
    "totalIn": 100,
    "totalOut": 75,
    "current": 25
  }
]
```

**Authorization:** همه نقش‌ها

---

### 1.3 کالاهای کم موجود

```http
GET /api/inventory/low-stock
```

**Response:**
```json
[
  {
    "itemId": "uuid",
    "itemName": "قهوه اسپرسو",
    "category": "نوشیدنی",
    "unit": "کیلوگرم",
    "current": 3,
    "minStock": 10,
    "severity": "warning"
  }
]
```

**Authorization:** همه نقش‌ها

---

### 1.4 گزارش حرکت موجودی

```http
GET /api/inventory/report
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | تاریخ شروع (ISO format) |
| endDate | string | No | تاریخ پایان (ISO format) |
| itemId | string | No | شناسه کالا |
| type | string | No | نوع تراکنش (IN/OUT) |

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "itemId": "uuid", 
      "item": {
        "name": "شیر پر چرب"
      },
      "quantity": 10,
      "type": "IN",
      "unitPrice": 45000,
      "createdAt": "2025-06-10T10:30:00.000Z"
    }
  ],
  "summary": {
    "totalEntries": 45,
    "totalIn": 250,
    "totalOut": 180,
    "itemSummary": {
      "uuid": {
        "name": "شیر پر چرب",
        "totalIn": 50,
        "totalOut": 30,
        "net": 20
      }
    }
  }
}
```

**Authorization:** `ADMIN`, `MANAGER`

---

### 1.5 دریافت تراکنش خاص

```http
GET /api/inventory/:id
```

**Response:**
```json
{
  "id": "uuid",
  "itemId": "uuid",
  "item": {
    "id": "uuid",
    "name": "شیر پر چرب",
    "category": "لبنیات"
  },
  "quantity": 10,
  "type": "IN",
  "note": "خرید جدید",
  "unitPrice": 45000,
  "batchNumber": "B-2025001",
  "expiryDate": "2025-07-15T00:00:00.000Z",
  "userId": "uuid",
  "user": {
    "name": "احمد رضایی",
    "email": "ahmad@servaan.local"
  },
  "createdAt": "2025-06-10T10:30:00.000Z"
}
```

**Authorization:** همه نقش‌ها

---

### 1.6 ثبت تراکنش جدید

```http
POST /api/inventory
```

**Request Body:**
```json
{
  "itemId": "uuid",
  "quantity": 10,
  "type": "IN",
  "note": "خرید از تأمین‌کننده اصلی",
  "unitPrice": 45000,
  "batchNumber": "B-2025001", 
  "expiryDate": "2025-07-15"
}
```

**Validation Rules:**
- `itemId`: UUID معتبر و موجود
- `quantity`: عدد مثبت
- `type`: "IN" یا "OUT"
- `unitPrice`: عدد مثبت (الزامی برای IN)
- `expiryDate`: تاریخ آینده (فرمت ISO)

**Response (201):**
```json
{
  "id": "new-uuid",
  "itemId": "uuid",
  "quantity": 10,
  "type": "IN",
  "note": "خرید از تأمین‌کننده اصلی",
  "unitPrice": 45000,
  "batchNumber": "B-2025001",
  "expiryDate": "2025-07-15T00:00:00.000Z",
  "userId": "current-user-id",
  "createdAt": "2025-06-10T10:30:00.000Z"
}
```

**Error Responses:**
```json
// موجودی ناکافی برای OUT
{
  "message": "موجودی کافی نیست",
  "current": 5,
  "requested": 10
}

// خطای اعتبارسنجی
{
  "message": "اطلاعات نامعتبر",
  "errors": [
    {
      "field": "quantity",
      "message": "مقدار باید مثبت باشد"
    }
  ]
}
```

**Authorization:** `ADMIN`, `MANAGER`, `STAFF`, `WAREHOUSE`

---

### 1.7 ویرایش تراکنش

```http
PUT /api/inventory/:id
```

**Request Body:** مشابه POST

**Authorization:** `ADMIN`, `MANAGER`

---

### 1.8 حذف تراکنش

```http
DELETE /api/inventory/:id
```

**Response (200):**
```json
{
  "message": "تراکنش انبار با موفقیت حذف شد"
}
```

**Authorization:** `ADMIN`, `MANAGER`

---

### 1.9 بروزرسانی بارکد کالا

```http
PATCH /api/inventory/:itemId/barcode
```

**Request Body:**
```json
{
  "barcode": "1234567890123"
}
```

**Authorization:** `ADMIN`, `MANAGER`

---

### 1.10 تعداد تراکنش‌های امروز

```http
GET /api/inventory/today/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 15
  }
}
```

**Authorization:** همه نقش‌ها

## 2. Items Management API

### 2.1 دریافت لیست کالاها

```http
GET /api/items
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | شماره صفحه |
| limit | number | 50 | تعداد در صفحه |
| category | string | null | فیلتر دسته‌بندی |
| search | string | null | جستجو در نام |
| active | boolean | true | فقط کالاهای فعال |

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "شیر پر چرب",
    "category": "لبنیات",
    "unit": "لیتر",
    "minStock": 10,
    "description": "شیر پاستوریزه پر چرب",
    "barcode": "6281005110133",
    "image": "/images/milk.jpg",
    "isActive": true,
    "createdAt": "2025-06-01T00:00:00.000Z",
    "updatedAt": "2025-06-10T00:00:00.000Z"
  }
]
```

**Authorization:** همه نقش‌ها

---

### 2.2 دریافت کالای خاص

```http
GET /api/items/:id
```

**Response:** مشابه آیتم در لیست بالا

**Authorization:** همه نقش‌ها

---

### 2.3 ایجاد کالای جدید

```http
POST /api/items
```

**Request Body:**
```json
{
  "name": "کالای جدید",
  "category": "مواد غذایی",
  "unit": "کیلوگرم",
  "minStock": 5,
  "description": "توضیحات کالا",
  "barcode": "1234567890123",
  "image": "/images/new-item.jpg"
}
```

**Validation Rules:**
- `name`: رشته ۲-۲۰۰ کاراکتر
- `category`: یکی از دسته‌های معتبر
- `unit`: یکی از واحدهای معتبر
- `minStock`: عدد غیرمنفی
- `barcode`: ۸-۱۳ رقم (اختیاری و یکتا)

**Authorization:** `ADMIN`, `MANAGER`

---

### 2.4 ویرایش کالا

```http
PUT /api/items/:id
```

**Request Body:** مشابه POST

**Authorization:** `ADMIN`, `MANAGER`

---

### 2.5 حذف کالا (Soft Delete)

```http
DELETE /api/items/:id
```

**Response:**
```json
{
  "message": "کالا با موفقیت حذف شد"
}
```

**Authorization:** `ADMIN`, `MANAGER`

## 3. Suppliers Management API

### 3.1 دریافت لیست تأمین‌کنندگان

```http
GET /api/suppliers
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "شرکت لبنیات سحر",
    "contactName": "آقای احمدی",
    "email": "info@sahar-dairy.com",
    "phoneNumber": "021-12345678",
    "address": "تهران، خیابان آزادی",
    "notes": "تأمین‌کننده اصلی محصولات لبنی",
    "isActive": true,
    "createdAt": "2025-06-01T00:00:00.000Z"
  }
]
```

**Authorization:** `ADMIN`, `MANAGER`, `STAFF`

---

### 3.2 ایجاد تأمین‌کننده جدید

```http
POST /api/suppliers
```

**Request Body:**
```json
{
  "name": "شرکت جدید",
  "contactName": "نام تماس",
  "email": "email@example.com",
  "phoneNumber": "021-12345678",
  "address": "آدرس کامل",
  "notes": "یادداشت‌ها"
}
```

**Authorization:** `ADMIN`, `MANAGER`

---

### 3.3 ارتباط کالا با تأمین‌کننده

```http
POST /api/suppliers/:supplierId/items
```

**Request Body:**
```json
{
  "itemId": "uuid",
  "preferredSupplier": true,
  "unitPrice": 45000
}
```

**Authorization:** `ADMIN`, `MANAGER`

## 4. Analytics & Reports API

### 4.1 خلاصه آمار موجودی

```http
GET /api/analytics/summary
```

**Response:**
```json
{
  "totalItems": 25,
  "lowStockCount": 3,
  "recentTransactions": 15,
  "totalInventoryValue": 12500000
}
```

**Authorization:** همه نقش‌ها

---

### 4.2 ارزش‌گذاری موجودی

```http
GET /api/inventory/valuation
```

**Response:**
```json
{
  "totalValue": 12500000,
  "items": [
    {
      "itemId": "uuid",
      "itemName": "شیر پر چرب",
      "currentStock": 25,
      "averageCost": 45000,
      "totalValue": 1125000
    }
  ],
  "generatedAt": "2025-06-10T10:30:00.000Z"
}
```

**Authorization:** `ADMIN`, `MANAGER`

## 5. Barcode Scanner API

### 5.1 جستجوی بارکد

```http
GET /api/scanner/search/:barcode
```

**Response:**
```json
{
  "found": true,
  "source": "internal",
  "item": {
    "id": "uuid",
    "name": "شیر پر چرب",
    "category": "لبنیات",
    "currentStock": 25,
    "barcode": "6281005110133"
  }
}
```

**Authorization:** همه نقش‌ها

---

### 5.2 ثبت تاریخچه اسکن

```http
POST /api/scanner/history
```

**Request Body:**
```json
{
  "code": "6281005110133",
  "format": "EAN_13",
  "scanMode": "BARCODE",
  "itemFound": true,
  "itemId": "uuid",
  "metadata": {
    "device": "camera",
    "confidence": 0.95
  }
}
```

**Authorization:** همه نقش‌ها

## Error Codes & Messages

### HTTP Status Codes:
- `200`: موفقیت
- `201`: ایجاد موفق
- `400`: داده‌های نامعتبر
- `401`: احراز هویت نشده
- `403`: عدم دسترسی
- `404`: یافت نشد
- `409`: تضاد (بارکد تکراری)
- `422`: خطای اعتبارسنجی
- `500`: خطای سرور

### Error Response Format:
```json
{
  "success": false,
  "message": "پیام خطا به فارسی",
  "error": "Technical error message",
  "stack": "Error stack trace (در حالت development)",
  "code": "ERROR_CODE",
  "details": {
    "field": "اطلاعات اضافی خطا"
  }
}
```

## Rate Limiting

### محدودیت‌های درخواست:
- **عمومی**: ۱۰۰ درخواست در دقیقه
- **ثبت تراکنش**: ۳۰ درخواست در دقیقه
- **آپلود فایل**: ۱۰ درخواست در دقیقه

### Headers مربوط به Rate Limiting:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95  
X-RateLimit-Reset: 1735696800
```

## SDK و مثال‌های استفاده

### JavaScript/TypeScript SDK:

```typescript
import { InventoryAPI } from '@servaan/inventory-sdk';

const api = new InventoryAPI({
  baseURL: 'http://localhost:3001/api',
  token: 'your-jwt-token'
});

// ثبت تراکنش ورودی
const transaction = await api.inventory.create({
  itemId: 'item-uuid',
  quantity: 10,
  type: 'IN',
  unitPrice: 45000,
  note: 'خرید جدید'
});

// دریافت موجودی فعلی
const inventory = await api.inventory.getCurrentStock();

// جستجوی بارکد
const result = await api.scanner.search('6281005110133');
```

### cURL Examples:

```bash
# ثبت تراکنش جدید
curl -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "uuid",
    "quantity": 10,
    "type": "IN",
    "unitPrice": 45000
  }'

# دریافت کالاهای کم موجود  
curl -X GET "http://localhost:3001/api/inventory/low-stock" \
  -H "Authorization: Bearer YOUR_TOKEN"

# تولید گزارش
curl -X GET "http://localhost:3001/api/inventory/report?startDate=2025-06-01&endDate=2025-06-10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

> **نکته:** تمامی API endpoint های فوق کاملاً پیاده‌سازی شده و آماده استفاده هستند. 