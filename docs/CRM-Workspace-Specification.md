# CRM Workspace Specification
## مشخصات فضای کاری مدیریت ارتباط با مشتری

### Overview | نمای کلی
Customer Relationship Management (CRM) workspace for Servaan platform, designed specifically for Iranian cafe and restaurant businesses. Focus on simplicity, Persian localization, and essential features that drive customer retention and revenue growth.

**Primary Goal**: Enable non-technical cafe staff to manage customer relationships effectively without hardware dependencies.

---

## 🎯 Core Objectives | اهداف اصلی

### Business Goals
- **Customer Retention**: Increase repeat visits through loyalty programs
- **Revenue Growth**: Drive sales through targeted marketing campaigns  
- **Customer Satisfaction**: Collect and act on customer feedback
- **Operational Efficiency**: Streamline customer service processes

### Technical Goals
- **Standalone Operation**: No POS hardware integration required
- **Simple UX**: Intuitive interface for non-technical staff
- **Cost Transparency**: User-pays API model with clear pricing
- **Future-Ready**: Architecture supports single cafes → chains migration

---

## 📋 Feature Prioritization | اولویت‌بندی ویژگی‌ها

### 🟢 Phase 1: CRM Essentials (MVP)
**Timeline**: 6-8 weeks

#### 1. Customer Database & Profiles
- **Phone-based lookup** (primary identifier for Iranian market)
- Customer basic info (name, phone, email optional)
- Visit history and frequency tracking
- Spend analysis and customer lifetime value
- Notes and preferences storage

#### 2. Simple Loyalty Program
- **Points accumulation** system (e.g., 1 point per 1000 IRR spent)
- **Rewards redemption** (e.g., 100 points = 10% discount)
- **VIP status levels** (Bronze, Silver, Gold based on spending)
- Manual points adjustment (for staff discretion)

#### 3. Basic Customer Segmentation
- **Visit frequency** (New, Occasional, Regular, VIP)
- **Spending habits** (Budget, Average, Premium)
- **Special occasions** (Birthday, Anniversary tracking)
- Custom tags for manual categorization

#### 4. Essential Marketing
- **SMS campaigns** for birthdays and special occasions
- **Promotional announcements** (new menu, special offers)
- **Basic templates** in Persian for common scenarios
- Campaign delivery tracking (sent, delivered, failed)

#### 5. Feedback Collection
- **Simple satisfaction surveys** (1-5 star rating + comment)
- **QR code generation** for table-based feedback
- **Post-service follow-up** (optional SMS with survey link)
- Basic sentiment analysis and reporting

### 🟡 Phase 2: Enhanced Features (3-4 months)
- Instagram integration for marketing
- Advanced customer analytics
- Automated campaign triggers
- Mobile customer portal
- Multi-location support preparation

### 🟠 Phase 3: Advanced Features (6+ months)
- AI-powered customer insights
- Advanced marketing automation
- Third-party integrations
- Mobile apps

---

## 🏗️ System Architecture | معماری سیستم

### Database Design
```sql
-- Core customer table
customers {
  id: UUID PRIMARY KEY
  phone: VARCHAR(15) UNIQUE NOT NULL  -- Primary identifier
  name: VARCHAR(100)
  email: VARCHAR(100)
  birthday: DATE
  anniversary: DATE
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  status: ENUM('active', 'inactive', 'blocked')
  notes: TEXT
  preferences: JSONB
}

-- Customer visits tracking
customer_visits {
  id: UUID PRIMARY KEY
  customer_id: UUID REFERENCES customers(id)
  visit_date: TIMESTAMP
  total_amount: DECIMAL(10,2)
  items_ordered: JSONB
  payment_method: VARCHAR(50)
  feedback_rating: INTEGER
  feedback_comment: TEXT
  created_at: TIMESTAMP
}

-- Loyalty program
customer_loyalty {
  id: UUID PRIMARY KEY
  customer_id: UUID REFERENCES customers(id)
  points_earned: INTEGER DEFAULT 0
  points_redeemed: INTEGER DEFAULT 0
  current_points: INTEGER DEFAULT 0
  tier_level: ENUM('bronze', 'silver', 'gold', 'platinum')
  tier_start_date: DATE
  lifetime_spent: DECIMAL(12,2) DEFAULT 0
}

-- Marketing campaigns
campaigns {
  id: UUID PRIMARY KEY
  name: VARCHAR(200)
  description: TEXT
  type: ENUM('sms', 'instagram', 'email')
  target_segment: JSONB
  template_content: TEXT
  scheduled_date: TIMESTAMP
  status: ENUM('draft', 'scheduled', 'sent', 'cancelled')
  created_by: UUID
  created_at: TIMESTAMP
}

-- Campaign delivery tracking
campaign_deliveries {
  id: UUID PRIMARY KEY
  campaign_id: UUID REFERENCES campaigns(id)
  customer_id: UUID REFERENCES customers(id)
  delivery_status: ENUM('sent', 'delivered', 'failed', 'opened')
  delivered_at: TIMESTAMP
  error_message: TEXT
}
```

### Integration Points
- **Business Intelligence**: Share customer data for analytics
- **Accounting System**: Pull transaction data for spend tracking
- **Inventory Management**: Product preferences and recommendations
- **Authentication**: Use existing user management system

---

## 🎨 User Experience Design | طراحی تجربه کاربری

### Design Principles
1. **Persian-First**: RTL layout, Farsi labels, Iranian UX patterns
2. **One-Click Actions**: Common tasks should be single clicks
3. **Visual Hierarchy**: Clear information architecture
4. **Error Prevention**: Validate inputs and provide helpful guidance
5. **Mobile-Responsive**: Works on tablets and phones

