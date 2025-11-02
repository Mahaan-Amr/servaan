# ✅ CRM — Current Scope (2025-10-20)

- Customer analytics available via ordering analytics; dedicated CRM models/APIs in this doc are planned unless present in code.
- See `capabilities_matrix.md` for current status.

---

# CRM Database Schema
## طراحی پایگاه داده مدیریت ارتباط با مشتری

### Overview | نمای کلی
Complete database schema design for Servaan CRM workspace. Optimized for Iranian cafe/restaurant businesses with focus on phone-based customer identification and Persian localization.

**Database**: PostgreSQL 14+
**Encoding**: UTF-8 (Persian text support)
**Collation**: Persian-aware collation for proper sorting

---

## 📋 Core Tables | جداول اصلی

### 1. Customers Table | جدول مشتریان
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL, -- Persian mobile format: +989XXXXXXXXX
    phone_normalized VARCHAR(15) GENERATED ALWAYS AS (
        CASE 
            WHEN phone LIKE '09%' THEN '+98' || SUBSTRING(phone FROM 2)
            WHEN phone LIKE '+989%' THEN phone
            WHEN phone LIKE '00989%' THEN '+98' || SUBSTRING(phone FROM 4)
            ELSE phone
        END
    ) STORED,
    
    -- Basic Information
    name VARCHAR(100) NOT NULL,
    name_english VARCHAR(100), -- Optional English name
    email VARCHAR(255),
    
    -- Personal Dates
    birthday DATE,
    anniversary DATE,
    
    -- Status and Categorization
    status customer_status_enum NOT NULL DEFAULT 'active',
    segment customer_segment_enum NOT NULL DEFAULT 'new',
    
    -- Additional Information
    notes TEXT,
    preferences JSONB DEFAULT '{}',
    
    -- Location Information (optional)
    address TEXT,
    city VARCHAR(50),
    postal_code VARCHAR(10),
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN GENERATED ALWAYS AS (deleted_at IS NULL) STORED
);

-- Enums
CREATE TYPE customer_status_enum AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE customer_segment_enum AS ENUM ('new', 'occasional', 'regular', 'vip');

-- Indexes
CREATE INDEX idx_customers_phone ON customers(phone_normalized);
CREATE INDEX idx_customers_name ON customers USING gin(name gin_trgm_ops);
CREATE INDEX idx_customers_status ON customers(status) WHERE is_active = true;
CREATE INDEX idx_customers_segment ON customers(segment) WHERE is_active = true;
CREATE INDEX idx_customers_birthday ON customers(birthday) WHERE is_active = true;
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Persian text search
CREATE INDEX idx_customers_search ON customers USING gin(
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(phone, ''))
);
```

### 2. Customer Visits | جدول بازدیدهای مشتریان
```sql
CREATE TABLE customer_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Visit Details
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_number INTEGER, -- Sequential number for this customer
    
    -- Financial Information
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - discount_amount) STORED,
    payment_method payment_method_enum,
    
    -- Order Details
    items_ordered JSONB DEFAULT '[]',
    item_count INTEGER GENERATED ALWAYS AS (
        COALESCE((items_ordered->>'total_items')::integer, 0)
    ) STORED,
    
    -- Service Information
    table_number VARCHAR(10),
    server_name VARCHAR(100),
    service_duration INTEGER, -- minutes
    
    -- Feedback
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    feedback_categories TEXT[],
    
    -- Loyalty Integration
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Notes
    visit_notes TEXT
);

CREATE TYPE payment_method_enum AS ENUM (
    'cash', 'card', 'online', 'points', 'mixed'
);

-- Indexes
CREATE INDEX idx_visits_customer ON customer_visits(customer_id);
CREATE INDEX idx_visits_date ON customer_visits(visit_date);
CREATE INDEX idx_visits_amount ON customer_visits(final_amount);
CREATE INDEX idx_visits_rating ON customer_visits(feedback_rating);

