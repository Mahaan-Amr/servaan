# نمودارهای جریان مدیریت موجودی
# Inventory Management Flowcharts

## نمای کلی نمودارها (Flowcharts Overview)

این سند شامل نمودارهای جریان تصویری برای تمامی فرآیندهای کلیدی مدیریت موجودی است.

## 1. جریان کلی سیستم مدیریت موجودی (Main System Flow)

```mermaid
graph TD
    A[شروع سیستم] --> B{احراز هویت}
    B -->|موفق| C[داشبورد موجودی]
    B -->|ناموفق| A
    
    C --> D[مشاهده آمار]
    C --> E[عملیات سریع]
    C --> F[هشدارهای موجودی]
    
    E --> G[ثبت ورود کالا]
    E --> H[ثبت خروج کالا]
    E --> I[افزودن کالا جدید]
    E --> J[اسکن بارکد]
    
    G --> K[بروزرسانی موجودی]
    H --> K
    I --> L[بروزرسانی فهرست کالا]
    J --> M[شناسایی کالا]
    
    K --> N[محاسبه مجدد آمار]
    L --> N
    M --> N
    
    N --> O[اعلان‌های خودکار]
    O --> C
```

## 2. جریان ثبت تراکنش ورودی (IN Transaction Flow)

```mermaid
flowchart TD
    Start([شروع ثبت ورود کالا]) --> SelectItem[انتخاب کالا از لیست]
    SelectItem --> EnterData[ورود اطلاعات تراکنش]
    
    EnterData --> ValidateForm{اعتبارسنجی فرم}
    ValidateForm -->|خطا| ShowErrors[نمایش خطاهای اعتبارسنجی]
    ShowErrors --> EnterData
    
    ValidateForm -->|معتبر| SendAPI[ارسال به API]
    SendAPI --> AuthCheck{بررسی مجوز}
    AuthCheck -->|عدم مجوز| AccessDenied[عدم دسترسی]
    
    AuthCheck -->|مجاز| CreateTransaction[ایجاد تراکنش در دیتابیس]
    CreateTransaction --> CalcStock[محاسبه موجودی جدید]
    
    CalcStock --> UpdateCost[بروزرسانی قیمت تمام شده]
    UpdateCost --> CheckLowStock{بررسی موجودی کم}
    
    CheckLowStock -->|کم موجود| SendAlert[ارسال هشدار]
    CheckLowStock -->|عادی| Success[موفقیت]
    SendAlert --> Success
    
    Success --> UpdateUI[بروزرسانی رابط کاربری]
    UpdateUI --> ResetForm[ریست فرم برای ورودی بعدی]
    ResetForm --> End([پایان])
    
    AccessDenied --> End
```

## 3. جریان ثبت تراکنش خروجی (OUT Transaction Flow)

```mermaid
flowchart TD
    Start([شروع ثبت خروج کالا]) --> SelectItem[انتخاب کالا]
    SelectItem --> ShowStock[نمایش موجودی فعلی]
    ShowStock --> EnterQuantity[ورود مقدار خروجی]
    
    EnterQuantity --> CheckAvailability{بررسی موجودی کافی}
    CheckAvailability -->|ناکافی| InsufficientStock[موجودی ناکافی]
    InsufficientStock --> ShowStock
    
    CheckAvailability -->|کافی| EnterDetails[ورود جزئیات اضافی]
    EnterDetails --> ValidateForm{اعتبارسنجی}
    
    ValidateForm -->|خطا| ShowErrors[نمایش خطاها]
    ShowErrors --> EnterDetails
    
    ValidateForm -->|معتبر| SendAPI[ارسال به API]
    SendAPI --> DoubleCheckStock{بررسی مجدد موجودی}
    
    DoubleCheckStock -->|ناکافی| StockError[خطای موجودی]
    DoubleCheckStock -->|کافی| CreateTransaction[ایجاد تراکنش]
    
    CreateTransaction --> UpdateStock[بروزرسانی موجودی]
    UpdateStock --> CheckCritical{بررسی وضعیت بحرانی}
    
    CheckCritical -->|بحرانی| AlertManager[هشدار به مدیران]
    CheckCritical -->|عادی| LogTransaction[ثبت لاگ]
    AlertManager --> LogTransaction
    
    LogTransaction --> Success[موفقیت]
    Success --> UpdateDashboard[بروزرسانی داشبورد]
    UpdateDashboard --> End([پایان])
    
    StockError --> End
```

## 4. جریان اسکن بارکد (Barcode Scanning Flow)

