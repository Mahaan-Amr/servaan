# Integration Requirements - Ordering & Sales System
## نیازمندی‌های ادغام - سیستم سفارش‌گیری و فروش

### 📋 Overview | نمای کلی

This document outlines the integration requirements between the Ordering & Sales System and other existing workspaces in the Servaan platform. These integrations are crucial for maintaining data consistency and providing a seamless user experience.

**🎯 CURRENT STATUS**: Menu Management & Recipe System Complete (100%), Core Integrations Next Priority

---

## 🔄 Required Integrations | ادغام‌های مورد نیاز

### 1. Inventory Management Integration | ادغام مدیریت موجودی

#### **Purpose**: Recipe-based stock management and real-time cost tracking
#### **نقش**: مدیریت موجودی بر اساس دستور پخت و پیگیری هزینه بلادرنگ

**✅ Prerequisites COMPLETED:**
- ✅ Recipe System fully implemented with ingredient management
- ✅ Optional inventory linking for menu items
- ✅ Real-time cost calculation and profit analysis
- ✅ RecipeIngredient model with inventory item relationships

**Integration Points:**
- [x] **Recipe-Based Stock Validation** ✅ (COMPLETE - 2025-01-27)
  - ✅ Check ingredient availability for menu items with recipes
  - ✅ Validate sufficient stock for all recipe ingredients during order creation
  - ✅ Real-time stock updates via WebSocket (IMPLEMENTED)
  - ✅ Auto-disable menu items when critical ingredients are out of stock
  - ✅ Handle optional vs required ingredient availability
  - ⏭️ Show real-time stock levels in POS interface (future enhancement)

- [x] **Advanced Stock Deduction** ✅ (COMPLETE - 2025-01-27)
  - ✅ Deduct multiple ingredients when order with recipe items is completed
  - ✅ Handle ingredient quantity calculations based on recipe portions
  - ✅ Support partial stock deductions for partially fulfilled orders (IMPLEMENTED)
  - ✅ Maintain detailed audit trail of ingredient stock movements
  - ✅ Order references in inventory entries (orderId, orderItemId fields)
  - ✅ Stock deduction when individual items marked as prepared
  - ⏭️ Handle recipe modifications and ingredient substitutions (future enhancement)

- [x] **Recipe Cost Integration** ✅ (COMPLETE - 2025-01-27)
  - ✅ Retrieve current cost price for recipe ingredients for COGS calculation
  - ✅ Track cost variations over time for recipe profitability analysis
  - ✅ Calculate profit margins automatically using real ingredient costs
  - ✅ Support weighted average cost method for recipe costing
  - ✅ Update menu item costs when ingredient prices change (AUTOMATIC)
  - ✅ Real-time cost updates via WebSocket notifications

- [x] **Enhanced Low Stock Alerts** ✅ (COMPLETE)
  - ✅ Generate alerts when recipe ingredients are running low
  - ✅ Prioritize alerts based on ingredient usage frequency
  - ✅ Integrate with existing notification system for real-time alerts
  - ✅ Support customizable stock level thresholds per ingredient
  - ⏭️ Provide purchase recommendations with recipe demand forecasting (future enhancement)

**Implemented API Endpoints:**
```typescript
// Recipe-Based Stock Validation
GET /api/inventory/stock-validation/:menuItemId
POST /api/inventory/validate-order-stock
POST /api/inventory/stock-override
GET /api/inventory/low-stock-alerts
POST /api/inventory/update-menu-availability

// Stock Deduction
POST /api/ordering/orders/items/:orderItemId/prepare  // NEW: Partial stock deduction
// Stock deduction happens automatically on order completion and item preparation

// Recipe Cost Integration
POST /api/inventory/update-recipe-costs
GET /api/inventory/integration-status

// WebSocket Events
inventory:stock-updated  // Real-time stock updates
recipe:cost-updated      // Real-time recipe cost updates
```

**Implementation Status**: ✅ **COMPLETE** - 2025-01-27
**Implementation Time**: Completed in phases (2025-01-27)

---

### 2. Accounting System Integration | ادغام سیستم حسابداری

#### **Purpose**: Recipe-based COGS tracking and automatic financial record keeping
#### **نقش**: پیگیری بهای تمام شده بر اساس دستور پخت و نگهداری خودکار سوابق مالی