-- Trigger to update visit_number
CREATE OR REPLACE FUNCTION update_visit_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.visit_number IS NULL THEN
        NEW.visit_number := (
            SELECT COALESCE(MAX(visit_number), 0) + 1
            FROM customer_visits 
            WHERE customer_id = NEW.customer_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visit_number
    BEFORE INSERT ON customer_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_visit_number();
```

### 3. Customer Loyalty | جدول وفاداری مشتریان
```sql
CREATE TABLE customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Points System
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    current_points INTEGER GENERATED ALWAYS AS (points_earned - points_redeemed) STORED,
    
    -- Tier System
    tier_level loyalty_tier_enum DEFAULT 'bronze',
    tier_start_date DATE DEFAULT CURRENT_DATE,
    tier_expires_date DATE,
    
    -- Spending Tracking
    lifetime_spent DECIMAL(15,2) DEFAULT 0,
    current_year_spent DECIMAL(12,2) DEFAULT 0,
    current_month_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Visit Tracking
    total_visits INTEGER DEFAULT 0,
    visits_this_month INTEGER DEFAULT 0,
    last_visit_date DATE,
    first_visit_date DATE,
    
    -- Tier Calculations
    points_to_next_tier INTEGER GENERATED ALWAYS AS (
        CASE tier_level
            WHEN 'bronze' THEN GREATEST(0, 500 - current_points)
            WHEN 'silver' THEN GREATEST(0, 1500 - current_points)
            WHEN 'gold' THEN GREATEST(0, 3000 - current_points)
            WHEN 'platinum' THEN 0
        END
    ) STORED,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE loyalty_tier_enum AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Indexes
CREATE INDEX idx_loyalty_customer ON customer_loyalty(customer_id);
CREATE INDEX idx_loyalty_tier ON customer_loyalty(tier_level);
CREATE INDEX idx_loyalty_points ON customer_loyalty(current_points);
CREATE INDEX idx_loyalty_spent ON customer_loyalty(lifetime_spent);
```

### 4. Loyalty Transactions | جدول تراکنش‌های وفاداری
```sql
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Transaction Details
    transaction_type loyalty_transaction_enum NOT NULL,
    points_change INTEGER NOT NULL, -- Positive for earning, negative for redemption
    
    -- Reference Information
    visit_id UUID REFERENCES customer_visits(id),
    campaign_id UUID REFERENCES campaigns(id),
    order_reference VARCHAR(100),
    
    -- Description
    description TEXT NOT NULL,
    notes TEXT,
    
    -- Financial Reference
    related_amount DECIMAL(10,2), -- Amount that generated these points
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Balance after transaction
    balance_after INTEGER NOT NULL
);

CREATE TYPE loyalty_transaction_enum AS ENUM (
    'earned_purchase',    -- Points earned from purchase
    'earned_bonus',       -- Bonus points (manual award)
    'earned_referral',    -- Referral bonus
    'earned_birthday',    -- Birthday bonus
    'redeemed_discount',  -- Points redeemed for discount
    'redeemed_item',      -- Points redeemed for free item
    'adjustment_add',     -- Manual positive adjustment
    'adjustment_subtract', -- Manual negative adjustment
    'expired'             -- Points expired
);

-- Indexes
CREATE INDEX idx_loyalty_trans_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_trans_type ON loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_trans_date ON loyalty_transactions(created_at);
```

### 5. Marketing Campaigns | جدول کمپین‌های بازاریابی
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign Information
    name VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type campaign_type_enum NOT NULL,
    
    -- Targeting
    target_segment JSONB NOT NULL DEFAULT '{}',
    estimated_recipients INTEGER,
    
    -- Content
    template_content TEXT NOT NULL,
    template_variables JSONB DEFAULT '{}',
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status campaign_status_enum DEFAULT 'draft',
    
    -- Budget and Costs
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    cost_per_message DECIMAL(6,2),
    
    -- Performance Tracking
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    messages_opened INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Approval Workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE campaign_type_enum AS ENUM ('sms', 'instagram', 'email', 'push');
CREATE TYPE campaign_status_enum AS ENUM (
    'draft', 'scheduled', 'sending', 'sent', 'completed', 'cancelled', 'failed'
);

-- Indexes
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_date ON campaigns(scheduled_date);
CREATE INDEX idx_campaigns_creator ON campaigns(created_by);
```

### 6. Campaign Deliveries | جدول تحویل پیام‌ها
```sql
CREATE TABLE campaign_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Delivery Information
    recipient_phone VARCHAR(15) NOT NULL,
    recipient_name VARCHAR(100),
    
    -- Message Content
    message_content TEXT NOT NULL,
    personalized_content TEXT, -- After variable replacement
    
    -- Delivery Status
    delivery_status delivery_status_enum DEFAULT 'queued',
    delivery_attempts INTEGER DEFAULT 0,
    
    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error Handling
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Cost Tracking
    message_cost DECIMAL(6,2),
    
    -- Provider Information
    provider_name VARCHAR(50),
    provider_message_id VARCHAR(100),
    
    -- Engagement
    link_clicks INTEGER DEFAULT 0,
    reply_received BOOLEAN DEFAULT FALSE
);

CREATE TYPE delivery_status_enum AS ENUM (
    'queued', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'opened'
);

-- Indexes
CREATE INDEX idx_deliveries_campaign ON campaign_deliveries(campaign_id);
CREATE INDEX idx_deliveries_customer ON campaign_deliveries(customer_id);
CREATE INDEX idx_deliveries_status ON campaign_deliveries(delivery_status);
CREATE INDEX idx_deliveries_phone ON campaign_deliveries(recipient_phone);
```