```mermaid
flowchart TD
    Start([شروع اسکن]) --> RequestCamera[درخواست دسترسی دوربین]
    RequestCamera --> CameraPermission{مجوز دوربین}
    
    CameraPermission -->|رد شده| PermissionError[خطای عدم دسترسی]
    PermissionError --> End([پایان])
    
    CameraPermission -->|داده شده| InitCamera[راه‌اندازی دوربین]
    InitCamera --> StartScan[شروع اسکن]
    
    StartScan --> CaptureFrame[ضبط فریم]
    CaptureFrame --> DetectBarcode{تشخیص بارکد}
    
    DetectBarcode -->|یافت نشد| CaptureFrame
    DetectBarcode -->|یافت شد| ValidateFormat{اعتبارسنجی فرمت}
    
    ValidateFormat -->|نامعتبر| CaptureFrame
    ValidateFormat -->|معتبر| SearchLocal[جستجو در دیتابیس محلی]
    
    SearchLocal --> LocalFound{یافت شد؟}
    LocalFound -->|بله| ShowItemDetails[نمایش جزئیات کالا]
    LocalFound -->|خیر| SearchExternal[جستجو در API خارجی]
    
    SearchExternal --> ExternalFound{یافت شد؟}
    ExternalFound -->|بله| ShowExternalData[نمایش اطلاعات خارجی]
    ExternalFound -->|خیر| NotFound[کالا یافت نشد]
    
    ShowItemDetails --> ShowCurrentStock[نمایش موجودی فعلی]
    ShowCurrentStock --> OfferActions[ارائه عملیات سریع]
    
    ShowExternalData --> OfferAddItem[پیشنهاد افزودن به انبار]
    OfferAddItem --> SaveScanHistory[ذخیره تاریخچه اسکن]
    
    OfferActions --> UserAction{انتخاب کاربر}
    UserAction -->|ثبت ورود| RedirectToIN[هدایت به ثبت ورود]
    UserAction -->|ثبت خروج| RedirectToOUT[هدایت به ثبت خروج]
    UserAction -->|ادامه اسکن| SaveScanHistory
    
    NotFound --> SaveScanHistory
    SaveScanHistory --> ContinueScan{ادامه اسکن؟}
    
    ContinueScan -->|بله| CaptureFrame
    ContinueScan -->|خیر| End
    
    RedirectToIN --> End
    RedirectToOUT --> End
```

## 5. جریان تشخیص موجودی کم (Low Stock Detection Flow)

```mermaid
flowchart TD
    Start([شروع بررسی]) --> GetActiveItems[دریافت لیست کالاهای فعال]
    GetActiveItems --> InitLoop[شروع حلقه بررسی]
    
    InitLoop --> NextItem{کالای بعدی موجود؟}
    NextItem -->|خیر| GenerateReport[تولید گزارش نهایی]
    NextItem -->|بله| GetCurrentStock[محاسبه موجودی فعلی]
    
    GetCurrentStock --> GetThreshold[دریافت حد آستانه]
    GetThreshold --> CompareStock{موجودی < حد آستانه؟}
    
    CompareStock -->|خیر| NextItem
    CompareStock -->|بله| DetermineSeverity[تعیین شدت]
    
    DetermineSeverity --> CheckSeverity{نوع شدت}
    CheckSeverity -->|بحرانی| AddToCritical[افزودن به فهرست بحرانی]
    CheckSeverity -->|متوسط| AddToMedium[افزودن به فهرست متوسط]
    CheckSeverity -->|کم| AddToLow[افزودن به فهرست کم]
    
    AddToCritical --> SendImmediateAlert[ارسال هشدار فوری]
    SendImmediateAlert --> NextItem
    AddToMedium --> NextItem
    AddToLow --> NextItem
    
    GenerateReport --> SortBySeverity[مرتب‌سازی بر اساس شدت]
    SortBySeverity --> UpdateUI[بروزرسانی رابط کاربری]
    UpdateUI --> SendNotifications[ارسال اعلان‌ها]
    SendNotifications --> End([پایان])
```

## 6. جریان تولید گزارش موجودی (Report Generation Flow)

