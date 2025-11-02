# ✅ CRM — Synced Status (2025-10-20)

Reference
- Platform status: `capabilities_matrix.md`
- Shared rules: `common_invariants.md`

Note: Unless CRM endpoints are explicitly present in backend routes, treat sections below as planned specifications. Current customer analytics are provided via ordering analytics endpoints.

---

# CRM API Specification
## مشخصات API مدیریت ارتباط با مشتری

### Overview | نمای کلی
Comprehensive API documentation for Servaan CRM workspace. All endpoints follow RESTful principles with Persian localization support and transparent error handling.

**Base URL**: `/api/crm`
**Authentication**: JWT Bearer token required for all endpoints
**Rate Limiting**: 1000 requests per hour per user

---

## 🔧 Core API Endpoints | نقاط پایانی اصلی

### 1. Customer Management | مدیریت مشتریان

#### Get All Customers
```http
GET /api/crm/customers
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name or phone
- `segment` (string): Filter by segment (new, regular, vip)
- `status` (string): Filter by status (active, inactive, blocked)
- `sort` (string): Sort field (name, phone, created_at, last_visit)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "phone": "09123456789",
        "name": "احمد محمدی",
        "email": "ahmad@example.com",
        "birthday": "1985-03-15",
        "anniversary": "2020-06-10",
        "status": "active",
        "segment": "regular",
        "notes": "مشتری VIP - ترجیح قهوه اسپرسو",
        "preferences": {
          "favorite_drink": "espresso",
          "allergies": ["nuts"],
          "preferred_time": "morning"
        },
        "loyalty": {
          "current_points": 250,
          "tier_level": "silver",
          "lifetime_spent": 1250000
        },
        "stats": {
          "total_visits": 15,
          "last_visit": "2024-01-15T10:30:00Z",
          "average_spend": 83333
        },
        "created_at": "2023-06-01T09:00:00Z",
        "updated_at": "2024-01-15T10:35:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 87,
      "items_per_page": 20
    }
  }
}
```

#### Get Customer by Phone
```http
GET /api/crm/customers/phone/:phone
```

**Parameters:**
- `phone` (string): Customer phone number (09123456789)

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": { /* Customer object */ },
    "recent_visits": [
      {
        "id": "uuid",
        "visit_date": "2024-01-15T10:30:00Z",
        "total_amount": 125000,
        "items_ordered": [
          {"name": "اسپرسو", "quantity": 2, "price": 45000},
          {"name": "کیک شکلاتی", "quantity": 1, "price": 80000}
        ],
        "payment_method": "cash",
        "feedback_rating": 5,
        "feedback_comment": "عالی بود!"
      }
    ]
  }
}
```

#### Create Customer
```http
POST /api/crm/customers
```

**Request Body:**
```json
{
  "phone": "09123456789",
  "name": "احمد محمدی",
  "email": "ahmad@example.com",
  "birthday": "1985-03-15",
  "anniversary": "2020-06-10",
  "notes": "مشتری جدید - ترجیح قهوه ترک",
  "preferences": {
    "favorite_drink": "turkish_coffee",
    "allergies": [],
    "preferred_time": "evening"
  }
}
```

**Validation Rules:**
- `phone`: Required, Iranian mobile format, unique
- `name`: Required, 3-100 characters
- `email`: Optional, valid email format
- `birthday`: Optional, valid date format
- `anniversary`: Optional, valid date format

#### Update Customer
```http
PUT /api/crm/customers/:id
```

#### Delete Customer (Soft Delete)
```http
DELETE /api/crm/customers/:id
```

---

### 2. Visit Tracking | ردیابی بازدیدها

#### Record New Visit
```http
POST /api/crm/visits
```

**Request Body:**
```json
{
  "customer_id": "uuid",
  "customer_phone": "09123456789", // Alternative to customer_id
  "visit_date": "2024-01-15T10:30:00Z",
  "total_amount": 125000,
  "items_ordered": [
    {
      "item_id": "uuid",
      "name": "اسپرسو دوبل",
      "quantity": 2,
      "unit_price": 45000,
      "total_price": 90000
    }
  ],
  "payment_method": "cash",
  "discount_applied": 0,
  "points_earned": 125,
  "notes": "سرویس سریع و عالی"
}
```

#### Get Customer Visit History
```http
GET /api/crm/customers/:id/visits
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `from_date`, `to_date`: Date range filter
- `min_amount`, `max_amount`: Amount range filter