### 7. Customer Feedback | جدول بازخورد مشتریان
```sql
CREATE TABLE customer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    visit_id UUID REFERENCES customer_visits(id),
    
    -- Feedback Source
    feedback_source feedback_source_enum NOT NULL,
    source_reference VARCHAR(100), -- QR code ID, SMS link ID, etc.
    
    -- Rating and Content
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    category_ratings JSONB DEFAULT '{}', -- {"service": 5, "quality": 4, "ambiance": 5}
    
    comment TEXT,
    comment_language VARCHAR(5) DEFAULT 'fa', -- fa, en
    
    -- Categorization
    feedback_categories TEXT[] DEFAULT '{}',
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    
    -- Context Information
    table_number VARCHAR(10),
    visit_date DATE,
    order_amount DECIMAL(10,2),
    
    -- Response and Follow-up
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES users(id),
    
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    device_info JSONB,
    ip_address INET
);

CREATE TYPE feedback_source_enum AS ENUM (
    'qr_code', 'staff_tablet', 'sms_link', 'website', 'phone_call', 'manual'
);

-- Indexes
CREATE INDEX idx_feedback_customer ON customer_feedback(customer_id);
CREATE INDEX idx_feedback_visit ON customer_feedback(visit_id);
CREATE INDEX idx_feedback_rating ON customer_feedback(overall_rating);
CREATE INDEX idx_feedback_source ON customer_feedback(feedback_source);
CREATE INDEX idx_feedback_date ON customer_feedback(created_at);

-- Full text search for comments
CREATE INDEX idx_feedback_comment_search ON customer_feedback 
USING gin(to_tsvector('simple', coalesce(comment, '')));
```

### 8. Customer Segments | جدول بخش‌بندی مشتریان
```sql
CREATE TABLE customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Segment Information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    segment_key VARCHAR(50) UNIQUE NOT NULL, -- For programmatic access
    
    -- Segment Criteria
    criteria JSONB NOT NULL,
    
    -- Computed Fields
    customer_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    
    -- Segment Settings
    is_system_segment BOOLEAN DEFAULT FALSE, -- Built-in vs custom
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Display
    color_hex VARCHAR(7) DEFAULT '#6B7280',
    icon_name VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Sample system segments
INSERT INTO customer_segments (name, segment_key, criteria, is_system_segment) VALUES
('مشتریان جدید', 'new_customers', 
 '{"created_within_days": 30, "visit_count": {"max": 3}}', true),
('مشتریان منظم', 'regular_customers', 
 '{"monthly_visits": {"min": 4}, "last_visit_days": {"max": 14}}', true),
('مشتریان VIP', 'vip_customers', 
 '{"lifetime_spent": {"min": 500000}, "tier_level": ["gold", "platinum"]}', true);
```

---

## 🔧 Helper Tables | جداول کمکی

### SMS Provider Settings
```sql
CREATE TABLE sms_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL,
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    cost_per_sms DECIMAL(6,2),
    is_active BOOLEAN DEFAULT TRUE,
    priority_order INTEGER DEFAULT 0,
    
    -- Rate Limiting
    daily_limit INTEGER,
    monthly_limit INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campaign Templates
```sql
CREATE TABLE campaign_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    template_type campaign_type_enum NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    category VARCHAR(50),
    is_system_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Views and Functions | نماها و توابع

### Customer Summary View
```sql
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id,
    c.phone,
    c.name,
    c.status,
    c.segment,
    c.created_at,
    
    -- Loyalty Information
    cl.current_points,
    cl.tier_level,
    cl.lifetime_spent,
    cl.total_visits,
    cl.last_visit_date,
    
    -- Recent Activity
    (SELECT visit_date FROM customer_visits cv 
     WHERE cv.customer_id = c.id 
     ORDER BY visit_date DESC LIMIT 1) as last_visit,
    
    (SELECT AVG(feedback_rating) FROM customer_feedback cf 
     WHERE cf.customer_id = c.id) as avg_rating,
    
    -- Calculated Fields
    CASE 
        WHEN cl.last_visit_date IS NULL THEN 0
        ELSE DATE_PART('day', NOW() - cl.last_visit_date)
    END as days_since_last_visit,
    
    cl.lifetime_spent / GREATEST(cl.total_visits, 1) as avg_spend_per_visit

FROM customers c
LEFT JOIN customer_loyalty cl ON c.id = cl.customer_id
WHERE c.is_active = true;
```

