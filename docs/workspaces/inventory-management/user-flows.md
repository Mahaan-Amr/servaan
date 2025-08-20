# جریان‌های کاربری و الگوریتم‌ها
# User Flows & Algorithms

## نمای کلی جریان‌های کاربری (User Flows Overview)

این سند شامل جریان‌های کاربری تفصیلی و الگوریتم‌های اجرایی برای تمامی ویژگی‌های مدیریت موجودی است.

## 1. جریان ورود به سیستم (Authentication Flow)

### الگوریتم:
```
START Authentication Flow
├── User enters credentials (email, password)
├── Frontend validates form data
├── Send POST /api/auth/login
├── Backend validates credentials
├── IF valid THEN
│   ├── Generate JWT token
│   ├── Store user session
│   └── Return token + user data
├── ELSE
│   └── Return error message
├── Frontend stores token in localStorage
├── Redirect to inventory workspace
└── END
```

### User Flow:
1. **ورود به صفحه لاگین**
2. **وارد کردن اطلاعات کاربری**
   - ایمیل: admin@servaan.local
   - رمز عبور: admin123
3. **بررسی اعتبارسنجی frontend**
4. **ارسال درخواست به سرور**
5. **دریافت token و ذخیره**
6. **هدایت به داشبورد موجودی**

## 2. جریان مشاهده داشبورد (Dashboard View Flow)

### الگوریتم:
```
START Dashboard Load
├── Check authentication status
├── IF authenticated THEN
│   ├── Fetch dashboard statistics
│   │   ├── GET /api/analytics/summary
│   │   └── Parse response data
│   ├── Fetch recent activities  
│   │   ├── GET /api/inventory?limit=5&sortBy=createdAt&sortOrder=desc
│   │   └── Parse activity data
│   ├── Fetch low stock alerts
│   │   ├── GET /api/inventory/low-stock
│   │   └── Parse alert data
│   ├── Update UI components
│   │   ├── Statistics cards
│   │   ├── Recent activities list
│   │   ├── Low stock alerts
│   │   └── Quick action buttons
│   └── Show dashboard
├── ELSE
│   └── Redirect to login
└── END
```

### Components Loading Sequence:
```
Dashboard Page Load
├── 1. Authentication Check (0-50ms)
├── 2. Parallel API Calls (100-500ms)
│   ├── Analytics Summary API
│   ├── Recent Activities API
│   └── Low Stock API
├── 3. Data Processing (50-100ms)
├── 4. UI Rendering (100-200ms)
└── 5. Interactive Dashboard (Total: 250-850ms)
```

## 3. جریان ثبت کالای جدید (Add New Item Flow)

### الگوریتم:
```
START Add Item Flow
├── User clicks "افزودن کالا جدید"
├── Navigate to /items/add
├── Display item form
├── User fills form data:
│   ├── name (required)
│   ├── category (required) 
│   ├── unit (required)
│   ├── minStock (optional)
│   ├── description (optional)
│   ├── barcode (optional)
│   └── image (optional)
├── Frontend validation
├── IF valid THEN
│   ├── Send POST /api/items
│   ├── Backend validation (Zod schema)
│   ├── Check authorization (ADMIN/MANAGER only)
│   ├── Save to database
│   ├── Return created item
│   ├── Show success message
│   ├── Redirect to items list
│   └── Update items cache
├── ELSE
│   └── Show validation errors
└── END
```

### Validation Rules:
```typescript
const itemValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 200,
    pattern: /^[\u0600-\u06FF\s\w]+$/ // Persian + English + numbers
  },
  category: {
    required: true,
    enum: ['نوشیدنی', 'لبنیات', 'نان و غلات', 'شیرینی', 'مواد غذایی', 'سایر']
  },
  unit: {
    required: true,
    enum: ['کیلوگرم', 'گرم', 'لیتر', 'میلی‌لیتر', 'عدد', 'بسته', 'جعبه']
  },
  minStock: {
    optional: true,
    type: 'number',
    min: 0
  },
  barcode: {
    optional: true,
    pattern: /^\d{8,13}$/,
    unique: true
  }
};
```