**✅ Prerequisites COMPLETED:**
- ✅ Recipe system with ingredient cost tracking
- ✅ Real-time profit/loss calculation
- ✅ Cost analysis for menu items
- ✅ Recipe cost persistence and updates

**Integration Points:**
- [ ] **Recipe-Based Sales Journal Entries** (HIGH PRIORITY)
  - Auto-generate journal entries for completed orders using recipe data
  - Calculate accurate COGS using recipe ingredient costs and quantities
  - Support different payment methods (cash, card, credit) with recipe context
  - Handle tax calculations according to Iranian standards
  - Create proper debit/credit entries with recipe cost breakdown

- [ ] **Advanced Cost of Goods Sold (COGS)** (HIGH PRIORITY)
  - Calculate COGS based on recipe ingredient costs from inventory
  - Generate detailed COGS journal entries with ingredient breakdown
  - Support different costing methods (FIFO, weighted average) for recipes
  - Track gross profit margins with real recipe costs
  - Handle recipe modifications and cost adjustments

- [ ] **Recipe-Aware Tax Management** (MEDIUM PRIORITY)
  - Calculate VAT and other applicable taxes on menu items with recipes
  - Generate tax journal entries with proper cost allocation
  - Support tax-exempt transactions and ingredients
  - Create detailed tax summary reports with recipe cost analysis
  - Handle different tax rates for different ingredient categories

- [ ] **Enhanced Refund Handling** (MEDIUM PRIORITY)
  - Generate reverse journal entries for refunds using recipe costs
  - Handle partial refunds with proper COGS reversals
  - Track refund reasons and approvals with cost impact
  - Maintain complete audit trail with recipe cost details
  - Handle inventory restoration for recipe ingredients

**Required Service Integration:**
```typescript
// Enhanced for Recipe System
interface RecipeOrderJournalEntry {
  orderId: string;
  menuItems: {
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    recipeCosts: {
      ingredientId: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[];
    totalRecipeCost: number;
    profitMargin: number;
  }[];
  totalAmount: number;
  totalCOGS: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
}

// Enhanced methods needed
JournalEntryService.generateRecipeOrderSalesEntry(orderData: RecipeOrderJournalEntry)
JournalEntryService.generateRecipeRefundEntry(refundData: RecipeRefundJournalEntry)
JournalEntryService.getRecipeProfitabilityReport(dateRange: DateRange)
```

**Implementation Priority**: **HIGH - IMMEDIATE**
**Estimated Integration Time**: 10 hours (expanded for recipe COGS complexity)

---

### 3. CRM Integration | ادغام مدیریت مشتریان

#### **Purpose**: Customer preference tracking and loyalty program with recipe context
#### **نقش**: پیگیری ترجیحات مشتری و برنامه وفاداری با در نظر گیری دستور پخت

**Integration Points:**
- [ ] **Enhanced Customer Visit Tracking** (MEDIUM PRIORITY)
  - Auto-create customer visits from orders with menu item and recipe details
  - Update customer purchase history with recipe preferences
  - Track customer preferences for specific ingredients and dietary restrictions
  - Calculate customer lifetime value with recipe cost analysis
  - Identify customer favorite menu items and ingredients

- [ ] **Recipe-Aware Loyalty Program Integration** (MEDIUM PRIORITY)
  - Implement points earning on purchases with recipe complexity bonuses
  - Add points redemption during payment with recipe cost validation
  - Create loyalty tier benefits based on recipe order patterns
  - Generate loyalty reports with recipe preferences analysis
  - Offer personalized menu recommendations based on recipe history

**Implementation Priority**: **MEDIUM**
**Estimated Integration Time**: 8 hours

---

### 4. Real-time Features Integration | ادغام ویژگی‌های لحظه‌ای

#### **Purpose**: Live updates for kitchen display and inventory with recipe context
#### **نقش**: به‌روزرسانی زنده برای نمایشگر آشپزخانه و موجودی با در نظر گیری دستور پخت

**Integration Points:**
- [x] **Recipe-Aware Kitchen Display** ✅ (COMPLETE)
  - ✅ Real-time order updates with recipe ingredient details
  - ✅ Display ingredient preparation instructions and quantities
  - ✅ Show cooking time estimates based on recipe complexity
  - ✅ Track preparation progress for multi-ingredient recipes
  - ✅ Automatic stock deduction when items marked as READY
  - ⏭️ Alert kitchen staff about ingredient substitutions or shortages (future enhancement)