### Monthly Analytics Function
```sql
CREATE OR REPLACE FUNCTION get_monthly_crm_stats(target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    new_customers INTEGER,
    total_visits INTEGER,
    total_revenue DECIMAL(15,2),
    avg_rating DECIMAL(3,2),
    retention_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM customers 
         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', target_month))::INTEGER,
        
        (SELECT COUNT(*) FROM customer_visits 
         WHERE DATE_TRUNC('month', visit_date) = DATE_TRUNC('month', target_month))::INTEGER,
        
        (SELECT COALESCE(SUM(final_amount), 0) FROM customer_visits 
         WHERE DATE_TRUNC('month', visit_date) = DATE_TRUNC('month', target_month)),
        
        (SELECT COALESCE(AVG(feedback_rating), 0) FROM customer_feedback 
         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', target_month)),
        
        -- Simple retention calculation
        (SELECT 
            CASE WHEN prev_month_customers > 0 
            THEN (returning_customers::DECIMAL / prev_month_customers * 100)
            ELSE 0 END
         FROM (
            SELECT 
                COUNT(DISTINCT cv1.customer_id) as returning_customers,
                (SELECT COUNT(DISTINCT cv2.customer_id) 
                 FROM customer_visits cv2 
                 WHERE DATE_TRUNC('month', cv2.visit_date) = DATE_TRUNC('month', target_month - INTERVAL '1 month')
                ) as prev_month_customers
            FROM customer_visits cv1
            WHERE DATE_TRUNC('month', cv1.visit_date) = DATE_TRUNC('month', target_month)
            AND cv1.customer_id IN (
                SELECT DISTINCT customer_id FROM customer_visits
                WHERE DATE_TRUNC('month', visit_date) = DATE_TRUNC('month', target_month - INTERVAL '1 month')
            )
         ) retention_calc);
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 Security and Permissions | امنیت و مجوزها

### Row Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy for cafe staff (can see all customers of their cafe)
CREATE POLICY customer_cafe_access ON customers
FOR ALL TO staff_role
USING (
    EXISTS (
        SELECT 1 FROM user_cafe_access uca 
        WHERE uca.user_id = current_user_id() 
        AND uca.cafe_id = customers.cafe_id
    )
);
```

### Data Encryption
```sql
-- Encrypt sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt phone numbers (for GDPR compliance)
CREATE OR REPLACE FUNCTION encrypt_phone(phone_text TEXT, key_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_encrypt(phone_text, key_text);
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 Performance Optimization | بهینه‌سازی عملکرد

### Partitioning Strategy
```sql
-- Partition large tables by date
CREATE TABLE customer_visits_y2024 PARTITION OF customer_visits
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE customer_visits_y2025 PARTITION OF customer_visits  
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Materialized Views for Analytics
```sql
-- Daily customer statistics
CREATE MATERIALIZED VIEW daily_customer_stats AS
SELECT 
    DATE(visit_date) as stat_date,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(*) as total_visits,
    SUM(final_amount) as total_revenue,
    AVG(final_amount) as avg_order_value,
    AVG(feedback_rating) as avg_rating
FROM customer_visits cv
LEFT JOIN customer_feedback cf ON cv.id = cf.visit_id
WHERE visit_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(visit_date)
ORDER BY stat_date;

-- Refresh daily at midnight
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_customer_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 Sample Data | داده‌های نمونه

### Insert Sample Customers
```sql
-- Sample customers with Persian names
INSERT INTO customers (phone, name, email, birthday, notes, preferences) VALUES
('+989123456789', 'احمد محمدی', 'ahmad@email.com', '1985-03-15', 'مشتری منظم - ترجیح قهوه ترک', 
 '{"favorite_drink": "turkish_coffee", "allergies": [], "preferred_time": "morning"}'),
('+989987654321', 'فاطمه احمدی', 'fateme@email.com', '1990-07-22', 'ترجیح نوشیدنی سرد', 
 '{"favorite_drink": "iced_coffee", "allergies": ["nuts"], "preferred_time": "afternoon"}');

-- Update loyalty information
INSERT INTO customer_loyalty (customer_id, points_earned, lifetime_spent, total_visits) 
SELECT id, 250, 1250000, 15 FROM customers WHERE phone = '+989123456789';
```

---

*This schema provides a robust foundation for CRM functionality while maintaining flexibility for future enhancements.* 