## 4. جریان ثبت تراکنش ورودی (IN Transaction Flow)

### الگوریتم:
```
START IN Transaction Flow
├── User selects "ثبت ورود کالا"
├── Display transaction form
├── User selects item from dropdown
├── User enters transaction data:
│   ├── quantity (required, positive)
│   ├── unitPrice (required, positive)
│   ├── batchNumber (optional)
│   ├── expiryDate (optional, future date)
│   └── note (optional)
├── Frontend validation
├── IF valid THEN
│   ├── Send POST /api/inventory
│   ├── Backend validation
│   ├── Check authorization
│   ├── Create inventory entry
│   ├── Calculate new stock level
│   ├── Update weighted average cost
│   ├── Send notification if needed
│   ├── Return transaction data
│   ├── Show success message
│   ├── Update dashboard statistics
│   └── Reset form for next entry
├── ELSE
│   └── Show validation errors
└── END
```

### Stock Calculation Algorithm:
```
calculateNewStock(itemId, quantity, type):
├── Get all previous transactions for item
├── totalIn = SUM(quantity WHERE type = 'IN')
├── totalOut = SUM(quantity WHERE type = 'OUT') 
├── IF type == 'IN' THEN
│   └── newStock = (totalIn + quantity) - totalOut
├── ELSE
│   └── newStock = totalIn - (totalOut + quantity)
└── RETURN newStock
```

## 5. جریان ثبت تراکنش خروجی (OUT Transaction Flow)

### الگوریتم:
```
START OUT Transaction Flow
├── User selects "ثبت خروج کالا"
├── Display transaction form
├── User selects item from dropdown
├── System shows current stock level
├── User enters transaction data:
│   ├── quantity (required, positive)
│   ├── unitPrice (optional)
│   └── note (optional)
├── Frontend validation
├── Check stock availability:
│   ├── currentStock = calculateCurrentStock(itemId)
│   ├── IF currentStock < requestedQuantity THEN
│   │   └── Show error: "موجودی کافی نیست"
│   └── ELSE continue
├── IF valid THEN
│   ├── Send POST /api/inventory
│   ├── Backend validation
│   ├── Double-check stock availability
│   ├── Create inventory entry
│   ├── Calculate new stock level
│   ├── Check for low stock alert
│   ├── Send notifications
│   ├── Return transaction data
│   ├── Show success message
│   └── Update dashboard statistics
├── ELSE
│   └── Show validation errors
└── END
```

### Stock Availability Check:
```
checkStockAvailability(itemId, requestedQuantity):
├── currentStock = calculateCurrentStock(itemId)
├── IF currentStock >= requestedQuantity THEN
│   └── RETURN { available: true, currentStock }
├── ELSE
│   └── RETURN { 
│       available: false, 
│       currentStock,
│       shortage: requestedQuantity - currentStock
│     }
```

## 6. جریان اسکن بارکد (Barcode Scanning Flow)

### الگوریتم:
```
START Barcode Scan Flow
├── User navigates to scanner page
├── Request camera permissions
├── IF permission granted THEN
│   ├── Initialize camera
│   ├── Start barcode detection
│   ├── WHILE scanning LOOP
│   │   ├── Capture frame
│   │   ├── Detect barcode pattern
│   │   ├── IF barcode detected THEN
│   │   │   ├── Extract barcode value
│   │   │   ├── Validate format
│   │   │   ├── Search in local database
│   │   │   ├── IF found THEN
│   │   │   │   ├── Show item details
│   │   │   │   ├── Show current stock
│   │   │   │   └── Offer quick actions
│   │   │   ├── ELSE
│   │   │   │   ├── Search external APIs
│   │   │   │   ├── IF found externally THEN
│   │   │   │   │   ├── Show external data
│   │   │   │   │   └── Offer to add to inventory
│   │   │   │   └── ELSE show "not found"
│   │   │   ├── Save scan history
│   │   │   └── Reset scanner for next scan
│   │   └── Continue scanning
│   └── END LOOP
├── ELSE
│   └── Show permission error
└── END
```