---

### 3. Loyalty Program | برنامه وفاداری

#### Get Customer Loyalty Status
```http
GET /api/crm/customers/:id/loyalty
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_points": 250,
    "points_earned_total": 1200,
    "points_redeemed_total": 950,
    "tier_level": "silver",
    "tier_benefits": [
      "10% discount on beverages",
      "Birthday special offer",
      "Priority seating"
    ],
    "next_tier": {
      "level": "gold",
      "points_needed": 750,
      "additional_benefits": ["Free wifi", "Complimentary dessert monthly"]
    },
    "lifetime_spent": 1250000,
    "tier_start_date": "2023-08-15"
  }
}
```

#### Award Points
```http
POST /api/crm/loyalty/award-points
```

**Request Body:**
```json
{
  "customer_id": "uuid",
  "points": 100,
  "reason": "Purchase reward",
  "transaction_id": "uuid", // Optional reference
  "notes": "Points for order #12345"
}
```

#### Redeem Points
```http
POST /api/crm/loyalty/redeem-points
```

**Request Body:**
```json
{
  "customer_id": "uuid",
  "points": 200,
  "reward_type": "discount",
  "reward_value": 20000, // 20,000 IRR discount
  "applied_to_order": "uuid",
  "notes": "10% discount applied"
}
```

---

### 4. Marketing Campaigns | کمپین‌های بازاریابی

#### Get All Campaigns
```http
GET /api/crm/campaigns
```

#### Create Campaign
```http
POST /api/crm/campaigns
```

**Request Body:**
```json
{
  "name": "کمپین تولد بهمن ماه",
  "description": "پیام تبریک تولد برای مشتریان متولد بهمن",
  "type": "sms",
  "target_segment": {
    "birthday_month": 11,
    "tier_levels": ["silver", "gold"],
    "last_visit_days": 30
  },
  "template_content": "سلام {{name}} عزیز! 🎉 تولدت مبارک! با کد BIRTHDAY20 از 20% تخفیف ویژه استفاده کن. {{cafe_name}}",
  "scheduled_date": "2024-02-01T09:00:00Z",
  "send_immediately": false
}
```

#### Send Campaign
```http
POST /api/crm/campaigns/:id/send
```

#### Get Campaign Statistics
```http
GET /api/crm/campaigns/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_id": "uuid",
    "name": "کمپین تولد بهمن ماه",
    "status": "completed",
    "sent_at": "2024-02-01T09:00:00Z",
    "statistics": {
      "total_targeted": 45,
      "messages_sent": 45,
      "messages_delivered": 43,
      "messages_failed": 2,
      "delivery_rate": 95.6,
      "estimated_cost": 2250,
      "actual_cost": 2150
    },
    "delivery_details": [
      {
        "customer_id": "uuid",
        "phone": "09123456789",
        "status": "delivered",
        "delivered_at": "2024-02-01T09:01:32Z",
        "cost": 50
      }
    ]
  }
}
```

---

### 5. Feedback System | سیستم بازخورد

#### Submit Feedback
```http
POST /api/crm/feedback
```

**Request Body:**
```json
{
  "customer_id": "uuid",
  "customer_phone": "09123456789", // Alternative identifier
  "visit_id": "uuid", // Optional
  "rating": 5,
  "comment": "سرویس بسیار عالی و قهوه فوق‌العاده!",
  "categories": ["service", "quality", "ambiance"],
  "feedback_source": "qr_code", // qr_code, staff_tablet, sms_link
  "table_number": "A5" // Optional
}
```