```mermaid
flowchart TD
    Start([شروع تولید گزارش]) --> SelectFilters[انتخاب فیلترهای گزارش]
    
    SelectFilters --> SetDateRange[تنظیم بازه زمانی]
    SetDateRange --> SelectItem[انتخاب کالا - اختیاری]
    SelectItem --> SelectType[انتخاب نوع تراکنش - اختیاری]
    
    SelectType --> ValidateFilters{اعتبارسنجی فیلترها}
    ValidateFilters -->|خطا| ShowFilterErrors[نمایش خطاهای فیلتر]
    ShowFilterErrors --> SelectFilters
    
    ValidateFilters -->|معتبر| SendReportRequest[ارسال درخواست گزارش]
    SendReportRequest --> ProcessFilters[پردازش فیلترها در سرور]
    
    ProcessFilters --> BuildQuery[ساخت Query دیتابیس]
    BuildQuery --> ExecuteQuery[اجرای Query]
    ExecuteQuery --> ProcessResults[پردازش نتایج]
    
    ProcessResults --> CalcSummary[محاسبه خلاصه آمار]
    CalcSummary --> GroupByItem{گروه‌بندی بر اساس کالا}
    
    GroupByItem --> FormatData[فرمت‌بندی داده‌ها]
    FormatData --> SendResponse[ارسال پاسخ]
    SendResponse --> ReceiveData[دریافت داده‌ها در Frontend]
    
    ReceiveData --> CreateCharts[ایجاد نمودارها]
    CreateCharts --> BuildTable[ساخت جدول]
    BuildTable --> EnableExport[فعال‌سازی گزینه‌های خروجی]
    
    EnableExport --> DisplayReport[نمایش گزارش نهایی]
    DisplayReport --> UserInteraction{تعامل کاربر}
    
    UserInteraction -->|تغییر فیلتر| SelectFilters
    UserInteraction -->|خروجی PDF| ExportPDF[صادرات PDF]
    UserInteraction -->|خروجی Excel| ExportExcel[صادرات Excel]
    UserInteraction -->|بستن| End([پایان])
    
    ExportPDF --> End
    ExportExcel --> End
```

## 7. جریان محاسبه ارزش موجودی (Valuation Calculation Flow)

```mermaid
flowchart TD
    Start([شروع محاسبه ارزش]) --> GetActiveItems[دریافت کالاهای فعال]
    GetActiveItems --> InitVars[مقداردهی متغیرها]
    
    InitVars --> StartLoop[شروع حلقه محاسبه]
    StartLoop --> NextItem{کالای بعدی؟}
    
    NextItem -->|خیر| FinalCalculation[محاسبه نهایی]
    NextItem -->|بله| CalcCurrentStock[محاسبه موجودی فعلی]
    
    CalcCurrentStock --> CheckStock{موجودی > 0؟}
    CheckStock -->|خیر| NextItem
    CheckStock -->|بله| CalcAvgCost[محاسبه قیمت تمام شده میانگین]
    
    CalcAvgCost --> GetINTransactions[دریافت تراکنش‌های ورودی]
    GetINTransactions --> CalcWeightedAvg[محاسبه میانگین وزنی]
    
    CalcWeightedAvg --> CalcItemValue[محاسبه ارزش کالا]
    CalcItemValue --> AddToTotal[افزودن به مجموع کل]
    AddToTotal --> SaveItemData[ذخیره اطلاعات کالا]
    SaveItemData --> NextItem
    
    FinalCalculation --> SortByValue[مرتب‌سازی بر اساس ارزش]
    SortByValue --> GenerateReport[تولید گزارش ارزش‌گذاری]
    GenerateReport --> End([پایان])
```

## 8. جریان مدیریت تأمین‌کنندگان (Supplier Management Flow)

```mermaid
flowchart TD
    Start([شروع مدیریت تأمین‌کنندگان]) --> SelectOperation{انتخاب عملیات}
    
    SelectOperation -->|افزودن| AddSupplier[افزودن تأمین‌کننده جدید]
    SelectOperation -->|ویرایش| EditSupplier[ویرایش تأمین‌کننده]
    SelectOperation -->|تخصیص به کالا| AssignToItem[تخصیص به کالا]
    SelectOperation -->|مشاهده کالاها| ViewItems[مشاهده کالاهای تأمین‌کننده]
    
    AddSupplier --> FillSupplierForm[تکمیل فرم تأمین‌کننده]
    FillSupplierForm --> ValidateSupplier{اعتبارسنجی}
    ValidateSupplier -->|خطا| ShowSupplierErrors[نمایش خطاها]
    ShowSupplierErrors --> FillSupplierForm
    ValidateSupplier -->|معتبر| SaveSupplier[ذخیره در دیتابیس]
    SaveSupplier --> SuccessMessage[پیام موفقیت]
    
    EditSupplier --> LoadExistingData[بارگذاری اطلاعات موجود]
    LoadExistingData --> ModifyData[تغییر اطلاعات]
    ModifyData --> ValidateChanges{اعتبارسنجی تغییرات}
    ValidateChanges -->|خطا| ShowErrors[نمایش خطاها]
    ShowErrors --> ModifyData
    ValidateChanges -->|معتبر| UpdateSupplier[بروزرسانی تأمین‌کننده]
    UpdateSupplier --> UpdateSuccess[موفقیت بروزرسانی]
    
    AssignToItem --> SelectItemAndSupplier[انتخاب کالا و تأمین‌کننده]
    SelectItemAndSupplier --> SetPreferences[تنظیم تنظیمات]
    SetPreferences --> SetPrice[تعیین قیمت]
    SetPrice --> CreateRelation[ایجاد رابطه ItemSupplier]
    CreateRelation --> RelationSuccess[موفقیت تخصیص]
    
    ViewItems --> LoadSupplierItems[بارگذاری کالاهای تأمین‌کننده]
    LoadSupplierItems --> ShowItemsList[نمایش لیست کالاها]
    ShowItemsList --> AllowPriceUpdate[امکان بروزرسانی قیمت]
    AllowPriceUpdate --> ViewSuccess[نمایش موفق]
    
    SuccessMessage --> End([پایان])
    UpdateSuccess --> End
    RelationSuccess --> End
    ViewSuccess --> End
```