### Barcode Detection Algorithm:
```
detectBarcode(imageFrame):
├── Convert to grayscale
├── Apply image processing filters
├── FOR each barcode format DO
│   ├── Try to decode format
│   ├── IF successful THEN
│   │   ├── Validate checksum
│   │   ├── RETURN { value, format, confidence }
│   └── CONTINUE
├── IF no format matches THEN
│   └── RETURN null
```

## 7. جریان مدیریت موجودی کم (Low Stock Management Flow)

### الگوریتم:
```
START Low Stock Detection
├── Get all active items
├── FOR each item DO
│   ├── currentStock = calculateCurrentStock(item.id)
│   ├── threshold = item.minStock || 10
│   ├── IF currentStock <= threshold THEN
│   │   ├── severity = determineSeväänrity(currentStock, threshold)
│   │   ├── ADD to lowStockItems list
│   │   └── IF severity == 'critical' THEN
│   │       └── Send immediate notification
│   └── CONTINUE
├── Sort by severity (critical first)
├── Update low stock alerts UI
├── RETURN lowStockItems
└── END

determineSeverity(current, threshold):
├── IF current == 0 THEN
│   └── RETURN 'critical'
├── ELSE IF current <= threshold/2 THEN
│   └── RETURN 'high'
├── ELSE
│   └── RETURN 'medium'
```

### Notification Flow:
```
sendLowStockNotification(item, currentStock, threshold):
├── Create notification object
├── IF user.role IN ['ADMIN', 'MANAGER'] THEN
│   ├── Send in-app notification
│   ├── IF critical THEN
│   │   ├── Send email notification
│   │   └── Send SMS (if enabled)
│   └── Log notification
└── Store in notification history
```

## 8. جریان تولید گزارش (Report Generation Flow)

### الگوریتم:
```
START Report Generation
├── User selects report parameters:
│   ├── startDate (optional)
│   ├── endDate (optional)
│   ├── itemId (optional)
│   └── transactionType (optional)
├── Validate date range
├── Send GET /api/inventory/report with filters
├── Backend processes request:
│   ├── Build query filters
│   ├── Execute database query
│   ├── Calculate summary statistics
│   ├── Group by item (if needed)
│   └── Format response data
├── Frontend receives data:
│   ├── Process summary statistics
│   ├── Create charts/graphs
│   ├── Generate table view
│   └── Enable export options
├── Display interactive report
└── END
```

### Report Calculation Algorithm:
```
generateInventoryReport(filters):
├── transactions = queryTransactions(filters)
├── summary = {
│     totalEntries: 0,
│     totalIn: 0,
│     totalOut: 0,
│     itemSummary: {}
│   }
├── FOR each transaction DO
│   ├── summary.totalEntries++
│   ├── IF transaction.type == 'IN' THEN
│   │   └── summary.totalIn += transaction.quantity
│   ├── ELSE
│   │   └── summary.totalOut += transaction.quantity
│   ├── IF itemSummary[transaction.itemId] not exists THEN
│   │   └── Initialize item summary
│   ├── Update item summary totals
│   └── CONTINUE
├── Calculate net changes
├── RETURN { transactions, summary }
```

## 9. جریان ارزش‌گذاری موجودی (Inventory Valuation Flow)