#### Get Feedback Analytics
```http
GET /api/crm/feedback/analytics
```

**Query Parameters:**
- `from_date`, `to_date`: Date range
- `rating_filter`: Filter by rating (1-5)
- `category`: Filter by feedback category

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_feedback": 156,
      "average_rating": 4.3,
      "response_rate": 68.5
    },
    "rating_distribution": {
      "5_star": 45,
      "4_star": 38,
      "3_star": 28,
      "2_star": 12,
      "1_star": 8
    },
    "category_scores": {
      "service": 4.5,
      "quality": 4.2,
      "ambiance": 4.1,
      "value": 3.9
    },
    "trends": {
      "weekly_average": [4.1, 4.3, 4.2, 4.4],
      "improvement_areas": ["value", "wait_time"]
    }
  }
}
```

---

### 6. Customer Segmentation | بخش‌بندی مشتریان

#### Get Segments
```http
GET /api/crm/segments
```

**Response:**
```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "id": "new_customers",
        "name": "مشتریان جدید",
        "description": "مشتریانی که کمتر از 30 روز پیش ثبت نام کرده‌اند",
        "count": 23,
        "criteria": {
          "created_within_days": 30,
          "visit_count": {"max": 3}
        }
      },
      {
        "id": "regular_customers", 
        "name": "مشتریان منظم",
        "description": "مشتریانی که ماهانه حداقل 4 بار مراجعه می‌کنند",
        "count": 67,
        "criteria": {
          "monthly_visits": {"min": 4},
          "last_visit_days": {"max": 14}
        }
      }
    ]
  }
}
```

---

## 📊 Analytics Endpoints | نقاط پایانی تجزیه و تحلیل

### Customer Analytics
```http
GET /api/crm/analytics/customers
```

### Revenue Analytics  
```http
GET /api/crm/analytics/revenue
```

### Campaign Performance
```http
GET /api/crm/analytics/campaigns
```

---

## 🔒 Error Handling | مدیریت خطاها

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "مشتری با این شماره تلفن یافت نشد",
    "message_en": "Customer with this phone number not found",
    "details": {
      "phone": "09123456789",
      "suggestion": "لطفا شماره تلفن را بررسی کنید"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Common Error Codes
- `INVALID_PHONE_FORMAT`: فرمت شماره تلفن نامعتبر
- `CUSTOMER_ALREADY_EXISTS`: مشتری با این شماره قبلا ثبت شده
- `INSUFFICIENT_POINTS`: امتیاز کافی برای استفاده موجود نیست
- `CAMPAIGN_ALREADY_SENT`: این کمپین قبلا ارسال شده
- `SMS_PROVIDER_ERROR`: خطا در ارسال پیامک
- `RATE_LIMIT_EXCEEDED`: تعداد درخواست‌ها از حد مجاز تجاوز کرده

---

## 🚀 Implementation Notes | نکات پیاده‌سازی

### Phone Number Handling
- Store in standardized format: `+98XXXXXXXXX`
- Accept input formats: `09XXXXXXXXX`, `+989XXXXXXXXX`, `00989XXXXXXXXX`
- Validate Iranian mobile prefixes: 901, 902, 903, 905, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 930, 933, 934, 935, 936, 937, 938, 939

### Persian Text Support
- Use UTF-8 encoding for all text fields
- Support Persian/Arabic numerals in display
- Implement RTL text direction handling
- Validate Persian text input properly

### Rate Limiting Strategy
- Customer operations: 100 requests/minute
- Campaign operations: 10 requests/minute  
- Analytics: 50 requests/minute
- Feedback submission: 20 requests/minute

### Caching Strategy
- Customer profiles: 1 hour TTL
- Loyalty calculations: 30 minutes TTL
- Analytics data: 6 hours TTL
- Segment counts: 1 hour TTL

---

*This API specification will evolve based on implementation feedback and user requirements.* 