- [x] **Real-time Inventory Updates** ✅ (COMPLETE - 2025-01-27)
  - ✅ Live stock level updates when recipe orders are completed (WebSocket)
  - ✅ Real-time cost updates when ingredient prices change (WebSocket)
  - ✅ Instant menu item availability updates based on ingredient stock
  - ✅ Live profit margin updates as costs fluctuate
  - ✅ Real-time alerts for ingredient shortages affecting recipes

**Implementation Status**: ✅ **COMPLETE** - 2025-01-27
**Implementation Time**: Completed in phases (2025-01-27)

---

## 🎯 **UPDATED INTEGRATION ROADMAP**

### **✅ COMPLETED (100%)**
- ✅ **Menu Management System**: Full CRUD with recipe support
- ✅ **Recipe System**: Ingredient management with cost tracking
- ✅ **Database Schema**: Recipe and RecipeIngredient models
- ✅ **API Infrastructure**: Recipe-related endpoints (10+ new endpoints)
- ✅ **Frontend Interface**: Advanced menu management with recipe UI

### **✅ PHASE 3: CRITICAL INTEGRATIONS (COMPLETE - 2025-01-27)**

#### **✅ Inventory Integration** (COMPLETE)
1. ✅ **Recipe Stock Validation**: Implemented ingredient availability checking
2. ✅ **Cost Integration**: Connected recipe costs with inventory prices (automatic updates)
3. ✅ **Stock Deduction**: Implemented multi-ingredient deductions with partial order support
4. ✅ **Availability Updates**: Auto-disable items when ingredients are out
5. ✅ **Order References**: Direct foreign key relationships (orderId, orderItemId)
6. ✅ **Stock Restoration**: Automatic restoration on order cancellation

#### **⏭️ Accounting Integration** (FUTURE - Accounting workspace disabled)
1. ⏭️ **Recipe COGS**: Calculate accurate costs using ingredient data
2. ⏭️ **Journal Entries**: Auto-generate sales entries with recipe breakdown
3. ⏭️ **Profit Analysis**: Real-time profit tracking with ingredient costs
4. ⏭️ **Tax Handling**: Iranian tax calculations with recipe context

#### **✅ Real-time Features** (COMPLETE - 2025-01-27)
1. ✅ **Kitchen Display**: Recipe-aware order display with automatic stock deduction
2. ✅ **Live Updates**: WebSocket integration for inventory/kitchen (COMPLETE)
3. ✅ **Real-time Stock Updates**: Live stock level updates via WebSocket
4. ✅ **Real-time Cost Updates**: Automatic recipe cost updates when prices change

### **🎨 PHASE 4: ADVANCED UI (Following Integrations)**
- **Table Management**: Visual layout and reservations
- **Enhanced Analytics**: Recipe cost analysis and profitability
- **Advanced Kitchen Display**: Multi-station recipe workflow
- **Comprehensive Reports**: Recipe performance and cost analysis

---

## 📊 **INTEGRATION SUCCESS METRICS**

### **Technical Metrics (Target)**
- Recipe stock validation response time < 500ms
- COGS calculation accuracy > 99%
- Real-time updates latency < 100ms
- Integration test coverage > 95%

### **Business Metrics (Target)**
- Reduced inventory waste by 25% (accurate recipe portions)
- Improved profit margin tracking accuracy by 40%
- Faster order processing with recipe context
- Enhanced customer satisfaction with accurate availability

### **Quality Metrics (Target)**
- Zero data consistency issues across workspaces
- 100% audit trail for recipe cost changes
- Complete integration test coverage
- Performance benchmarks met under load

---

## 🚨 **CRITICAL SUCCESS FACTORS**

### **Technical Requirements**
1. **Data Consistency**: Recipe changes must sync across all systems
2. **Performance**: Recipe calculations must not slow down order processing
3. **Reliability**: Integration failures must not break core functionality
4. **Scalability**: Support multiple concurrent recipe orders

### **Business Requirements**
1. **Accuracy**: Recipe costs must reflect real inventory costs
2. **Real-time**: Stock levels and costs must update immediately
3. **Audit Trail**: All recipe cost changes must be tracked
4. **User Experience**: Integration must be seamless for staff

---

*Last Updated: January 27, 2025*
*Version: 4.0*
*Status: Inventory Integration Complete (95%), Real-time Features Complete, Accounting Integration Disabled*
*Priority: Testing & Validation → Future Enhancements (Ingredient Substitution, Recipe Yield Management)* 