### Key User Journeys

#### 1. Staff: Quick Customer Lookup
```
Enter phone number → Auto-complete suggestions → Customer profile loads
→ View visit history, loyalty points, preferences
→ Add visit notes or update preferences
```

#### 2. Manager: Send Birthday Campaign
```
Navigate to Marketing → Birthday campaigns → Review eligible customers
→ Customize message template → Schedule send date → Review and send
→ Track delivery status and responses
```

#### 3. Customer: Provide Feedback
```
Scan QR code at table → Simple rating interface (1-5 stars)
→ Optional comment field → Submit → Thank you + loyalty points added
```

---

## 📱 Communication Strategy | استراتژی ارتباطات

### SMS Integration
**Provider Options** (user choice with transparent pricing):
- **Kavenegar** (~50-100 IRR per SMS)
- **RayganSMS** (~40-80 IRR per SMS)  
- **Farazsms** (~60-120 IRR per SMS)

**Features**:
- Bulk SMS campaigns
- Personalized messages (customer name, points balance)
- Delivery status tracking
- Persian text support (Unicode)
- Opt-out management

### Instagram Integration (Phase 2)
**Approach**: Instagram Business API
- Automated DM campaigns
- Story/post scheduling
- Hashtag-based customer discovery
- Content calendar management

---

## 💰 Pricing Strategy | استراتژی قیمت‌گذاری

### Transparent API Costs
Display real-time pricing to users:

```
SMS Campaign Costs:
📱 100 customers × 50 IRR = 5,000 IRR
📱 500 customers × 45 IRR = 22,500 IRR
📱 1000+ customers × 40 IRR = Custom quote

Instagram API:
📸 Basic plan: 50,000 IRR/month
📸 Pro plan: 150,000 IRR/month
```

### Usage-Based Billing
- Pay only for what you use
- Monthly billing with detailed breakdown
- Free tier: 50 SMS/month, basic features
- No setup fees or hidden costs

---

## 🔧 Technical Implementation | پیاده‌سازی فنی

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **SMS**: Multiple provider SDKs with abstraction layer
- **Real-time**: WebSocket for live campaign tracking
- **File Storage**: Local/cloud for customer images, documents

### API Design Principles
```typescript
// RESTful endpoints
GET    /api/crm/customers              // List customers
POST   /api/crm/customers              // Create customer
GET    /api/crm/customers/:phone       // Get by phone
PUT    /api/crm/customers/:id          // Update customer
DELETE /api/crm/customers/:id          // Soft delete

GET    /api/crm/campaigns              // List campaigns  
POST   /api/crm/campaigns              // Create campaign
POST   /api/crm/campaigns/:id/send     // Send campaign
GET    /api/crm/campaigns/:id/stats    // Campaign analytics
```

### Data Privacy & Security
- **GDPR-inspired** data protection
- Customer consent management
- Data encryption at rest and in transit
- Regular backup and recovery procedures
- Audit logging for all customer data access

---

## 📊 Analytics & Reporting | تجزیه و تحلیل

### Key Metrics Dashboard
1. **Customer Overview**
   - Total customers, new this month
   - Average visits per customer
   - Customer lifetime value
   - Retention rate

2. **Loyalty Program Performance**
   - Points issued vs. redeemed
   - Tier distribution
   - Reward redemption patterns

3. **Campaign Effectiveness**
   - Delivery rates by channel
   - Open/response rates
   - ROI per campaign
   - Best performing message types

4. **Feedback Analysis**
   - Average satisfaction score
   - Feedback trends over time
   - Common complaint themes
   - Service improvement opportunities

---

## 🚀 Implementation Roadmap | نقشه راه اجرا

### Week 1-2: Foundation
- Database schema design and creation
- Basic customer CRUD operations
- Authentication integration
- Phone number validation and formatting

### Week 3-4: Core Features
- Customer profile management
- Visit tracking (manual entry initially)
- Basic loyalty points system
- Simple customer search and filtering

### Week 5-6: Marketing Basics
- SMS provider integration (start with one)
- Campaign creation and template management
- Basic customer segmentation
- Campaign sending and delivery tracking

### Week 7-8: Feedback & Polish
- QR code feedback system
- Basic analytics dashboard
- UI/UX refinements based on testing
- Persian localization completion

### Phase 2 Planning (Month 3)
- Instagram integration research
- Advanced analytics planning
- Multi-location architecture design
- User feedback incorporation

---

## ✅ Success Criteria | معیارهای موفقیت

### Technical Success
- ✅ 99.5% uptime for customer lookups
- ✅ <2 second response time for search
- ✅ 95% SMS delivery success rate
- ✅ Zero customer data loss incidents

### Business Success  
- ✅ 80% user adoption rate within 30 days
- ✅ 15% increase in customer retention
- ✅ 25% improvement in customer satisfaction scores
- ✅ Positive ROI on marketing campaigns

### User Experience Success
- ✅ Staff can complete customer lookup in <10 seconds
- ✅ Campaign creation takes <5 minutes
- ✅ 90% of users rate system as "easy to use"
- ✅ <2 support tickets per user per month

---

## 📞 Support & Training | پشتیبانی و آموزش

### Training Materials (Persian)
- Video tutorials for each major feature
- Step-by-step guides with screenshots
- FAQ covering common scenarios
- Best practices for customer service

### Support Channels
- In-app help system
- Phone support during business hours
- Email support with 24-hour response SLA
- Community forum for user discussions

---

*This specification serves as the foundation for CRM workspace development. Regular updates and refinements based on user feedback and technical discoveries are expected.* 