## 9. جریان خطایابی و مدیریت خطا (Error Handling Flow)

```mermaid
flowchart TD
    Start([وقوع خطا]) --> IdentifyError{شناسایی نوع خطا}
    
    IdentifyError -->|خطای شبکه| NetworkError[خطای شبکه]
    IdentifyError -->|خطای اعتبارسنجی| ValidationError[خطای اعتبارسنجی]
    IdentifyError -->|خطای دسترسی| AccessError[خطای دسترسی]
    IdentifyError -->|خطای سرور| ServerError[خطای سرور]
    
    NetworkError --> CheckConnectivity{بررسی اتصال}
    CheckConnectivity -->|قطع| ShowOfflineMode[نمایش حالت آفلاین]
    CheckConnectivity -->|متصل| RetryRequest[تلاش مجدد]
    
    ValidationError --> ParseErrors[تجزیه خطاهای اعتبارسنجی]
    ParseErrors --> ShowFieldErrors[نمایش خطاهای فیلد]
    ShowFieldErrors --> HighlightFields[هایلایت فیلدهای خطادار]
    
    AccessError --> CheckAuth{بررسی احراز هویت}
    CheckAuth -->|منقضی| RedirectLogin[هدایت به ورود]
    CheckAuth -->|فعال| ShowAccessDenied[نمایش عدم دسترسی]
    
    ServerError --> LogError[ثبت خطا در لاگ]
    LogError --> ShowGenericError[نمایش خطای عمومی]
    ShowGenericError --> OfferRetry[پیشنهاد تلاش مجدد]
    
    ShowOfflineMode --> End([پایان])
    RetryRequest --> End
    HighlightFields --> End
    RedirectLogin --> End
    ShowAccessDenied --> End
    OfferRetry --> End
```

## 10. جریان بهینه‌سازی عملکرد (Performance Optimization Flow)

```mermaid
flowchart TD
    Start([شروع بهینه‌سازی]) --> MonitorPerformance[نظارت بر عملکرد]
    MonitorPerformance --> IdentifyBottleneck{شناسایی گلوگاه}
    
    IdentifyBottleneck -->|Query آهسته| OptimizeQuery[بهینه‌سازی کوئری]
    IdentifyBottleneck -->|UI کند| OptimizeUI[بهینه‌سازی رابط کاربری]
    IdentifyBottleneck -->|API کند| OptimizeAPI[بهینه‌سازی API]
    
    OptimizeQuery --> AddIndexes[افزودن ایندکس‌ها]
    AddIndexes --> OptimizeJoins[بهینه‌سازی JOIN ها]
    OptimizeJoins --> UseAggregation[استفاده از Aggregation]
    
    OptimizeUI --> UseMemo[استفاده از React.memo]
    UseMemo --> LazyLoading[بارگذاری تنبل]
    LazyLoading --> VirtualScrolling[اسکرول مجازی]
    
    OptimizeAPI --> ImplementCaching[پیاده‌سازی کش]
    ImplementCaching --> ResponseCompression[فشرده‌سازی پاسخ]
    ResponseCompression --> BatchOperations[عملیات دسته‌ای]
    
    UseAggregation --> MeasureImprovement[اندازه‌گیری بهبود]
    VirtualScrolling --> MeasureImprovement
    BatchOperations --> MeasureImprovement
    
    MeasureImprovement --> CheckTarget{هدف عملکرد محقق شد؟}
    CheckTarget -->|خیر| IdentifyBottleneck
    CheckTarget -->|بله| DocumentChanges[مستندسازی تغییرات]
    DocumentChanges --> End([پایان])
```

---

> **نکته:** تمامی نمودارهای فوق نمایش تصویری دقیق فرآیندهای پیاده‌سازی شده در سیستم هستند. 