### الگوریتم:
```
START Inventory Valuation
├── Get all active items
├── totalInventoryValue = 0
├── itemValuations = []
├── FOR each item DO
│   ├── currentStock = calculateCurrentStock(item.id)
│   ├── IF currentStock > 0 THEN
│   │   ├── averageCost = calculateWeightedAverageCost(item.id)
│   │   ├── itemValue = currentStock * averageCost
│   │   ├── totalInventoryValue += itemValue
│   │   └── ADD to itemValuations
│   └── CONTINUE
├── Sort by value (highest first)
├── RETURN {
│     totalValue: totalInventoryValue,
│     items: itemValuations,
│     generatedAt: now()
│   }
└── END

calculateWeightedAverageCost(itemId):
├── inTransactions = getINTransactions(itemId)
├── totalQuantity = 0
├── totalValue = 0
├── FOR each transaction DO
│   ├── totalQuantity += transaction.quantity
│   ├── totalValue += (transaction.quantity * transaction.unitPrice)
│   └── CONTINUE
├── IF totalQuantity > 0 THEN
│   └── RETURN totalValue / totalQuantity
├── ELSE
│   └── RETURN 0
```

## 10. جریان مدیریت تأمین‌کنندگان (Supplier Management Flow)

### الگوریتم:
```
START Supplier Management
├── User selects supplier operation
├── SWITCH operation
│   ├── CASE 'add':
│   │   ├── Show supplier form
│   │   ├── User fills supplier data
│   │   ├── Validate form
│   │   ├── Send POST /api/suppliers
│   │   ├── Create supplier record
│   │   └── Show success message
│   ├── CASE 'edit':
│   │   ├── Load existing supplier data
│   │   ├── Show pre-filled form
│   │   ├── User modifies data
│   │   ├── Validate changes
│   │   ├── Send PUT /api/suppliers/:id
│   │   └── Update supplier record
│   ├── CASE 'assign_to_item':
│   │   ├── Show item-supplier assignment form
│   │   ├── User selects item and supplier
│   │   ├── Set preferences (preferred, unitPrice)
│   │   ├── Create ItemSupplier relationship
│   │   └── Update item's supplier list
│   └── CASE 'view_items':
│       ├── Load supplier's assigned items
│       ├── Show items list with prices
│       └── Allow price updates
└── END
```

## Error Handling Patterns

### Network Error Handling:
```
handleAPIError(error):
├── IF error.status == 401 THEN
│   ├── Clear authentication tokens
│   ├── Redirect to login
│   └── Show "Session expired" message
├── ELSE IF error.status == 403 THEN
│   └── Show "Access denied" message
├── ELSE IF error.status == 422 THEN
│   ├── Parse validation errors
│   └── Show field-specific errors
├── ELSE IF error.status >= 500 THEN
│   └── Show "Server error, please try again"
├── ELSE
│   └── Show generic error message
```

### Form Validation Pattern:
```
validateForm(formData, schema):
├── errors = {}
├── FOR each field in schema DO
│   ├── value = formData[field.name]
│   ├── IF field.required AND !value THEN
│   │   └── errors[field.name] = "Field is required"
│   ├── IF value AND field.pattern THEN
│   │   ├── IF !field.pattern.test(value) THEN
│   │   │   └── errors[field.name] = field.errorMessage
│   └── CONTINUE
├── RETURN {
│     isValid: Object.keys(errors).length == 0,
│     errors
│   }
```

## Performance Optimization Patterns

### Debounced Search:
```
createDebouncedSearch(searchFunction, delay = 300):
├── let timeoutId
├── RETURN function(query) {
│   ├── clearTimeout(timeoutId)
│   ├── timeoutId = setTimeout(() => {
│   │   └── searchFunction(query)
│   │   }, delay)
│   └── END
│ }
```

### Cache Management:
```
cacheManager = {
  cache: new Map(),
  
  get(key):
  ├── IF cache.has(key) AND !isExpired(key) THEN
  │   └── RETURN cache.get(key).data
  └── RETURN null
  
  set(key, data, ttl = 300000):
  ├── cache.set(key, {
  │     data,
  │     expires: Date.now() + ttl
  │   })
  └── scheduleCleanup()
}
```

---

> **نکته:** تمامی الگوریتم‌ها و جریان‌های فوق در سیستم پیاده‌سازی شده و تست شده‌اند. 